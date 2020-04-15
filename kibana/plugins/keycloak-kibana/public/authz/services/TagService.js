/* eslint-disable import/no-unresolved */
import chrome from 'ui/chrome';

export default class TagService {

  constructor($http) {
    this._httpClient = $http;
  }

    getAllDashboardTags = () => {
      return this._httpClient({
        method: 'get',
        url: chrome.addBasePath(`/api/dashboard-tags`)
      }).then(resp => resp.data);
    };

    addDashboardTag = (dashboardId, tag) => {
      return this._httpClient({
        method: 'put',
        url: chrome.addBasePath(`/api/saved_objects/dashboard/${dashboardId}/tags/${tag}`)
      });
    };

    removeDashboardTag = (dashboardId, tag) => {
      return this._httpClient({
        method: 'delete',
        url: chrome.addBasePath(`/api/saved_objects/dashboard/${dashboardId}/tags/${tag}`)
      });
    };

    toggleDashboardTag = (dashboardId, tag, active) => {
      return active
        ? this.addDashboardTag(dashboardId, tag)
        : this.removeDashboardTag(dashboardId, tag);
    };
}
