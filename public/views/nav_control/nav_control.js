import { constant } from 'lodash';
import { chromeNavControlsRegistry } from 'ui/registry/chrome_nav_controls';
import { uiModules } from 'ui/modules';
import template from 'plugins/keycloak-kibana/views/nav_control/nav_control.html';
import 'plugins/keycloak-kibana/services/authService';

chromeNavControlsRegistry.register(constant({
  name: 'keycloak',
  order: 1000,
  template
}));

uiModules.get('app/keycloak', ['kibana']).controller('keycloakNavController', ($scope, authService, globalNavState) => {

  $scope.tooltipContent = (content) => {
    return globalNavState.isOpen() ? undefined : content;
  };

  authService.getPrincipal().then(response => {
    $scope.user = response.data;
  }).catch(exception => {
    console.error(exception);
  });
});