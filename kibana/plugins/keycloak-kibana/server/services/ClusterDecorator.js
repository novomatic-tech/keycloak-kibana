export default class ClusterDecorator {

  constructor(cluster) {
    this._cluster = cluster;
  }

    callWithInternalUser = (endpoint, clientParams, options) => {
      return this._cluster.callWithInternalUser(endpoint, clientParams, options);
    };

    callWithRequest = (request, endpoint, clientParams, options) => {
      return this._cluster.callWithRequest(request, endpoint, clientParams, options);
    };

    processAction = (action) => {
      const { endpoint, clientParams, options } = action.clusterRequest;
      return this._cluster.callWithInternalUser(endpoint, clientParams, options);
    };
}
