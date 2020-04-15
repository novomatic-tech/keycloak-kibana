/* eslint-disable import/no-unresolved */
import chrome from 'ui/chrome';

export default class UserProvider {

  constructor($http) {
    this._httpClient = $http;
  }

    getUsers = (filter = null) => {
      return this._httpClient({ method: 'GET', url: chrome.addBasePath('/api/users'), params: { filter } })
        .then(resp => resp.data);
    }
}
