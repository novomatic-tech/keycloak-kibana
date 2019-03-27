import OverriddenReactDirective from './OverriddenReactDirective';
import { DashboardListing } from '../components/DashboardListing';
import Roles from '../constants/Roles';
import { isFeatureEnabled } from '../utils';

/**
 * This overrides the original DashboardListing React component with a custom one
 * and injects props taken from registered angular services.
 *
 * @see https://github.com/elastic/kibana/blob/v6.4.2/src/core_plugins/kibana/public/dashboard/listing/dashboard_listing.js#L52
 * @see https://github.com/elastic/kibana/blob/v6.4.2/src/core_plugins/kibana/public/dashboard/index.js#L44
 */
export default OverriddenReactDirective(DashboardListing,
  (principalProvider, userProvider, dashboardPermissions, tagService) => {
    return {
      hideWriteControls: !principalProvider.getPrincipal().scope.includes(Roles.MANAGE_DASHBOARDS),
      principal: principalProvider.getPrincipal(),
      getUsers: userProvider.getUsers,
      getPermissions: dashboardPermissions.getPermissions,
      addPermission: dashboardPermissions.addPermission,
      addPermissionForAll: dashboardPermissions.addPermissionForAll,
      revokePermission: dashboardPermissions.revokePermission,
      revokePermissionForAll: dashboardPermissions.revokePermissionForAll,
      toggleDashboardTag: tagService.toggleDashboardTag,
      isFeatureEnabled: isFeatureEnabled
    };
  });