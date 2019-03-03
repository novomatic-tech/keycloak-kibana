import yar from 'yar';
import keycloak, {KeycloakAdapter} from 'keycloak-hapi';
import _, {get} from 'lodash';
import {secureSavedObjects} from './server/services/SecureClusterFacade';
import {getAuthorizationRules} from './server/services/authorizationRules';
import Principal from './server/services/Principal';
import configurePermissionsRoutes from './server/routes/permissions';
import Permissions from './public/authz/constants/Permissions';
import configureUsersRoutes from './server/routes/users';
import pkg from './package.json';
import InternalGrant from './server/services/InternalGrant';
import configureTagsRoutes from './server/routes/tags';
import UserProvider from './server/services/UserProvider';
import UserMapper from './server/services/UserMapper';

const KEYCLOAK_CONFIG_PREFIX = 'keycloak';
const SERVER_CONFIG_PREFIX = 'server';

const setupRequiredScope = (requiredRoles) => {
    const scope = {};
    for (const value of requiredRoles) {
        if (value === '') {
            continue;
        }
        const prefix = value[0];
        const type = (prefix === '+' ? 'required' : (prefix === '!' ? 'forbidden' : 'selection'));
        const clean = (type === 'selection' ? value : value.slice(1));
        scope[type] = scope[type] || [];
        scope[type].push(clean);
    }
    return scope;
};

const validateScope = (credentials, scope, type) => {
    if (!scope[type]) {
        return true;
    }
    const count = typeof credentials.scope === 'string' ?
        (scope[type].indexOf(credentials.scope) !== -1 ? 1 : 0) :
        _.intersection(scope[type], credentials.scope).length;
    if (type === 'forbidden') {
        return count === 0;
    }
    if (type === 'required') {
        return count === scope.required.length;
    }
    return !!count;
};

const getAuthorizationFor = (requiredRoles) => {
    const scope = setupRequiredScope(requiredRoles);
    return (credentials) => validateScope(credentials, scope, 'required') ||
        validateScope(credentials, scope, 'selection') ||
        validateScope(credentials, scope, 'forbidden');
};

const isLoginOrLogout = (request) => {
    const url = request.raw.req.url;
    return url.startsWith('/sso/login') || url.startsWith('/sso/logout');
};

const principalConversion = (principal) => {
    const modifiedPrincipal = ({ ...principal });
    delete modifiedPrincipal.accessToken;
    delete modifiedPrincipal.idToken;
    modifiedPrincipal.email = principal.accessToken.content.email;
    return modifiedPrincipal;
};

const shouldRedirectUnauthenticated = (request) => {
  return !(request.auth.mode !== 'required'
    || request.raw.req.url.startsWith('/api/')
    || request.raw.req.url.startsWith('/elasticsearch/')
    || request.raw.req.url.startsWith('/es_admin/'));
};

const configureBackChannelLogoutEndpoint = (server, basePath) => {
  server.ext('onPreAuth', (request, reply) => {
    if (request.url.path === `${basePath || ''}/k_logout` && request.method === 'post') {
      request.headers['kbn-xsrf'] = 'k_logout';
      request.headers['kbn-version'] = pkg.kibana.version;
    }
    return reply.continue;
  });
};

const interceptUnauthorizedRequests = (server, basePath, isAuthorized) => {
    server.ext('onPostAuth', (request, reply) => {
        if (!isLoginOrLogout(request) && !isAuthorized(request.auth.credentials)) {
            const response = `<p>The user has insufficient permissions to access this page. <a href="${basePath || ''}/sso/logout">Logout and try as another user</a></p>`;
            return reply.response(response).takeover();
        }
        return reply.continue;
    });
};

const propagateBearerToken = (server) => {
    server.ext('onPostAuth', (request, reply) => {
        if (request.auth.credentials && request.auth.credentials.accessToken) {
            request.headers.authorization = `Bearer ${request.auth.credentials.accessToken.token}`;
        }
        return reply.continue;
    });
};

