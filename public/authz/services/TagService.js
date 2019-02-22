export default class TagService {

    constructor($http) {
        this._httpClient = $http;
    }

    addDashboardTag = (dashboardId, tag) => {
        return this._httpClient({
            method: 'put',
            url: `/api/saved_objects/dashboard/${dashboardId}/tags/${tag}`
        })
    };

    removeDashboardTag = (dashboardId, tag) => {
        return this._httpClient({
            method: 'delete',
            url: `/api/saved_objects/dashboard/${dashboardId}/tags/${tag}`
        })
    };
}
