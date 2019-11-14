import Roles from './constants/Roles';
import _ from 'lodash';

const hasRole = (...roles) => principal => _.intersection(roles, principal.scope).length > 0;

const hasId = id => resource => resource === id;
const pathEndsWith = pathSuffix => url => url.pathname.endsWith(pathSuffix);
const hashStartsWith = hashPrefix => url => url.hash.startsWith(hashPrefix);
const isKibanaApp = pathEndsWith('/app/kibana');

const whether = (...conditions) => url => conditions.every(condition => condition(url));

const authorizationRules = {
  navLinks: [
    { resource: hasId('kibana:discover'), principal: hasRole(Roles.DISCOVER) },
    { resource: hasId('kibana:visualize'), principal: hasRole(Roles.VIEW_VISUALIZATIONS, Roles.MANAGE_VISUALIZATIONS) },
    { resource: hasId('kibana:dashboard'), principal: hasRole(Roles.VIEW_DASHBOARDS, Roles.MANAGE_DASHBOARDS) },
    { resource: hasId('canvas'), principal: hasRole(Roles.USE_CANVAS) },
    { resource: hasId('maps'), principal: hasRole(Roles.USE_MAPS) },
    { resource: hasId('ml'), principal: hasRole(Roles.USE_ML) },
    { resource: hasId('infra:home'), principal: hasRole(Roles.USE_INFRA) },
    { resource: hasId('infra:logs'), principal: hasRole(Roles.USE_INFRA_LOGS) },
    { resource: hasId('apm'), principal: hasRole(Roles.USE_APM) },
    { resource: hasId('uptime'), principal: hasRole(Roles.USE_UPTIME) },
    { resource: hasId('siem'), principal: hasRole(Roles.USE_SIEM) },
    { resource: hasId('kibana:dev_tools'), principal: hasRole(Roles.USE_DEV_TOOLS) },
    { resource: hasId('monitoring'), principal: hasRole(Roles.USE_MONITORING) },
    { resource: hasId('kibana:management'), principal: hasRole(Roles.MANAGE_KIBANA) },
    { resource: hasId('timelion'), principal: hasRole(Roles.USE_TIMELION) },
    { resource: hasId('code'), principal: hasRole(Roles.USE_CODE) },
    { resource: hasId('graph'), principal: hasRole(Roles.USE_GRAPH) }
  ],
  routes: [
    { resource: whether(isKibanaApp, hashStartsWith('#/home')), principal: () => true },
    { resource: whether(isKibanaApp, hashStartsWith('#/discover')), principal: hasRole(Roles.DISCOVER) },
    {
      resource: whether(isKibanaApp, hashStartsWith('#/dashboard')),
      principal: hasRole(Roles.VIEW_DASHBOARDS, Roles.MANAGE_DASHBOARDS)
    },
    { resource: whether(isKibanaApp, hashStartsWith('#/visualize/new')), principal: hasRole(Roles.MANAGE_VISUALIZATIONS) },
    { resource: whether(isKibanaApp, hashStartsWith('#/visualize/edit')), principal: hasRole(Roles.MANAGE_VISUALIZATIONS) },
    { resource: whether(isKibanaApp, hashStartsWith('#/visualize/create')), principal: hasRole(Roles.MANAGE_VISUALIZATIONS) },
    { resource: whether(isKibanaApp, hashStartsWith('#/visualize')), principal: hasRole(Roles.VIEW_VISUALIZATIONS) },
    { resource: whether(pathEndsWith('/app/canvas')), principal: hasRole(Roles.USE_CANVAS) },
    { resource: whether(pathEndsWith('/app/maps')), principal: hasRole(Roles.USE_MAPS) },
    { resource: whether(pathEndsWith('/app/ml')), principal: hasRole(Roles.USE_ML) },
    { resource: whether(pathEndsWith('/app/infra'), hashStartsWith('#/home')), principal: hasRole(Roles.USE_INFRA) },
    { resource: whether(pathEndsWith('/app/infra'), hashStartsWith('#/logs')), principal: hasRole(Roles.USE_INFRA_LOGS) },
    { resource: whether(pathEndsWith('/app/apm')), principal: hasRole(Roles.USE_APM) },
    { resource: whether(pathEndsWith('/app/uptime')), principal: hasRole(Roles.USE_UPTIME) },
    { resource: whether(pathEndsWith('/app/siem')), principal: hasRole(Roles.USE_SIEM) },
    { resource: whether(isKibanaApp, hashStartsWith('#/dev_tools')), principal: hasRole(Roles.USE_DEV_TOOLS) },
    { resource: whether(pathEndsWith('/app/monitoring')), principal: hasRole(Roles.USE_MONITORING) },
    { resource: whether(pathEndsWith('#/management')), principal: hasRole(Roles.MANAGE_KIBANA) },
    { resource: whether(pathEndsWith('/app/timelion')), principal: hasRole(Roles.USE_TIMELION) },
    { resource: whether(pathEndsWith('/app/code')), principal: hasRole(Roles.USE_CODE) },
    { resource: whether(pathEndsWith('/app/graph')), principal: hasRole(Roles.USE_GRAPH) },
  ],
  allowMissingNavLinks: true,
  allowMissingRoutes: true
};

export default authorizationRules;
