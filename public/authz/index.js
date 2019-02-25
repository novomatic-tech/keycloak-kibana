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

const isKibanaApp = () => (window.location.pathname || '').endsWith('/app/kibana');

uiModules.get('kibana', ['ngRoute', 'react'])
    .decorator('appSwitcherDirective', AppSwitcherDecorator);

if (isKibanaApp()) {
    uiModules.get('app/dashboard')
        .decorator('dashboardListingDirective', DashboardListingDecorator)
        .decorator('dashboardAppDirective', DashboardAppDecorator);
}

uiModules.get('app/keycloak', ['kibana'])
    .constant('authorizationRules', authorizationRules)
    .service('navigationHandler', NavigationHandler)
    .service('navigationAuthorization', NavigationAuthorization)
    .service('routeAuthorization', RouteAuthorization)
    .service('principalProvider', PrincipalProvider)
    .service('dashboardPermissions', DashboardPermissions)
    .service('tagService', TagService)
    .service('userProvider', UserProvider)
    .run(($rootScope, navigationHandler, $route, navigationAuthorization, routeAuthorization) => {
        navigationHandler.initialize();
        navigationAuthorization.initialize();
        routeAuthorization.initialize();
    });

uiRoutes.when('/home', HomeRouteDecoration);