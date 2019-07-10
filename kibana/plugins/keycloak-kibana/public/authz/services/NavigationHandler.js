/* eslint-disable import/no-unresolved */
import { map } from 'rxjs/operators';
import { getNewPlatform } from 'ui/new_platform';
import * as Rx from 'rxjs';
import _ from 'lodash';

export default class NavigationHandler {

  constructor(chrome, principalProvider, authorizationRules) {
    this._authRules = authorizationRules;
    this._principalProvider = principalProvider;
    this._navLinksObservable = Rx
      .combineLatest(this._principalProvider.getPrincipal$(), getNewPlatform().start.core.chrome.navLinks.getNavLinks$())
      .pipe(map(this._filterNavLinks));
  }

  getNavLinks$() {
    return this._navLinksObservable;
  }

  _filterNavLinks = ([principal, navLinks]) => {
    return navLinks.filter(link => {
      const rule = _.find(this._authRules.navLinks, rule => rule.resource(link, principal));
      let isAuthorized = this._authRules.allowMissingNavLinks;
      if (rule) {
        isAuthorized = rule.principal(principal, link);
      }
      return isAuthorized;
    });
  };

}
