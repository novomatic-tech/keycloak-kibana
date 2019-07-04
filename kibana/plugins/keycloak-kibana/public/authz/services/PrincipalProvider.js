import AuthorizationError from './AuthorizationError';
import * as Rx from 'rxjs';

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
      provider._principal = response.data;
      if (window.onKibanaPrincipalUpdated) {
        window.onKibanaPrincipalUpdated(response.data);
      }
      this._principal$.next(provider._principal);
      return response.data;
    }).catch(error => {
      throw new AuthorizationError(`Cannot fetch user details. Status code: ${error.status}`, error);
    });
    return this._principalPromise;
  }
}
