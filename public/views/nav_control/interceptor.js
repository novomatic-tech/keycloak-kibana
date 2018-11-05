import { uiModules } from 'ui/modules';

uiModules
    .get('kibana')
    .config(($provide, $httpProvider) => {
        $provide.factory('unauthorizedInterceptor', function ($q) {
            return {
                'responseError': function (rejection) {
                    if (rejection.status === 401) {
                        return window.location.reload(true);
                    }

                    return $q.reject(rejection);
                }
            };
        });

        $httpProvider.interceptors.push('unauthorizedInterceptor');
    });