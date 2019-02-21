import AuthorizationError from "./AuthorizationError";

export const unauthorizedPath = '/unauthorized';

export default class RouteAuthorization {

    constructor($rootScope, $location, authorizationRules) {
        this.$rootScope = $rootScope;
        this.$location = $location;
        this.authorizationRules = authorizationRules;
    }

    initialize() {
        const auth = this;
        auth.$rootScope.$on('$routeChangeStart', (event, nextLocation) => {
            if (nextLocation.originalPath && nextLocation.originalPath.startsWith(unauthorizedPath)) {
                return;
            }
            _.set(nextLocation, 'resolve.auth', function(principalProvider) {
                return principalProvider.getPrincipalAsync().then((principal) => {
                    auth.requestAccess(principal, nextLocation);
                });
            });
        });
        auth.$rootScope.$on("$routeChangeError", (event, nextLocation, previousLocation, error) => {
            if (error instanceof AuthorizationError) {
                auth.$location.path(unauthorizedPath);
            }
        });
    }

    requestAccess(principal, nextLocation) {
        const rule = _.find(this.authorizationRules.routes, rule => rule.resource(nextLocation, principal));
        if (!rule && this.authorizationRules.allowMissingRoutes) {
            return;
        }
        if (rule.principal(principal, nextLocation)) {
            return;
        }
        throw new AuthorizationError(`Route ${nextLocation.originalPath} is not authorized`);
    }
}