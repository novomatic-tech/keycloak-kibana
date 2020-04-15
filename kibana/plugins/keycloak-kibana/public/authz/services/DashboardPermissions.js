/* eslint-disable import/no-unresolved */
import chrome from 'ui/chrome';
import _ from 'lodash';

export default class DashboardPermissions {

  constructor($http) {
    this._httpClient = $http;
  }

    getPermissions = async (dashboardId) => {
      const response = await this._httpClient({
        method: 'GET',
        url: chrome.addBasePath(`/api/saved_objects/dashboard/${dashboardId}/permissions`),
      });
      return response.data;
    };

    addPermission = (dashboardId, permission, users) => {
      const data = { users: _.isArray(users) ? users : [users] };
      return this._sendPermissionRequest('PUT', dashboardId, permission, data);
    };

    addPermissionForAll = (dashboardId, permission) => {
      const data = { all: true };
      return this._sendPermissionRequest('PUT', dashboardId, permission, data);
    };

    revokePermission = (dashboardId, permission, users) => {
      const data = { users: _.isArray(users) ? users : [users] };
      return this._sendPermissionRequest('DELETE', dashboardId, permission, data);
    };

    revokePermissionForAll = (dashboardId, permission) => {
      const data = { all: true };
      return this._sendPermissionRequest('DELETE', dashboardId, permission, data);
    };

    _sendPermissionRequest = (method, dashboardId, permission, data) => {
      return this._httpClient({
        method,
        url: chrome.addBasePath(`/api/saved_objects/dashboard/${dashboardId}/permissions/${permission}`),
        headers: { 'Content-Type': 'application/json' },
        data
      });
    };
}
