import UserProvider from "../services/UserProvider";
import UserMapper from "../services/UserMapper";

const configureUsersRoutes = (server, keycloakConfig) => {

    const userProvider = new UserProvider(keycloakConfig, server.getInternalGrant());
    const userMapper = new UserMapper(keycloakConfig);

    server.route({
        method: 'GET',
        path: '/api/users',
        handler: async (request, reply) => {
            const search = (request.query.filter || '').toLowerCase().trim();
            const users = await userProvider.getUsers(search);
            return reply(users.map(userMapper.map));
        }
    });

    server.route({
        method: 'GET',
        path: '/api/principal/attributes',
        handler: async (request, reply) => {

            // http://localhost:8080/auth/realms/kibana/protocol/openid-connect/userinfo

            const grant = await server.getInternalGrant();
            return reply(grant.access_token.content);
        },
        config: {
            auth: false
        }
    });
};

export default configureUsersRoutes;