import {PRINCIPAL_UPDATE} from "./events";
import {MANAGE_DASHBOARDS} from "./roles";

export default class NavigationAuthorization {

    constructor($rootScope, navigationHandler, authorizationRules) {
        this.$rootScope = $rootScope;
        this._navigationHandler = navigationHandler;
        this._authorizationRules = authorizationRules;
        //this._dashboardConfig = dashboardConfig;
    }

    initialize() {
        const authRulez = this._authorizationRules;
        const navAuthz = this;
        this.$rootScope.$on(PRINCIPAL_UPDATE, (evt, principal) => {
            const linksToShow = [];
            const linksToHide = [];
            navAuthz._navigationHandler.getAllLinks().forEach(link => {
                const rule = _.find(authRulez.navLinks, rule => rule.resource(link, principal));
                let isAuthorized = authRulez.allowMissingNavLinks;
                if (rule) {
                    isAuthorized = rule.principal(principal, link);
                }
                if (isAuthorized) {
                    linksToShow.push(link.id);
                } else {
                    linksToHide.push(link.id);
                }
            });
            //evt.stopPropagation();
            navAuthz._navigationHandler.showLinks(linksToShow);
            navAuthz._navigationHandler.hideLinks(linksToHide);
            if (!principal.scope.includes(MANAGE_DASHBOARDS)) {
                //navAuthz._dashboardConfig.getHideWriteControls = () => true;
            }
        });
    }
}