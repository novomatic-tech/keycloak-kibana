import TagService from '../services/TagService';
import Joi from 'joi';
import _ from 'lodash';
import Boom from 'boom';

const configureTagsRoutes = (server, userProvider) => {

  const tagService = new TagService(userProvider);
  const requestValidation = {
    params: {
      dashboardId: Joi.string().guid().required(),
      tag: Joi.string().valid(['favourite', 'home']).required(),
    }
  };

  server.route({
    method: 'GET',
    path: '/api/dashboard-tags',
    handler: async (request) => {
      const userId = request.auth.credentials.accessToken.content.sub;
      try {
        const tagMap = await tagService.getAllDashboardTags(userId);
        const tags = Array.from(tagMap.entries()).map(kv => {
          return { id: kv[0], tags: kv[1] };
        });
        return tags;
      } catch(e) {
        throw Boom.internal(e.message);
      }
    }
  });

  server.route({
    method: 'PUT',
    path: '/api/saved_objects/dashboard/{dashboardId}/tags/{tag}',
    handler: async (request) => {
      const { dashboardId, tag } = request.params;
      const userId = request.auth.credentials.accessToken.content.sub;

      // TODO: check if dashboard exists and user has rights to view it.

      try {
        await tagService.addDashboardTag(userId, dashboardId, tag);
        return null;
      } catch(e) {
        throw Boom.internal(e.message);
      }
    },
    config: {
      response: { emptyStatusCode: 204 },
      validate: requestValidation
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/saved_objects/dashboard/{dashboardId}/tags/{tag}',
    handler: async (request) => {
      const { dashboardId, tag } = request.params;
      const userId = request.auth.credentials.accessToken.content.sub;

      // TODO: check if dashboard exists and user has rights to view it.

      try {
        await tagService.removeDashboardTag(userId, dashboardId, tag);
        return null;
      } catch(e) {
        throw Boom.internal(e.message);
      }
    },
    config: {
      response: { emptyStatusCode: 204 },
      validate: requestValidation
    }
  });

  server.ext('onPostHandler', async (request, reply) => {
    if (request.path !== '/api/saved_objects/_find') {
      return reply.continue;
    }
    const savedObjects = request.response.source.saved_objects;
    const hasDashboards = _.some(savedObjects, item => item.type === 'dashboard');
    if (hasDashboards) {
      const userId = request.auth.credentials.accessToken.content.sub;
      const tags = await tagService.getAllDashboardTags(userId);
      savedObjects
        .filter(item => item.type === 'dashboard')
        .forEach(item => {
          item.attributes.tags = tags.get(item.id) || [];
        });
    }
    return reply.continue;
  });

};

export default configureTagsRoutes;