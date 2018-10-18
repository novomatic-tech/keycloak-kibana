import {NAVIGATION_UPDATE} from "./events";

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