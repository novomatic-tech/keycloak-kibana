import _ from 'lodash';
import Boom from 'boom';
import Roles from '../../public/authz/constants/Roles';
import Permissions from '../../public/authz/constants/Permissions';

// TODO: refactor remote groovy scripts approach into local javascript and optimistic concurrency control.
const checkPermissionScript = '' +
    'def permissionsToCheck = ctx._source.acl?.permissions ?: [:];\n' +
    'def permList = permissionsToCheck[params.requiredPermission] ?: [];\n' +
    'if (permList != \'all\' && !permList.contains(params.principalId)) {\n' +
    '    throw new Exception(\'forbidden\');\n' +
    '}\n';

const addPermissionScript = '' +
    'def acl = ctx._source.acl ?: [\'permissions\': [:]];\n' +
    'def permissions = acl.permissions[params.permission] ?: [];\n' +
    'for (userId in params.userIds) {\n' +
    '    if (permissions != \'all\' && !permissions.contains(userId)) {\n' +
    '        permissions.add(userId);\n' +
    '    }\n' +
    '}\n' +
    'acl.permissions[params.permission] = permissions;\n' +
    'ctx._source.acl = acl;\n';

const addPermissionForAllScript = '' +
    'def acl = ctx._source.acl ?: [\'permissions\': [:]];\n' +
    'acl.permissions[params.permission] = \'all\';\n' +
    'ctx._source.acl = acl;\n';

const revokePermissionScript = '' +
    'def acl = ctx._source.acl ?: [\'permissions\': [:]];\n' +
    'def permissions = acl.permissions[params.permission] ?: [];\n' +
    'if (permissions == \'all\') {\n' +
    '    throw new Exception(\'conflict\');\n' +
    '}\n' +
    'for (userId in params.userIds) {\n' +
    '    if (acl.owner == userId) {\n' +
    '        throw new Exception(\'own_removal\');\n' +
    '    }\n' +
    '    def idx = permissions.indexOf(userId);\n' +
    '    if (idx != -1) {\n' +
    '       permissions.remove(idx);\n' +
    '    }\n' +
    '}\n' +
    'acl.permissions[params.permission] = permissions;\n' +
    'ctx._source.acl = acl;\n';

const revokePermissionForAllScript = '' +
    'def acl = ctx._source.acl ?: [\'permissions\': [:]];\n' +
    'def permissions = [];\n' +
    'if (acl.owner != null) {\n' +
    '  permissions.add(acl.owner);\n' +
    '}\n' +
    'acl.permissions[params.permission] = permissions;\n' +
    'ctx._source.acl = acl;\n';

export default class PermissionService {

  constructor({ principal, cluster, index, type, userProvider, userMapper }) {
    this._index = index;
    this._type = type || 'doc';
    this._cluster = cluster;
    this._principal = principal;
    this._userProvider = userProvider;
    this._userMapper = userMapper;
  }

  async getPermissions(documentId) {
    const response = await this._cluster.callWithInternalUser('get', {
      id: documentId,
      type: this._type,
      index: this._index,
      ignore: [404]
    });
    const docNotFound = response.found === false;
    const indexNotFound = response.status === 404;
    if (indexNotFound || docNotFound) {
      throw Boom.notFound('Requested resource could not be found');
    }
    const document = response._source;
    if (!this._principal.hasRole(Roles.MANAGE_KIBANA) && !this._principal.canManage(document)) {
      throw Boom.forbidden('The user is not authorized to get permissions for the resource');
    }
    if (!document.acl) {
      return { users: [], all: [] };
    }

    const { owner, permissions } = document.acl;
    const all = [];
    const userPermissionsMap = new Map();
    _.keys(permissions).forEach(permission => {
      if (permissions[permission] === Permissions.allKeyword()) {
        all.push(permission);
      } else {
        permissions[permission].forEach(userId => {
          let userPermissions = userPermissionsMap.get(userId);
          if (!userPermissions) {
            userPermissions = [];
            userPermissionsMap.set(userId, userPermissions);
          }
          userPermissions.push(permission);
        });
      }
    });
    const users = Array.from(userPermissionsMap.keys()).map(id => {
      const user = { id, permissions: userPermissionsMap.get(id) };
      if (user.id === owner) {
        user.owner = true;
      }
      if (user.id === this._principal.getId()) {
        user.you = true;
      }
      return user;
    });
    if (this._principal.getOwnerAttribute() === 'sub') {
      for (const user of users) {
        // TODO: this is suboptimal, we're asking for each user by its ID.
        // Fix this once there is more suitable API for this.
        const additionalUserData = await this._userProvider.getUserById(user.id);
        _.assign(user, this._userMapper.map(additionalUserData));
      }
    }
    return { users: _.sortBy(users, u => u.id), all };
  }



  async addPermission(documentId, permission, userIds) {
    return await this._addPermission(documentId, permission, addPermissionScript, userIds);
  }

  async addPermissionForAll(documentId, permission) {
    return await this._addPermission(documentId, permission, addPermissionForAllScript);
  }

  async revokePermission(documentId, permission, userIds) {
    return await this._revokePermission(documentId, permission, revokePermissionScript, userIds);
  }

  async revokePermissionForAll(documentId, permission) {
    return await this._revokePermission(documentId, permission, revokePermissionForAllScript);
  }

  async _addPermission(documentId, permission, script, userIds = null) {
    const updateParams = this._getPermissionUpdateScriptParams({ documentId, permission, userIds, script });
    try {
      // TODO: the authentication scheme for callWithInteralUser calls should be Bearer (via OAuth's Client Credential flow) rather than Basic.
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

  async _revokePermission(documentId, permission, script, userIds = null) {
    const updateParams = this._getPermissionUpdateScriptParams({ documentId, permission, userIds, script });
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

  _getPermissionUpdateScriptParams({ documentId, permission, userIds, script }) {
    let actualScript = script;
    const scriptParams = { permission };
    if (userIds) {
      scriptParams.userIds = userIds;
    }
    if (!this._principal.hasRole(Roles.MANAGE_KIBANA)) {
      actualScript = checkPermissionScript + script;
      scriptParams.principalId = this._principal.getId();
      scriptParams.requiredPermission = Permissions.MANAGE;
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