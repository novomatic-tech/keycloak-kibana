import _ from "lodash";
import Roles from "../../public/authz/constants/Roles";
import Boom from 'boom';

const includePermissionsInSavedObjects = (principal, docs) => {
    docs.filter(doc => doc._source.type).forEach(doc => {
        const permissions = principal.getPermissionsFor(doc._source);
        const owner = _.get(doc._source, 'acl.owner', null);
        const attributes = doc._source[doc._source.type];
        attributes.permissions = permissions;
        attributes.owner = owner
    });
};

class AdminRule {
    constructor({ requiredRole }) {
        this._requiredRole = requiredRole;
    }
    matches(action) {
        return action.principal.hasRole(this._requiredRole);
    }
    async process(cluster, action) {
        return await cluster.processAction(action);
    }
}

class CreateRule {

    constructor({ resourceType, requiredRole, aclEnabled }) {
        this._resourceType = resourceType;
        this._requiredRole = requiredRole;
        this._aclEnabled = aclEnabled;
    }

    matches(action) {
        return action.creates(this._resourceType);
    }

    async process(cluster, action) {
        if (!action.principal.hasRole(this._requiredRole)) {
            throw Boom.forbidden(`The user has no permissions to create this resource.`);
        }
        if (this._aclEnabled) {
            const {clientParams} = action.clusterRequest;
            clientParams.body.acl = action.principal.createNewAcl();
        }
        return await cluster.processAction(action);
    }
}

class DeleteRule {

    constructor({ resourceType, requiredRole, aclEnabled }) {
        this._resourceType = resourceType;
        this._requiredRole = requiredRole;
        this._aclEnabled = aclEnabled;
    }

    matches(action) {
        return action.deletes(this._resourceType);
    }

    async process(cluster, action) {
        if (!action.principal.hasRole(this._requiredRole)) {
            throw Boom.forbidden(`The user has no permissions to delete this resource.`);
        }
        if (this._aclEnabled) {
            const {clientParams} = action.clusterRequest;
            const {id, type, index} = clientParams;
            const document = await cluster.callWithRequest(action.request, 'get',
                {id, type, index, ignore: 404}, {});

            if (!action.principal.canManage(document._source)) {
                throw Boom.forbidden(`The user has no permissions to delete this resource.`);
            }
        }
        return await cluster.processAction(action);
    }
}

class UpdateRule {

    constructor({ resourceType, requiredRole, aclEnabled }) {
        this._resourceType = resourceType;
        this._requiredRole = requiredRole;
        this._aclEnabled = aclEnabled;
    }

    matches(action) {
        return action.updates(this._resourceType);
    }

    async process(cluster, action) {
        if (!action.principal.hasRole(this._requiredRole)) {
            throw Boom.forbidden(`The user has no permissions to update this resource.`);
        }
        if (this._aclEnabled) {
            const {clientParams} = action.clusterRequest;
            const {id, type, index} = clientParams;
            const document = await cluster.callWithRequest(action.request, 'get',
                {id, type, index, ignore: 404}, {});

            if (!action.principal.canEdit(document._source) &&
                !action.principal.canManage(document._source)) {
                throw Boom.forbidden(`The user has no permissions to update this resource.`);
            }
            clientParams.body.acl = document.found ? document._source.acl : action.principal.createNewAcl();
        }
        return await cluster.processAction(action); // TODO: introduce optimistic concurrency control.
    }
}

class FindRule {

    matches(action) {
        return action.isFind();
    }

    async process(cluster, action) {
        const {principal, request} = action;
        console.log(JSON.stringify(action.clusterRequest, null, 2));

        // TODO: modify query to access only allowed saved objects.

        const response = await cluster.processAction(action);
        const savedObjects = _.get(response, 'hits.hits', []);
        includePermissionsInSavedObjects(action.principal, savedObjects);
        return response;
    }
}

class KibanaAppRule {

    matches(action) {
        return action.request.path === '/app/kibana' &&
            action.request.method === 'get';
    }

    process(cluster, action) {
        return cluster.processAction(action);
    }
}


class BulkGetRule {

    matches(action) {
        return action.isBulkGet();
    }

    async process(cluster, action) {
        const response = await cluster.processAction(action);
        const savedObjects = _.get(response, 'docs', []);
        const allObjectsAllowed = _.every(savedObjects, doc =>
            doc._source.type !== 'dashboard' ||
            action.principal.canView(doc._source) ||
            action.principal.canEdit(doc._source)  ||
            action.principal.canManage(doc._source)
        );
        if (!allObjectsAllowed) {
            throw Boom.forbidden('The user is not authorized to fetch requested resources');
        }
        includePermissionsInSavedObjects(action.principal, savedObjects);
        return response;
    }
}

const authRules = [
    new AdminRule({ requiredRole: Roles.MANAGE_KIBANA }),
    new CreateRule({ resourceType: 'dashboard', requiredRole: Roles.MANAGE_DASHBOARDS, aclEnabled: true }),
    new UpdateRule({ resourceType: 'dashboard', requiredRole: Roles.MANAGE_DASHBOARDS, aclEnabled: true }),
    new DeleteRule({ resourceType: 'dashboard', requiredRole: Roles.MANAGE_DASHBOARDS, aclEnabled: true }),
    new CreateRule({ resourceType: 'visualization', requiredRole: Roles.MANAGE_VISUALIZATIONS }),
    new UpdateRule({ resourceType: 'visualization', requiredRole: Roles.MANAGE_VISUALIZATIONS }),
    new DeleteRule({ resourceType: 'visualization', requiredRole: Roles.MANAGE_VISUALIZATIONS }),
    new CreateRule({ resourceType: 'search', requiredRole: Roles.MANAGE_SEARCHES }),
    new UpdateRule({ resourceType: 'search', requiredRole: Roles.MANAGE_SEARCHES }),
    new DeleteRule({ resourceType: 'search', requiredRole: Roles.MANAGE_SEARCHES }),
    new FindRule(),
    new BulkGetRule(),
    new KibanaAppRule()
];

export default authRules;
