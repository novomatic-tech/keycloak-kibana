export default class TagService {

  constructor($http) {
    this._httpClient = $http;
  }

    getAllDashboardTags = () => {
      return this._httpClient({
        method: 'get',
        url: `/api/dashboard-tags`
      }).then(resp => resp.data);
    };

    addDashboardTag = (dashboardId, tag) => {
      return this._httpClient({
        method: 'put',
        url: `/api/saved_objects/dashboard/${dashboardId}/tags/${tag}`
      });
    };

    removeDashboardTag = (dashboardId, tag) => {
      return this._httpClient({
        method: 'delete',
        url: `/api/saved_objects/dashboard/${dashboardId}/tags/${tag}`
      });
    };

    toggleDashboardTag = (dashboardId, tag, active) => {
      return active
        ? this.addDashboardTag(dashboardId, tag)
        : this.removeDashboardTag(dashboardId, tag);
    };
}
