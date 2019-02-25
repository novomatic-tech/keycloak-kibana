import Joi from 'joi';
import PermissionService from "../services/PermissionService";
import Roles from '../../public/authz/constants/Roles';
import Permissions from '../../public/authz/constants/Permissions';

const configurePermissionsRoutes = (server, userProvider, userMapper) => {

    const permissionServiceProvider = {
        get: (request) => {
            const cluster = server.plugins.elasticsearch.getCluster('admin');
            return new PermissionService({
                userProvider,
                userMapper,
                principal: request.getPrincipal(),
                cluster,
                index: '.kibana', // TODO: read .kibana from config
            });
        }
    };

    const allowedPermissions = Permissions.listAvailable().map(permission => permission.value);
    const requestValidation = {
        params: {
            dashboardId: Joi.string().guid().required(),
            permission: Joi.string().valid(allowedPermissions).required(),
        },
        payload: {
            users: Joi.array().items(Joi.string()),
            all: Joi.boolean()
        }
    };

    const getDashboardDocId = (dashboardId) => `dashboard:${dashboardId}`;

    server.route({
        method: 'GET',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions',
        handler: async(request, reply) => {
            const permissionService = permissionServiceProvider.get(request);
            try {
                const documentId = getDashboardDocId(request.params.dashboardId);
                const permissions = permissionService.getPermissions(documentId);
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
                scope: [Roles.MANAGE_DASHBOARDS]
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions/{permission}',
        handler: async (request, reply) => {
            const {dashboardId, permission} = request.params;
            const {users, all} = request.payload;
            const documentId = getDashboardDocId(dashboardId);
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
            auth: {
                scope: [Roles.MANAGE_DASHBOARDS]
            }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/saved_objects/dashboard/{dashboardId}/permissions/{permission}',
        handler: async (request, reply) => {
            const {dashboardId, permission} = request.params;
            const {users, all} = request.payload;
            const documentId = getDashboardDocId(dashboardId);
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
            auth: {
                scope: [Roles.MANAGE_DASHBOARDS]
            }
        }
    });
};

export default configurePermissionsRoutes;