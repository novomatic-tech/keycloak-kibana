export default class SavedObjectAction {
    constructor({ request, principal, clusterRequest }) {
        this.request = request;
        this.principal = principal;
        this.clusterRequest = clusterRequest;
    }

    isFind = () => {
        return this.request.path === '/api/saved_objects/_find' &&
            this.request.method === 'get';
    };

    isBulkGet = () => {
        return this.request.path === '/api/saved_objects/_bulk_get' &&
            this.request.method === 'post';
    };

    isCreationOf = (resourceType) => {
        return this.request.path === `/api/saved_objects/${resourceType}` &&
            this.request.method === 'post';
    };

    isUpdateOf = (resourceType) => {
        return this.request.path.match(`^\/api\/saved_objects\/${resourceType}\/[a-z0-9\-.]+$`) &&
            this.request.method === 'post';
    };

    isDeletionOf = (resourceType) => {
        return this.request.path.match(`^\/api\/saved_objects\/${resourceType}\/[a-z0-9\-.]+$`) &&
            this.request.method === 'delete';
    };

    isRetrievalOf = (resourceType) => {
        const {endpoint, clientParams} = this.clusterRequest;
        return endpoint === 'get' && clientParams.id.startsWith(resourceType);
    };
}