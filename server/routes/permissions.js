import Joi from 'joi';
import PermissionService from "../services/PermissionService";

const configurePermissionsRoutes = (server) => {

    const permissionServiceProvider = {
        get: (request) => {
            const cluster = server.plugins.elasticsearch.getCluster('admin');
            return new PermissionService(request.getPrincipal(), cluster, '.kibana', 'doc');
        }
    };

    const permissionParams = {
        dashboardId: Joi.string().guid().required(),
        permission: Joi.string().valid(['view', 'manage']).required(),
    };

    const userPermissionParams = Object.assign({}, permissionParams, {
        userId: Joi.string().required()
    });

    server.route({
        method: 'PUT',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions/{permission}',
        handler: async (request, reply) => {
            const {dashboardId, permission} = request.params;
            const permissionService = permissionServiceProvider.get(request);
            try {
                await permissionService.addPermissionForAll(`dashboard:${dashboardId}`, permission);
                return reply().code(204);
            } catch(e) {
                return reply(e);
            }
        },
        config: {
            validate: { params: permissionParams },
            auth: { scope: ['manage-dashboards'] }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions/{permission}/{userId}',
        handler: async (request, reply) => {
            const {dashboardId, permission, userId} = request.params;
            const permissionService = permissionServiceProvider.get(request);
            try {
                await permissionService.addPermission(`dashboard:${dashboardId}`, permission, userId);
                return reply().code(204);
            } catch(e) {
                return reply(e);
            }
        },
        config: {
            validate: { params: userPermissionParams },
            auth: { scope: ['manage-dashboards'] }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions/{permission}',
        handler: async (request, reply) => {
            const {dashboardId, permission} = request.params;
            const permissionService = permissionServiceProvider.get(request);
            try {
                await permissionService.revokePermissionForAll(`dashboard:${dashboardId}`, permission);
                return reply().code(204);
            } catch(e) {
                return reply(e);
            }
        },
        config: {
            validate: { params: permissionParams },
            auth: { scope: ['manage-dashboards'] }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions/{permission}/{userId}',
        handler: async (request, reply) => {
            const {dashboardId, permission, userId} = request.params;
            const permissionService = permissionServiceProvider.get(request);
            try {
                await permissionService.revokePermission(`dashboard:${dashboardId}`, permission, userId);
                return reply().code(204);
            } catch(e) {
                return reply(e);
            }
        },
        config: {
            validate: { params: userPermissionParams },
            auth: { scope: ['manage-dashboards'] }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/users',
        handler: (request, reply) => {
            let users = [
                {"id":"d70f600a-dcc2-4a84-af7a-c9de8ca403bf","username":"admin","enabled":true,"totp":false,"emailVerified":false,"firstName":"Admin","lastName":"van Buuren","disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}},
                {"id":"97aa1a38-6ae4-448e-abb6-0f0ec687b5e5","username":"user1","enabled":true,"totp":false,"emailVerified":false,"firstName":"Lady","lastName":"Gaga","attributes":{"country":["IT"]},"disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}},
                {"id":"5d26acdb-bc8f-413c-857a-832379bd4556","username":"user2","enabled":true,"totp":false,"emailVerified":false,"firstName":"Travis","lastName":"Rice","attributes":{"country":["US"]},"disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}},
                {"id":"eafe2c51-6afa-4cf6-8155-3fe379499506","username":"user3","enabled":true,"totp":false,"emailVerified":false,"firstName":"Bradley","lastName":"Cooper","attributes":{"country":["CA"]},"disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}}
            ];
            const filter = (request.query.filter || '').toLowerCase().trim();
            if (filter !== '') {
                users = users.filter(u => u.username.toLowerCase().indexOf(filter) !== -1 ||
                    u.firstName.toLowerCase().indexOf(filter) !== -1 ||
                    u.lastName.toLowerCase().indexOf(filter) !== -1)
            }
            return reply(users);
        }
    })
};

export default configurePermissionsRoutes;