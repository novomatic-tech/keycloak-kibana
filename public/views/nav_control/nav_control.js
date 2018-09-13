import chromeNavControlsRegistry from 'ui/registry/chrome_nav_controls';
import uiModules  from 'ui/modules';
import template from 'plugins/keycloak-kibana/views/nav_control/nav_control.html';
import 'plugins/keycloak-kibana/services/authService';

chromeNavControlsRegistry.register(function (){
  return {
    name: 'keycloak',
    order: 1000,
    template
  };
});


uiModules.get('app/keycloak', ['kibana']).controller('keycloakNavController', ($scope, authService, globalNavState) => {
  $scope.tooltipContent = (content) => {
    return globalNavState.isOpen() ? undefined : content;
  };
  authService.getPrincipal().then(response => {
    $scope.user = response.data;
  }).catch(response => {
    if(response.status === 401) {
      window.location.reload(true);
    }
  });
});