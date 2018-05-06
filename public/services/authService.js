import 'angular-resource';
import { uiModules } from 'ui/modules';

uiModules.get('app/keycloak', ['ngResource']).service('authService', ($resource, chrome) => {
    const url = chrome.addBasePath('/api/principal');
    return $resource(url, {}, {
        getPrincipal: { method: 'GET', url }
    });
});
