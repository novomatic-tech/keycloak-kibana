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

    creates = (resourceType) => {
        return this.request.path === `/api/saved_objects/${resourceType}` &&
            this.request.method === 'post';
    };

    updates = (resourceType) => {
        return this.request.path.match(`^\/api\/saved_objects\/${resourceType}\/[a-z0-9\-]+$`) &&
            this.request.method === 'post';
    };

    deletes = (resourceType) => {
        return this.request.path.match(`^\/api\/saved_objects\/${resourceType}\/[a-z0-9\-]+$`) &&
            this.request.method === 'delete';
    };
}