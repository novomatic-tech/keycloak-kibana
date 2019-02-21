import {NAVIGATION_UPDATE} from "../constants/EventTypes";

/**
 * This replaces the controller of the original appSwitcher directive
 * so that it is possible to modify a list of links in the main menu.
 *
 * @see https://github.com/elastic/kibana/blob/v6.4.2/src/ui/public/chrome/directives/global_nav/app_switcher/app_switcher.js#L64
 */
export default function AppSwitcherDecorator($delegate) {
    return $delegate.map(del => {
        const baseControler = del.controller;
        function newController($scope, appSwitcherEnsureNavigation, globalNavState) {
            baseControler.bind(this).call(del, $scope, appSwitcherEnsureNavigation, globalNavState);
            const switcher = this;
            $scope.$root.$on(NAVIGATION_UPDATE, (evt, links) => {
                switcher.links = links;
                $scope.$apply();
            });
        }
        del.controller = newController;
        return del;
    });
}