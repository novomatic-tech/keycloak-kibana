export default class InternalGrant {

  constructor(grantManager) {
    this._grantManager = grantManager;
  }

  initialize = async () => {
    try {
      return await this.getValue();
    } catch (e) {
      console.error(e);
      throw new Error('Unable to initialize internal user using client credentials grant. ' +
        'Make sure Service Accounts are enabled for this client and correct values for ' +
        'clientId and clientSecret were provided.');
    }
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

  reset = async () => {
    this._grant = null;
  };
}
