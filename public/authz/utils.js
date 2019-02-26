import chrome from 'ui/chrome';

export const isKibanaApp = () => (window.location.pathname || '').endsWith('/app/kibana');

export const isFeatureEnabled = (featureName) => chrome.getInjected(`keycloak.features.${featureName}`);