const exposePrincipal = (server, keycloakConfig) => {
    server.decorate('request', 'getPrincipal', (request) => () => {
        return request.auth.credentials
            ? new Principal(request.auth.credentials, keycloakConfig.acl.ownerAttribute)
            : null;
    }, { apply: true });
};

const initializeInternalGrant = (server, keycloakConfig) => {
    const adapter = new KeycloakAdapter(server, keycloakConfig);
    const internalGrant = new InternalGrant(adapter.grantManager);
    server.decorate('server', 'getInternalGrant', () => internalGrant);
    return internalGrant.initialize();
};

export default function (kibana) {
    return new kibana.Plugin({
        require: ['elasticsearch', 'kibana'],
        name: 'keycloak-kibana',
        configPrefix: KEYCLOAK_CONFIG_PREFIX,
        uiExports: {
            injectDefaultVars(server, options) {
                return {
                    keycloak: {
                        features: {
                            acl: options.acl.enabled,
                            tagging: options.tagging.enabled
                        }
                    }
                };
            },
            chromeNavControls: [`plugins/keycloak-kibana/views/nav_control`],
            hacks: ['plugins/keycloak-kibana/hack'],
            mappings: Permissions.getMappings() // TODO: refactor - remove from here and alter mappings via elastic API.
        },
        config(Joi) {
            return Joi.object({
                serverUrl: Joi.string().required(),
                realm: Joi.string().required(),
                clientId: Joi.string().required(),
                clientSecret: Joi.string().required(),
                realmPublicKey: Joi.string(),
                minTimeBetweenJwksRequests: Joi.number().integer().default(10),
                principalNameAttribute: Joi.string().default('name'),
                acl: Joi.object({
                   enabled: Joi.boolean().default(false),
                   ownerAttribute: Joi.string().valid(['preferred_username','sub','email']).default('sub')
                }).default(),
                tagging: Joi.object({
                    enabled: Joi.boolean().default(false)
                }).default(),
                session: Joi.object({
                    name: Joi.string().default('kc_session'),
                    cookieOptions: Joi.object({
                        password: Joi.string().min(32).required(),
                        isSecure: Joi.boolean().default(false),
                        isHttpOnly: Joi.boolean().default(false)
                    })
                }),
                requiredRoles: Joi.array().items(Joi.string()).default([]),
                propagateBearerToken: Joi.boolean().default(true),
                enabled: Joi.boolean().default(true)
            }).default();
        },
        async init(server) {
            const basePath = server.config().get(SERVER_CONFIG_PREFIX).basePath;
            const keycloakConfig = Object.assign(
                server.config().get(KEYCLOAK_CONFIG_PREFIX),
                { basePath, principalConversion, shouldRedirectUnauthenticated }
            );
            await server.register({
                plugin: yar,
                options: {
                    storeBlank: false,
                    name: keycloakConfig.session.name,
                    maxCookieSize: 0,
                    cookieOptions: keycloakConfig.session.cookieOptions
                }
            });

            await server.cache({})._cache.start();

            await server.register({
                plugin: keycloak,
                options: keycloakConfig
            });

            await initializeInternalGrant(server, keycloakConfig);

            server.auth.strategy('keycloak', 'keycloak');
            server.auth.default('keycloak');

            configureBackChannelLogoutEndpoint(server, basePath);
            interceptUnauthorizedRequests(server, basePath, getAuthorizationFor(keycloakConfig.requiredRoles));
            exposePrincipal(server, keycloakConfig);

            const userProvider = new UserProvider(keycloakConfig, server.getInternalGrant());
            secureSavedObjects(server, getAuthorizationRules(keycloakConfig.acl.enabled));

            if (keycloakConfig.acl.enabled) {
                const userMapper = new UserMapper(keycloakConfig);
                configureUsersRoutes(server, userProvider, userMapper);
                configurePermissionsRoutes(server, userProvider, userMapper);
            }

            if (keycloakConfig.tagging.enabled) {
                configureTagsRoutes(server, userProvider);
            }

            if (keycloakConfig.propagateBearerToken) {
                propagateBearerToken(server);
            }
        }
    });
}
