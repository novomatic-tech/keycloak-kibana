/* eslint-disable import/no-unresolved */
import overriddenReactDirective from './OverriddenReactDirective';
import { DashboardListing } from '../components/DashboardListing';
import { wrapInI18nContext } from 'ui/i18n';
import Roles from '../constants/Roles';
import { isFeatureEnabled } from '../utils';

/**
 * This overrides the original DashboardListing React component with a custom one
 * and injects props taken from registered angular services.
 *
 * @see https://github.com/elastic/kibana/blob/v6.4.2/src/core_plugins/kibana/public/dashboard/listing/dashboard_listing.js#L52
 * @see https://github.com/elastic/kibana/blob/v6.4.2/src/core_plugins/kibana/public/dashboard/index.js#L44
 */
export default overriddenReactDirective(wrapInI18nContext(DashboardListing),
  (principalProvider, userProvider, dashboardPermissions, tagService) => {
    return {
      ownership: {
        hideWriteControls: !principalProvider.getPrincipal().hasRole(Roles.MANAGE_DASHBOARDS),
        principal: principalProvider.getPrincipal(),
        getUsers: userProvider.getUsers,
        getPermissions: dashboardPermissions.getPermissions,
        addPermission: dashboardPermissions.addPermission,
        addPermissionForAll: dashboardPermissions.addPermissionForAll,
        revokePermission: dashboardPermissions.revokePermission,
        revokePermissionForAll: dashboardPermissions.revokePermissionForAll,
        toggleDashboardTag: tagService.toggleDashboardTag,
        isFeatureEnabled: isFeatureEnabled
      }
    };
  });
