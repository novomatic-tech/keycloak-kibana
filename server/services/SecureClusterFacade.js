import _ from 'lodash';
import ClusterDecorator from "./ClusterDecorator";
import SavedObjectAction from "./SavedObjectAction";

export class SecureClusterFacade {

    constructor({ cluster, authRules }) {
        this._cluster = cluster;
        this._authRules = authRules;
    }

    async callWithRequest(req = {}, endpoint, clientParams = {}, options = {}) {
        const cluster = new ClusterDecorator(this._cluster);
        const action = new SavedObjectAction({
            request: req,
            principal: req.getPrincipal(),
            cluster,
            clusterRequest: {
                endpoint,
                clientParams,
                options
            }
        });
        const rule = _.find(this._authRules, rule => rule.matches(action));
        if (rule) {
            return await rule.process(cluster, action);
        }
        throw Boom.forbidden('The user is not authorized to perform this operation.');
    }
}

export const secureSavedObjects = (server, authRules) => {
    const { savedObjects } = server;
    savedObjects.setScopedSavedObjectsClientFactory(({ request }) => {
        const secureCluster = new SecureClusterFacade({
            cluster: server.plugins.elasticsearch.getCluster('admin'),
            authRules
        });
        const secureCallCluster = (...args) => secureCluster.callWithRequest(request, ...args);
        const secureRepository = savedObjects.getSavedObjectsRepository(secureCallCluster);
        return new savedObjects.SavedObjectsClient(secureRepository);
    });
};
