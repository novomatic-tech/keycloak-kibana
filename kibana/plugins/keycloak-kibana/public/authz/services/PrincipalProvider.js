import AuthorizationError from './AuthorizationError';
import * as Rx from 'rxjs';
import _ from 'lodash';
import Roles from '../constants/Roles';

class Principal {
  constructor(data) {
    Object.assign(this, data);
  }

  hasRoles(roles) {
    return roles.every(role => this.hasRole(role));
  }

  hasRole(role) {
    const roles = _.isArray(role) ? role : [role];
    return _.intersection(roles, this.scope).length > 0;
  }

  isAdmin() {
    return this.hasRole(Roles.MANAGE_KIBANA);
  }
}

export default class PrincipalProvider {

  constructor($http, chrome) {
    this._httpClient = $http;
    this._url = chrome.addBasePath('/api/principal');
    this._principal = null;
    this._principalPromise = null;
    this._principal$ = new Rx.ReplaySubject(1);
  }

  getPrincipal$() {
    return this._principal$;
  }

  getPrincipal() {
    return this._principal;
  }

  getPrincipalAsync() {
    if (this._principalPromise) {
      return this._principalPromise;
    }
    return this._updatePrincipal();
  }

  _updatePrincipal() {
    const provider = this;
    this._principalPromise = this._httpClient.get(this._url).then(response => {
      const principal = new Principal(response.data);
      provider._principal = principal;
      if (window.onKibanaPrincipalUpdated) {
        window.onKibanaPrincipalUpdated(principal);
      }
      this._principal$.next(principal);
      return principal;
    }).catch(error => {
      throw new AuthorizationError(`Cannot fetch user details. Status code: ${error.status}`, error);
    });
    return this._principalPromise;
  }
}
