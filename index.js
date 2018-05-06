import { resolve } from 'path';
import yar from 'yar';
import keycloak from 'keycloak-hapi';
import Boom from 'boom';

const CONFIG_PREFIX = 'keycloak';

const isAuthorized = (credentials, requiredRoles) => {
    for (let requiredRole of requiredRoles) {
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

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch','kibana'],
    name: 'keycloak-kibana',
    configPrefix: CONFIG_PREFIX,
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
          enabled: Joi.boolean().default(true),
      }).default();
    },
    init(server, options) {
        const config = server.config().get(CONFIG_PREFIX);
        return server.register({
            register: yar,
            options: {
                storeBlank: false,
                name: config.session.name,
                maxCookieSize: 0,
                cookieOptions: config.session.cookieOptions
            }
        }).then(() => {
            return server.register({
                register: keycloak,
                options: config
            });
        }).then(() => {
            server.auth.strategy('keycloak', 'keycloak', 'required');
            server.ext('onPostAuth', (request, reply) => {
                return isLoginOrLogout(request) || !request.auth.credentials || isAuthorized(request.auth.credentials, config.requiredRoles) 
                   ? reply.continue()
                   : reply(`<p>The user has insufficient permissions to access this page. <a href="/sso/logout">Logout and try as another user</a></p>`);
            });
        });
    }
  });
};
