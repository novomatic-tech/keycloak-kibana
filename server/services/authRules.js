import _ from "lodash";

const includeSavedObjectsPermissionsInResponse = (req, rawElasticDocs) => {
    const savedObjects = _.get(req, 'response.source.saved_objects', []);
    const modifiedSavedObjects = _.zip(savedObjects, rawElasticDocs).map(item => {
        const permissions = req.getPrincipal().getPermissionsFor(item[1]._source);
        const savedObject = Object.assign({}, item[0]);
        savedObject.attributes.permissions = permissions;
        savedObject.attributes.owner = _.get(item[1]._source, 'acl.owner');
        return savedObject;
    });
    _.set(req, 'response.source.saved_objects', modifiedSavedObjects);
};

class CreateDashboardRule {

    matches(request) {
        return request.path === '/api/saved_objects/dashboard' &&
            request.method === 'post';
    }

    async callWithRequest(delegate, req, endpoint, clientParams, options) {
        clientParams.body.acl = req.getPrincipal().createNewAcl();
        const response = await delegate(req, endpoint, clientParams, options);
        return response;
    }
}

class UpdateDashboardRule {

    matches(request) {
        return request.path.match(/^\/api\/saved_objects\/dashboard\/[a-z0-9\-]+$/) &&
            request.method === 'post';
    }

    async callWithRequest(delegate, req, endpoint, clientParams, options) {
        const {id, type, index} = clientParams;
        const document = await delegate(req, 'get', { id, type, index, ignore: 404 }, {});
        clientParams.body.acl = document.found ? document._source.acl : req.getPrincipal().createNewAcl();
        return await delegate(req, endpoint, clientParams, options);
    }
}

class ListDashboardRule {

    matches(request) {
        return request.path === '/api/saved_objects/_find' &&
            request.query.type.includes('dashboard') &&
            request.method === 'get';
    }

    async callWithRequest(delegate, req, endpoint, clientParams, options) {
        const response = await delegate(req, endpoint, clientParams, options);
        req.upstreamResponse = response;
        return response;
    }

    onPostHandler(req, reply) {
        const rawElasticDocs = _.get(req.upstreamResponse, 'hits.hits', []);
        includeSavedObjectsPermissionsInResponse(req, rawElasticDocs);
        return reply.continue();
    }
}

class GetDashboardRule {

    matches(request) {
        return request.path === '/api/saved_objects/_bulk_get' && request.method === 'post';
    }

    async callWithRequest(delegate, req, endpoint, clientParams, options) {
        const response = await delegate(req, endpoint, clientParams, options);
        req.upstreamResponse = response;
        return response;
    }

    onPostHandler(req, reply) {
        const rawElasticDocs = _.get(req.upstreamResponse, 'docs', []);
        includeSavedObjectsPermissionsInResponse(req, rawElasticDocs);
        return reply.continue();
    }
}

const authRules = [
    new CreateDashboardRule(),
    new UpdateDashboardRule(),
    new ListDashboardRule(),
    new GetDashboardRule()
];

export default authRules;

