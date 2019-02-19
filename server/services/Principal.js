import _ from "lodash";

export default class Principal {

    constructor(credentials, ownerAttribute) {
        this._credentials = credentials;
        this._aclId = credentials.accessToken.content[ownerAttribute] || credentials.accessToken.content.sub;
    }
    hasRole(role) {
        return this._credentials.scope.includes(role);
    }
    getId() {
        return this._aclId;
    }
    getPermissionsFor(document) {
        const documentPermissions = _.get(document, `acl.permissions`, {});
        const permissions = Object.keys(documentPermissions).filter(p => this._hasPermission(document, p));
        return permissions;
    }
    createNewAcl() {
        return {
            owner: this._aclId,
            permissions: {
                view: [],
                manage: [this._aclId]
            }
        };
    }
    _hasAcl(document) {
        return !!_.get(document, 'acl');
    }
    _hasPermission(document, permissionType) {
        if (!this._hasAcl(document)) {
            return true;
        }
        const permissions = _.get(document, `acl.permissions.${permissionType}`, []);
        if (permissions === 'all') {
            return true;
        }
        return permissions.includes(this._aclId);
    }
}