import _ from 'lodash';

export class SecureClusterFacade {

    constructor({ cluster, authRules }) {
        this._cluster = cluster;
        this._authRules = authRules;
    }

    async callWithRequest(req = {}, endpoint, clientParams = {}, options = {}) {

        console.log("PRINCIPAL:");
        console.log(req.getPrincipal());

        let callWithRequest = this._cluster.callWithRequest;
        const rule = _.find(this._authRules, rule => rule.matches(req, endpoint, clientParams, options));
        if (rule) {
            callWithRequest = (...args) => rule.callWithRequest(this._cluster.callWithRequest, ...args);
        }
        const response = await callWithRequest(req, endpoint, clientParams, options);
        return response;
    }
}
