import _ from 'lodash';
import Boom from 'boom';

const checkPermissionScript = "" +
    "def permissionsToCheck = ctx._source.acl?.permissions ?: [:];\n" +
    "def permList = permissionsToCheck[params.requiredPermission] ?: [];\n" +
    "if (permList != 'all' && !permList.contains(params.principalId)) {\n" +
    "    throw new Exception('forbidden');\n" +
    "}\n";

const addPermissionScript = "" +
    "def acl = ctx._source.acl ?: ['permissions': [:]];\n" +
    "def permissions = acl.permissions[params.permission] ?: [];\n" +
    "if (permissions != 'all' && !permissions.contains(params.userId)) {\n" +
    "    permissions.add(params.userId);\n" +
    "}\n" +
    "acl.permissions[params.permission] = permissions;\n" +
    "ctx._source.acl = acl;\n";

const addPermissionForAllScript = "" +
    "def acl = ctx._source.acl ?: ['permissions': [:]];\n" +
    "acl.permissions[params.permission] = 'all';\n" +
    "ctx._source.acl = acl;\n";

const revokePermissionScript = "" +
    "def acl = ctx._source.acl ?: ['permissions': [:]];\n" +
    "def permissions = acl.permissions[params.permission] ?: [];\n" +
    "if (permissions == 'all') {\n" +
    "    throw new Exception('conflict');\n" +
    "}\n" +
    "if (acl.owner == params.userId) {\n" +
    "    throw new Exception('own_removal');\n" +
    "}\n" +
    "def idx = permissions.indexOf(params.userId);\n" +
    "if (idx != -1) {\n" +
    "   permissions.remove(idx);\n" +
    "}\n" +
    "acl.permissions[params.permission] = permissions;\n" +
    "ctx._source.acl = acl;\n";

const revokePermissionForAllScript = "" +
    "def acl = ctx._source.acl ?: ['permissions': [:]];\n" +
    "def permissions = [];\n" +
    "if (acl.owner != null) {\n" +
    "  permissions.add(acl.owner);\n" +
    "}\n" +
    "acl.permissions[params.permission] = permissions;\n" +
    "ctx._source.acl = acl;\n";

export default class PermissionService {

    constructor(principal, cluster, index, type) {
        this._index = index;
        this._type = type;
        this._cluster = cluster;
        this._principal = principal;
    }

    async addPermission(documentId, permission, userId) {
        return await this._addPermission(documentId, permission, addPermissionScript, userId);
    }

    async addPermissionForAll(documentId, permission) {
        return await this._addPermission(documentId, permission, addPermissionForAllScript);
    }

    async revokePermission(documentId, permission, userId) {
        return await this._revokePermission(documentId, permission, revokePermissionScript, userId);
    }

    async revokePermissionForAll(documentId, permission) {
        return await this._revokePermission(documentId, permission, revokePermissionForAllScript);
    }

    async _addPermission(documentId, permission, script, userId = null) {
        const updateParams = this._getPermissionUpdateScriptParams({documentId, permission, userId, script});
        try {
            await this._cluster.callWithInternalUser('update', updateParams);
        } catch(e) {
            console.warn(e);
            const reason = _.get(e, 'body.error.caused_by.caused_by.reason');
            if (reason === 'forbidden') {
                throw Boom.forbidden('The user is not authorized to add permissions for the resource.');
            }
            throw Boom.internal('Failed to alter permissions for the resource.', e.body.error);
        }
    }

    async _revokePermission(documentId, permission, script, userId = null) {
        const updateParams = this._getPermissionUpdateScriptParams({documentId, permission, userId, script});
        try {
            await this._cluster.callWithInternalUser('update', updateParams);
        } catch (e) {
            console.warn(e);
            const reason = _.get(e, 'body.error.caused_by.caused_by.reason');
            if (reason === 'conflict') {
                throw Boom.conflict(`Cannot revoke permission for a single user when all users can ${permission} the resource.`);
            } else if (reason === 'forbidden') {
                throw Boom.forbidden('The user is not authorized to remove the permissions for the resource.');
            } else if (reason === 'own_removal') {
                throw Boom.badRequest('Permissions for the creator of the resource can\'t be revoked.');
            }
            throw Boom.internal('Failed to alter permissions for the resource.', e.body.error);
        }
    }

    _getPermissionUpdateScriptParams({ documentId, permission, userId, script }) {
        let actualScript = script;
        const scriptParams = { permission };
        if (userId) {
            scriptParams.userId = userId;
        }
        if (!this._principal.hasRole('manage-kibana')) {
            actualScript = checkPermissionScript + script;
            scriptParams.principalId = this._principal.getId();
            scriptParams.requiredPermission = 'manage';
        }
        return {
            index: this._index,
            type: this._type,
            id: documentId,
            body: {
                script: { inline: actualScript, params: scriptParams }
            }
        };
    }
}