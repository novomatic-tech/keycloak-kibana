import Roles from '../constants/Roles';
import Permissions from '../constants/Permissions';
import { isFeatureEnabled } from '../utils';

/**
 * This replaces the controller of the original dashboardApp directive
 * so that it is possible to hide write controls depending on permissions
 * assigned for each dashboard.
 *
 * @see https://github.com/elastic/kibana/blob/v6.4.2/src/core_plugins/kibana/public/dashboard/dashboard_app.js#L79
 */
export default function DashboardAppDecorator($delegate) {
  return $delegate.map(del => {
    const baseController = del.controller;

    function newController($scope, $rootScope, $route, $routeParams, getAppState,
      dashboardConfig, localStorage, i18n, principalProvider) {
      const dashboard = $route.current.locals.dash;
      const principal = principalProvider.getPrincipal();
      const newDashboardConfig = {
        getHideWriteControls: () => {
          if (principal.isAdmin()) {
            return false;
          }

          const canManageDashboards = principal.hasRole(Roles.MANAGE_DASHBOARDS);
          if (!canManageDashboards) {
            return true;
          }
          if (!isFeatureEnabled('acl')) {
            return false;
          }
          return dashboard.permissions &&
            !dashboard.permissions.includes(Permissions.EDIT) &&
            !dashboard.permissions.includes(Permissions.MANAGE);
        }
      };
      return baseController
        .bind(this)
        .call(del, $scope, $rootScope, $route, $routeParams, getAppState, newDashboardConfig, localStorage, i18n);
    }

    del.controller = newController;
    return del;
  });
}
