import {uiModules} from 'ui/modules';
import uiRoutes from 'ui/routes';

import NavigationAuthorization from "./services/NavigationAuthorization";
import PrincipalProvider from "./services/PrincipalProvider";
import UserProvider from "./services/UserProvider";
import DashboardPermissions from "./services/DashboardPermissions";
import NavigationHandler from "./services/NavigationHandler";
import RouteAuthorization from "./services/RouteAuthorization";
import TagService from "./services/TagService";

import DashboardAppDecorator from "./decorations/DashboardAppDecorator";
import AppSwitcherDecorator from "./decorations/AppSwitcherDecorator";
import DashboardListingDecorator from "./decorations/DashboardListingDecorator";
import HomeRouteDecoration from "./decorations/HomeRouteDecoration";

import authorizationRules from "./authorizationRules";
import {isFeatureEnabled, isKibanaApp, decorateDirective} from "./utils";

const kibanaApp = uiModules.get('kibana', ['ngRoute', 'react']);
decorateDirective(kibanaApp, 'appSwitcher', AppSwitcherDecorator);

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
    .service('navigationAuthorization', NavigationAuthorization)
    .service('routeAuthorization', RouteAuthorization)
    .service('principalProvider', PrincipalProvider)
    .service('dashboardPermissions', DashboardPermissions)
    .service('userProvider', UserProvider)
    .service('tagService', TagService)
    .run(($rootScope, navigationHandler, $route, navigationAuthorization, routeAuthorization) => {
        navigationHandler.initialize();
        navigationAuthorization.initialize();
        routeAuthorization.initialize();
    });

if (isFeatureEnabled('tagging')) {
    uiRoutes.when('/home', HomeRouteDecoration);
}
