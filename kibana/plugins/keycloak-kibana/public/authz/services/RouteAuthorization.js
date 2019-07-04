/* eslint-disable import/no-unresolved */
import _ from 'lodash';
import AuthorizationError from './AuthorizationError';
import { fatalError } from 'ui/notify';

export default class RouteAuthorization {

  constructor($rootScope, $location, authorizationRules, principalProvider) {
    this.$rootScope = $rootScope;
    this.$location = $location;
    this.authorizationRules = authorizationRules;
    this.principalProvider = principalProvider;
  }

  initialize() {
    this.principalProvider.getPrincipalAsync()
      .then(principal => this.requestAccess(principal, new URL(window.location)))
      .catch(error => fatalError(error));

    this.$rootScope.$on('$routeChangeStart', (event, nextLocation) => {
      _.set(nextLocation, 'resolve.auth', () => {
        return this.principalProvider.getPrincipalAsync()
          .then(principal => this.requestAccess(principal, new URL(window.location)));
      });
    });
  }

  requestAccess(principal, url) {
    const rule = _.find(this.authorizationRules.routes, rule => rule.resource(url, principal));
    if (!rule && this.authorizationRules.allowMissingRoutes) {
      return;
    }
    if (rule && rule.principal(principal, url)) {
      return;
    }
    throw new AuthorizationError(`Url ${url} is not authorized.`);
  }

}
