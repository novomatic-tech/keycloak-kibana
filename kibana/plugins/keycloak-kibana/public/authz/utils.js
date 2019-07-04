/* eslint-disable import/no-unresolved */
import chrome from 'ui/chrome';

export const isKibanaApp = () => (window.location.pathname || '').endsWith('/app/kibana');

export const isFeatureEnabled = (featureName) => chrome.getInjected(`keycloak.features.${featureName}`);

const directiveExists = (module, directive) => module._invokeQueue
  .filter(item => 'directive' === item[1])
  .map(item => item[2][0])
  .includes(directive);

export const decorateDirective = (module, directive, decorator) => {
  if (directiveExists(module, directive)) {
    module.decorator(directive.concat('Directive'), decorator);
  }
};
