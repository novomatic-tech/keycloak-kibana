export default class InternalGrant {

    constructor(grantManager) {
        this._grantManager = grantManager;
    }

    initialize = () => {
        return this.getValue();
    };

    getAccessToken = async () => {
        const value = await this.getValue();
        return value.access_token.token;
    };

    getValue = async () => {
        if (!this._grant || this._grant.refresh_token.isExpired()) {
            this._grant = await this._grantManager.obtainFromClientCredentials();
            return this._grant;
        }
        return await this._grantManager.ensureFreshness(this._grant);
    };
}