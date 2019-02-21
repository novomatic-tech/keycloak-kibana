import _ from 'lodash';
import Roles from './constants/Roles';

const hasRole = (role) => {
    const roles = _.isArray(role) ? role : [role];
    return (principal) => {
        return _.intersection(roles, principal.scope).length > 0;
    }
};

const hasId = (id) => (resource) => resource.id === id;
const pathStartsWith = (pathPrefix) => (resource) => resource.originalPath.startsWith(pathPrefix);

const authorizationRules = {
    navLinks: [
        { resource: hasId('kibana:discover'), principal: hasRole(Roles.DISCOVER) },
        { resource: hasId('kibana:visualize'), principal: hasRole([Roles.VIEW_VISUALIZATIONS, Roles.MANAGE_VISUALIZATIONS]) },
        { resource: hasId('kibana:dashboard'), principal: hasRole([Roles.VIEW_DASHBOARDS, Roles.MANAGE_DASHBOARDS]) },
        { resource: hasId('timelion'), principal: hasRole(Roles.USE_TIMELION) },
        { resource: hasId('kibana:dev_tools'), principal: hasRole(Roles.USE_DEV_TOOLS) },
        { resource: hasId('kibana:management'), principal: hasRole(Roles.MANAGE_KIBANA) }
    ],
    routes: [
        { resource: pathStartsWith('/home'), principal: () => true },
        { resource: pathStartsWith('/discover'), principal: hasRole(Roles.DISCOVER) },
        { resource: pathStartsWith('/dashboard'), principal: hasRole([Roles.VIEW_DASHBOARDS, Roles.MANAGE_DASHBOARDS]) },
        { resource: pathStartsWith('/visualize/new'), principal: hasRole(Roles.MANAGE_VISUALIZATIONS) },
        { resource: pathStartsWith('/visualize/edit'), principal: hasRole(Roles.MANAGE_VISUALIZATIONS) },
        { resource: pathStartsWith('/visualize/create'), principal: hasRole(Roles.MANAGE_VISUALIZATIONS) },
        { resource: pathStartsWith('/visualize'), principal: hasRole(Roles.VIEW_VISUALIZATIONS) },
        { resource: pathStartsWith('/dev_tools'), principal: hasRole(Roles.USE_DEV_TOOLS) },
        { resource: pathStartsWith('/management'), principal: hasRole(Roles.MANAGE_KIBANA) }
    ],
    allowMissingNavLinks: true,
    allowMissingRoutes: true
};

export default authorizationRules;