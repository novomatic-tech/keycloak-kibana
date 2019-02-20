import Joi from 'joi';
import PermissionService from "../services/PermissionService";

const configurePermissionsRoutes = (server) => {

    const permissionServiceProvider = {
        get: (request) => {
            const cluster = server.plugins.elasticsearch.getCluster('admin');
            return new PermissionService(request.getPrincipal(), cluster, '.kibana', 'doc');
        }
    };

    const requestValidation = {
        params: {
            dashboardId: Joi.string().guid().required(),
            permission: Joi.string().valid(['view', 'manage']).required(),
        },
        payload: {
            users: Joi.array().items(Joi.string()),
            all: Joi.boolean()
        }
    };

    server.route({
        method: 'GET',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions',
        handler: async(request, reply) => {
            const permissionService = permissionServiceProvider.get(request);
            try {
                const permissions = permissionService.getPermissions(`dashboard:${request.params.dashboardId}`);
                return reply(permissions);
            } catch(e) {
                return reply(e);
            }
        },
        config: {
            validate: {
                params: { dashboardId: Joi.string().guid().required() }
            },
            auth: {
                scope: ['manage-dashboards']
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions/{permission}',
        handler: async (request, reply) => {
            const {dashboardId, permission} = request.params;
            const {users, all} = request.payload;
            const documentId = `dashboard:${dashboardId}`;
            const permissionService = permissionServiceProvider.get(request);
            try {
                if (all) {
                    await permissionService.addPermissionForAll(documentId, permission);
                } else {
                    await permissionService.addPermission(documentId, permission, users || []);
                }
                return reply().code(204);
            } catch(e) {
                return reply(e);
            }
        },
        config: {
            validate: requestValidation,
            auth: { scope: ['manage-dashboards'] }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions/{permission}',
        handler: async (request, reply) => {
            const {dashboardId, permission} = request.params;
            const {users, all} = request.payload;
            const documentId = `dashboard:${dashboardId}`;
            const permissionService = permissionServiceProvider.get(request);
            try {
                if (all) {
                    await permissionService.revokePermissionForAll(documentId, permission);
                } else {
                    await permissionService.revokePermission(documentId, permission, users || []);
                }
                return reply().code(204);
            } catch(e) {
                return reply(e);
            }
        },
        config: {
            validate: requestValidation,
            auth: { scope: ['manage-dashboards'] }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/users',
        handler: (request, reply) => {
            let users = [
                {"id":"d70f600a-dcc2-4a84-af7a-c9de8ca403bf","username":"admin","email":"admin@novomatic-tech.com","enabled":true,"totp":false,"emailVerified":false,"firstName":"Admin","lastName":"van Buuren","disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}},
                {"id":"97aa1a38-6ae4-448e-abb6-0f0ec687b5e5","username":"user1","email":"user1@novomatic-tech.com","enabled":true,"totp":false,"emailVerified":false,"firstName":"Lady","lastName":"Gaga","attributes":{"country":["IT"]},"disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}},
                {"id":"5d26acdb-bc8f-413c-857a-832379bd4556","username":"user2","email":"user2@novomatic-tech.com","enabled":true,"totp":false,"emailVerified":false,"firstName":"Travis","lastName":"Rice","attributes":{"country":["US"]},"disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}},
                {"id":"eafe2c51-6afa-4cf6-8155-3fe379499506","username":"user3","email":"user3@novomatic-tech.com","enabled":true,"totp":false,"emailVerified":false,"firstName":"Bradley","lastName":"Cooper","attributes":{"country":["CA"]},"disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}}
            ];
            const filter = (request.query.filter || '').toLowerCase().trim();
            if (filter !== '') {
                users = users.filter(u => u.username.toLowerCase().indexOf(filter) !== -1 ||
                    u.firstName.toLowerCase().indexOf(filter) !== -1 ||
                    u.lastName.toLowerCase().indexOf(filter) !== -1  ||
                    u.email.toLowerCase().indexOf(filter) !== -1)
            }
            return reply(users);
        }
    })
};

export default configurePermissionsRoutes;