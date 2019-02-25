import _ from "lodash";
import Boom from 'boom';
import Permissions from "../../public/authz/constants/Permissions";

const includePermissionsInSavedObjects = (principal, docs) => {
    docs.filter(doc => doc._source.type).forEach(doc => {
        const permissions = principal.getPermissionsFor(doc._source);
        const owner = _.get(doc._source, 'acl.owner', null);
        const attributes = doc._source[doc._source.type];
        attributes.permissions = permissions;
        attributes.owner = owner
    });
};

class AnyActionRule {

    constructor({ allowedWhen }) {
        this._allowedWhen = allowedWhen;
    }

    matches(action) {
        return this._allowedWhen(action);
    }
    async process(cluster, action) {
        return await cluster.processAction(action);
    }
}

class CreateRule {

    constructor({ resourceType, aclEnabled }) {
        this._resourceType = resourceType;
        this._aclEnabled = aclEnabled;
    }

    matches(action) {
        return action.isCreationOf(this._resourceType);
    }

    async process(cluster, action) {
        const {principal} = action;
        const {clientParams} = action.clusterRequest;
        const document = clientParams.body;
        if (!principal.canManageType(document.type)) {
            throw Boom.forbidden(`The user has no permissions to create this resource.`);
        }
        if (this._aclEnabled) {
            clientParams.body.acl = principal.createNewAcl();
        }
        return await cluster.processAction(action);
    }
}

class DeleteRule {

    constructor({ resourceType, aclEnabled }) {
        this._resourceType = resourceType;
        this._aclEnabled = aclEnabled;
    }

    matches(action) {
        return action.isDeletionOf(this._resourceType);
    }

    async process(cluster, action) {
        const {principal} = action;
        if (!principal.canManageType(this._resourceType)) {
            throw Boom.forbidden(`The user has no permissions to delete this resource.`);
        }
        if (this._aclEnabled) {
            const {clientParams} = action.clusterRequest;
            const {id, type, index} = clientParams;
            const document = await cluster.callWithInternalUser('get',
                {id, type, index, ignore: 404}, {});

            if (!principal.canManage(document._source)) {
                throw Boom.forbidden(`The user has no permissions to delete this resource.`);
            }
        }
        return await cluster.processAction(action);
    }
}

class UpdateRule {

    constructor({ resourceType, aclEnabled }) {
        this._resourceType = resourceType;
        this._aclEnabled = aclEnabled;
    }

    matches(action) {
        return action.isUpdateOf(this._resourceType);
    }

    async process(cluster, action) {
        const {principal} = action;
        if (!principal.canManageType(this._resourceType)) {
            throw Boom.forbidden(`The user has no permissions to update this resource.`);
        }
        if (this._aclEnabled) {
            const {clientParams} = action.clusterRequest;
            const {id, type, index} = clientParams;
            const document = await cluster.callWithInternalUser('get',
                {id, type, index, ignore: 404}, {});
            if (!principal.canEdit(document._source) &&
                !principal.canManage(document._source)) {
                throw Boom.forbidden(`The user has no permissions to update this resource.`);
            }
            clientParams.body.acl = document.found ? document._source.acl : principal.createNewAcl();
        }
        return await cluster.processAction(action); // TODO: introduce optimistic concurrency control.
    }
}

class FindRule {

    matches(action) {
        return action.isFind();
    }

    async process(cluster, action) {
        const {principal} = action;
        const filter = _.get(action.clusterRequest.clientParams, 'body.query.bool.filter');
        if (!principal.canDoAnything() && _.isArray(filter)) {
            const principalId = principal.getId();
            const all = Permissions.allKeyword();
            filter.push({
                query_string: {
                    query: '(NOT (type:dashboard))' +
                      `OR (acl.permissions.view:${principalId})` +
                      `OR (acl.permissions.edit:${principalId})` +
                      `OR (acl.permissions.manage:${principalId})` +
                      `OR (acl.permissions.view:${all})` +
                      `OR (acl.permissions.edit:${all})` +
                      `OR (acl.permissions.manage:${all})`
                }
            });
        }
        const response = await cluster.processAction(action);
        const savedObjects = _.get(response, 'hits.hits', []);
        includePermissionsInSavedObjects(principal, savedObjects);
        return response;
    }
}

class GetRule {

    constructor({ resourceType, aclEnabled }) {
        this._resourceType = resourceType;
        this._aclEnabled = aclEnabled;
    }

    matches(action) {
        return action.isRetrievalOf(this._resourceType);
    }

    async process(cluster, action) {
        const document = await cluster.processAction(action);
        if (this._aclEnabled) {
            const {principal} = action;
            if (!principal.canView(document._source) &&
                !principal.canEdit(document._source) &&
                !principal.canManage(document._source)) {
                throw Boom.forbidden(`The user has no permissions to update this resource.`);
            }
        }
        return document;
    }
}

class BulkGetRule {

    matches(action) {
        return action.isBulkGet();
    }

    async process(cluster, action) {
        const response = await cluster.processAction(action);
        const savedObjects = _.get(response, 'docs', []);
        const allObjectsAllowed = _.every(savedObjects, doc => {
            return doc._source.type !== 'dashboard' ||
                action.principal.canView(doc._source) ||
                action.principal.canEdit(doc._source) ||
                action.principal.canManage(doc._source);
        });
        if (!allObjectsAllowed) {
            throw Boom.forbidden('The user is not authorized to fetch requested resources');
        }
        includePermissionsInSavedObjects(action.principal, savedObjects);
        return response;
    }
}

const authorizationRules = [
    new GetRule({ resourceType: 'dashboard' }),
    new CreateRule({ resourceType: 'dashboard', aclEnabled: true }),
    new UpdateRule({ resourceType: 'dashboard', aclEnabled: true }),
    new DeleteRule({ resourceType: 'dashboard', aclEnabled: true }),
    new GetRule({ resourceType: 'visualization' }),
    new CreateRule({ resourceType: 'visualization' }),
    new UpdateRule({ resourceType: 'visualization' }),
    new DeleteRule({ resourceType: 'visualization' }),
    new GetRule({ resourceType: 'search' }),
    new CreateRule({ resourceType: 'search' }),
    new UpdateRule({ resourceType: 'search' }),
    new DeleteRule({ resourceType: 'search' }),
    new GetRule({ resourceType: 'config' }),
    new FindRule(),
    new BulkGetRule(),
    new AnyActionRule({ allowedWhen: (action) => action.principal.canDoAnything() })
];

export default authorizationRules;
