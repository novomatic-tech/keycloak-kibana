import _ from 'lodash';

/**
 * This overwrites the 'home' route handling. This is the standard angular behavior.
 * Before the route is handled, the initialCheck is invoked.
 * As a result users are redirected either to a list of dashboards
 * or the home dashboard (if available).
 */
const HomeRouteDecoration = {
    resolve: {
        initialCheck(tagService, kbnUrl) {
            return tagService.getAllDashboardTags().then((dashboardTags) => {
                const homeDashboard = _.find(dashboardTags, d => d.tags.includes('home'));
                kbnUrl.redirect(homeDashboard
                    ? `/dashboard/${homeDashboard.id}`
                    : '/dashboards');
            });
        }
    }
};

export default HomeRouteDecoration;