import {constant} from 'lodash';
import {chromeNavControlsRegistry} from 'ui/registry/chrome_nav_controls';
import {uiModules} from 'ui/modules';
import template from 'plugins/keycloak-kibana/views/nav_control/nav_control.html';
import {PRINCIPAL_UPDATE} from "../../authz/events";

chromeNavControlsRegistry.register(constant({
  name: 'keycloak',
  order: 1000,
  template
}));

uiModules.get('app/keycloak', ['kibana']).controller('keycloakNavController', ($scope, globalNavState) => {
    $scope.tooltipContent = (content) => {
      return globalNavState.isOpen() ? undefined : content;
    };
    $scope.$root.$on(PRINCIPAL_UPDATE, (evt, principal) => {
        $scope.user = principal;
    });
});
