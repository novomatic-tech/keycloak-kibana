import { uiModules } from 'ui/modules';
// eslint-disable-next-line import/no-unresolved
import { addInterceptor } from 'ui/kfetch';
import Promise from 'bluebird';

const refreshPage = () => {
  window.location.reload(true);
};

const responseErrorHandler = (status, response) => {
  if (status === 401) {
    refreshPage();
  }
  return Promise.reject(response);
};

const httpInterceptor = {
  responseError: response => {
    return responseErrorHandler(response.status, response);
  }
};

const kFetchInterceptor = {
  responseError: response => {
    return responseErrorHandler(response.res.status, response);
  }
};

uiModules.get('kibana')
  .factory('httpInterceptor', () => httpInterceptor)
  .config($httpProvider => {
    $httpProvider.interceptors.push('httpInterceptor');
    addInterceptor(kFetchInterceptor);
  });
