import { uiModules } from 'ui/modules';
import uiRoutes from 'ui/routes';

import PrincipalProvider from './services/PrincipalProvider';
import UserProvider from './services/UserProvider';
import DashboardPermissions from './services/DashboardPermissions';
import NavigationHandler from './services/NavigationHandler';
import RouteAuthorization from './services/RouteAuthorization';
import TagService from './services/TagService';

import DashboardAppDecorator from './decorations/DashboardAppDecorator';
import DashboardListingDecorator from './decorations/DashboardListingDecorator';
import HomeRouteDecoration from './decorations/HomeRouteDecoration';
import HeaderGlobalNavDecorator from './decorations/HeaderGlobalNavDecorator';

import authorizationRules from './authorizationRules';
import { isFeatureEnabled, isKibanaApp, decorateDirective } from './utils';

const kibanaApp = uiModules.get('kibana', ['ngRoute', 'react']);
decorateDirective(kibanaApp, 'headerGlobalNavDirective', HeaderGlobalNavDecorator);

if (isKibanaApp()) {
  const dashboardApp = uiModules.get('app/dashboard');
  decorateDirective(dashboardApp, 'dashboardApp', DashboardAppDecorator);

  if (isFeatureEnabled('acl') || isFeatureEnabled('tagging')) {
    decorateDirective(dashboardApp, 'dashboardListing', DashboardListingDecorator);
  }
}

uiModules.get('app/keycloak', ['kibana'])
  .constant('authorizationRules', authorizationRules)
  .service('navigationHandler', NavigationHandler)
  .service('routeAuthorization', RouteAuthorization)
  .service('principalProvider', PrincipalProvider)
  .service('dashboardPermissions', DashboardPermissions)
  .service('userProvider', UserProvider)
  .service('tagService', TagService)
  .run((routeAuthorization) => {
    routeAuthorization.initialize();
  });

if (isFeatureEnabled('tagging')) {
  uiRoutes.when('/home', HomeRouteDecoration);
}
