/**
 * This replaces the controller of the original appSwitcher directive
 * so that it is possible to modify a list of links in the main menu.
 *
 * @see https://github.com/elastic/kibana/blob/v6.4.2/src/ui/public/chrome/directives/global_nav/app_switcher/app_switcher.js#L64
 */
export default function AppSwitcherDecorator($delegate) {
    return $delegate.map(del => {
        const baseControler = del.controller;
        function newController($scope, appSwitcherEnsureNavigation, navigationHandler, globalNavState) {
            const newScope = Object.assign({}, $scope, {
                chrome: {
                    getNavLinks: () => navigationHandler.getActiveLinks()
                }
            });
            baseControler.bind(this).call(del, newScope, appSwitcherEnsureNavigation, globalNavState);
        }
        del.controller = newController;
        return del;
    });
}