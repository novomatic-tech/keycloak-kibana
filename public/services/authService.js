import 'angular-resource';
import { uiModules } from 'ui/modules';

uiModules.get('app/keycloak').service('authService', ($http, chrome) => {
  return {
    getPrincipal: () => {
      const url = chrome.addBasePath('/api/principal');
      return $http({
        method: 'GET',
        url
      });
    }
  };
});
