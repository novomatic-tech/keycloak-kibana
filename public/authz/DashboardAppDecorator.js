import roles from './roles';


export default function DashboardAppDecorator($delegate) {
    return $delegate.map(del => {
        const baseControler = del.controller;
        function newController($scope, $rootScope, $route, $routeParams, $location, getAppState, dashboardConfig, localStorage, principalProvider) {
            const dashboard = $route.current.locals.dash;
            const principal = principalProvider.getPrincipal();

            const newDashboardConfig = {
                getHideWriteControls: () => {
                    const canManageDashboards = principal.scope.includes(roles.MANAGE_DASHBOARDS);
                    if (!canManageDashboards) {
                        return true;
                    }
                    return dashboard.permissions &&
                        !dashboard.permissions.includes('manage')
                }
            };
            return baseControler.bind(this).call(del, $scope, $rootScope, $route, $routeParams, $location, getAppState, newDashboardConfig, localStorage);
        }
        del.controller = newController;
        return del;
    });
}