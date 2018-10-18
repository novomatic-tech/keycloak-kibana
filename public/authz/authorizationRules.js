import _ from 'lodash';
import roles from './roles';

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
        { resource: hasId('kibana:discover'), principal: hasRole(roles.DISCOVER) },
        { resource: hasId('kibana:visualize'), principal: hasRole([roles.VIEW_VISUALIZATIONS, roles.MANAGE_VISUALIZATIONS]) },
        { resource: hasId('kibana:dashboard'), principal: hasRole([roles.VIEW_DASHBOARDS, roles.MANAGE_DASHBOARDS]) },
        { resource: hasId('timelion'), principal: hasRole(roles.USE_TIMELION) },
        { resource: hasId('kibana:dev_tools'), principal: hasRole(roles.USE_DEV_TOOLS) },
        { resource: hasId('kibana:management'), principal: hasRole(roles.MANAGE_KIBANA) }
    ],
    routes: [
        { resource: pathStartsWith('/home'), principal: () => true },
        { resource: pathStartsWith('/discover'), principal: hasRole(roles.DISCOVER) },
        { resource: pathStartsWith('/dashboard'), principal: hasRole([roles.VIEW_DASHBOARDS, roles.MANAGE_DASHBOARDS]) },
        { resource: pathStartsWith('/visualize/new'), principal: hasRole(roles.MANAGE_VISUALIZATIONS) },
        { resource: pathStartsWith('/visualize/edit'), principal: hasRole(roles.MANAGE_VISUALIZATIONS) },
        { resource: pathStartsWith('/visualize/create'), principal: hasRole(roles.MANAGE_VISUALIZATIONS) },
        { resource: pathStartsWith('/visualize'), principal: hasRole(roles.VIEW_VISUALIZATIONS) },
        { resource: pathStartsWith('/dev_tools'), principal: hasRole(roles.USE_DEV_TOOLS) },
        { resource: pathStartsWith('/management'), principal: hasRole(roles.MANAGE_KIBANA) }
    ],
    allowMissingNavLinks: true,
    allowMissingRoutes: true
};

export default authorizationRules;