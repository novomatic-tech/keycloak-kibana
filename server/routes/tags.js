import TagService from "../services/TagService";
import Joi from 'joi';
import _ from 'lodash';
import UserProvider from "../services/UserProvider";

const configureTagsRoutes = (server, keycloakConfig) => {

    const userProvider = new UserProvider(keycloakConfig, server.getInternalGrant());
    const tagService = new TagService(userProvider);
    const requestValidation = {
        params: {
            dashboardId: Joi.string().guid().required(),
            tag: Joi.string().valid(['favourite','home']).required(),
        }
    };

    server.route({
        method: 'PUT',
        path: '/api/saved_objects/dashboard/{dashboardId}/tags/{tag}',
        handler: async (request, reply) => {
            const {dashboardId, tag} = request.params;
            const userId = request.auth.credentials.accessToken.content.sub;

            // TODO: check if dashboard exists and user has rights to view it.

            try {
                await tagService.addDashboardTag(userId, dashboardId, tag);
            } catch(e) {
                throw Boom.internal(e.message);
            }
        },
        config: {
            validate: requestValidation
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/saved_objects/dashboard/{dashboardId}/tags/{tag}',
        handler: async (request, reply) => {
            const {dashboardId, tag} = request.params;
            const userId = request.auth.credentials.accessToken.content.sub;

            // TODO: check if dashboard exists and user has rights to view it.

            try {
                await tagService.removeDashboardTag(userId, dashboardId, tag);
            } catch(e) {
                throw Boom.internal(e.message);
            }
        },
        config: {
            validate: requestValidation
        }
    });

    server.ext('onPostHandler', async (request, reply) => {
        if (request.path !== '/api/saved_objects/_find') {
            return reply.continue();
        }
        const savedObjects = request.response.source.saved_objects;
        const hasDashboards = _.some(savedObjects, item => item.type === 'dashboard');
        if (hasDashboards) {
            const userId = request.auth.credentials.accessToken.content.sub;
            const favouriteDashboards = await tagService.getAllDashboardTags(userId, 'favourite');
            savedObjects
                .filter(item => item.type === 'dashboard')
                .forEach(item => {
                    item.attributes.tags = [];
                    if (favouriteDashboards.includes(item.id)) {
                        item.attributes.tags.push('favourite');
                    }
                });
        }
        return reply.continue();
    });

};

export default configureTagsRoutes;