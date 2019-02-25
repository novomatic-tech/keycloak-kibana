import _ from "lodash";
import Permissions from '../../public/authz/constants/Permissions';
import Roles from "../../public/authz/constants/Roles";

export default class Principal {

    constructor(credentials, ownerAttribute) {
        this._credentials = credentials;
        this._aclId = credentials.accessToken.content[ownerAttribute] || credentials.accessToken.content.sub;
        this._ownerAttribute = ownerAttribute;
    }
    getId() {
        return this._aclId;
    }
    hasRole(role) {
        return this._credentials.scope.includes(role);
    }
    getCredentials() {
        return this._credentials;
    }
    getOwnerAttribute() {
        return this._ownerAttribute;
    }
    getPermissionsFor(document) {
        const documentPermissions = _.get(document, `acl.permissions`, {});
        const permissions = Object.keys(documentPermissions).filter(p => this._hasPermission(document, p));
        return permissions;
    }
    canView(document) {
        return this._can(Permissions.VIEW, document);
    }
    canEdit(document) {
        return this._can(Permissions.EDIT, document);
    }
    canManage(document) {
        return this._can(Permissions.MANAGE, document);
    }
    canManageType(documentType) {
        if (this.canDoAnything()) {
            return true;
        }
        switch (documentType) {
            case 'dashboard':
                return this.hasRole(Roles.MANAGE_DASHBOARDS);
            case 'search':
                return this.hasRole(Roles.MANAGE_SEARCHES);
            case 'visualization':
                return this.hasRole(Roles.MANAGE_VISUALIZATIONS);
            default:
                return false;
        }
    }
    canDoAnything() {
        return this.hasRole(Roles.MANAGE_KIBANA);
    }
    createNewAcl() {
        return {
            owner: this._aclId,
            permissions: {
                view: [],
                edit: [],
                manage: [this._aclId]
            }
        };
    }
    _can(action, document) {
        if (this.canDoAnything()) {
            return true;
        }
        const permissions = _.get(document, `acl.permissions.${action}`, []);
        return permissions === Permissions.allKeyword() || permissions.includes(this._aclId);
    }
    _hasAcl(document) {
        return !!_.get(document, 'acl');
    }
    _hasPermission(document, permissionType) {
        if (!this._hasAcl(document)) {
            return true;
        }
        const permissions = _.get(document, `acl.permissions.${permissionType}`, []);
        if (permissions === Permissions.allKeyword()) {
            return true;
        }
        return permissions.includes(this._aclId);
    }
}