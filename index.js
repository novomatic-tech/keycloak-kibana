import yar from 'yar';
import keycloak from 'keycloak-hapi';

const KEYCLOAK_CONFIG_PREFIX = 'keycloak';
const SERVER_CONFIG_PREFIX = 'server';

const isAuthorized = (credentials, requiredRoles) => {
  for (const requiredRole of requiredRoles) {
    if (credentials.scope.indexOf(requiredRole) === -1) {
      return false;
    }
  }
  return true;
};

const isLoginOrLogout = (request) => {
  const url = request.raw.req.url;
  return url.startsWith('/sso/login') || url.startsWith('/sso/logout');
};

const principalConversion = (principal) => {
  const modifiedPrincipal = ({ ...principal });
  delete modifiedPrincipal.accessToken;
  delete modifiedPrincipal.idToken;
  return modifiedPrincipal;
};

export default function (kibana) {
  return new kibana.Plugin({
    require: ['kibana'],
    name: 'keycloak-kibana',
    configPrefix: KEYCLOAK_CONFIG_PREFIX,
    uiExports: {
      chromeNavControls: [`plugins/keycloak-kibana/views/nav_control`]
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
        session: Joi.object({
          name: Joi.string().default('kc_session'),
          cookieOptions: Joi.object({
            password: Joi.string().min(32).required(),
            isSecure: Joi.boolean().default(false),
            isHttpOnly: Joi.boolean().default(false)
          })
        }),
        requiredRoles: Joi.array().items(Joi.string()).default([]),
        enabled: Joi.boolean().default(true)
      }).default();
    },
    init(server) {
      const basePath = server.config().get(SERVER_CONFIG_PREFIX).basePath;
      const keycloakConfig = Object.assign(server.config().get(KEYCLOAK_CONFIG_PREFIX), { basePath, principalConversion });
      return server.register({
        register: yar,
        options: {
          storeBlank: false,
          name: keycloakConfig.session.name,
          maxCookieSize: 0,
          cookieOptions: keycloakConfig.session.cookieOptions
        }
      }).then(() => {
        return server.register({
          register: keycloak,
          options: keycloakConfig
        });
      }).then(() => {
        server.auth.strategy('keycloak', 'keycloak', 'required');
        server.ext('onPostAuth', (request, reply) => {
          return isLoginOrLogout(request) || !request.auth.credentials || isAuthorized(request.auth.credentials, keycloakConfig.requiredRoles)
            ? reply.continue()
            : reply(`<p>The user has insufficient permissions to access this page. <a href="${basePath || ''}/sso/logout">Logout and try as another user</a></p>`);
        });
      });
    }
  });
}
