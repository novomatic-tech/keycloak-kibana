export default class UserProvider {

  constructor($http) {
    this._httpClient = $http;
  }

    getUsers = (filter = null) => {
      return this._httpClient({ method: 'GET', url: '/api/users', params: { filter } })
        .then(resp => resp.data);
    }
}
