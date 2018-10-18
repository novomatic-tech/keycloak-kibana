import {PRINCIPAL_UPDATE, PRINCIPAL_UPDATE_ERROR} from "./events";
import AuthorizationError from "./AuthorizationError";


export default class PrincipalProvider {

    constructor($rootScope, $http, chrome) {
        this._httpClient = $http;
        this._url = chrome.addBasePath('/api/principal');
        this.$rootScope = $rootScope;
        this._principal = null;
    }

    getPrincipal() {
        return this._principal;
    }

    getPrincipalAsync() {
        if (this._principal) {
            return Promise.resolve(this._principal);
        }
        return this._updatePrincipal();
    }

    _updatePrincipal() {
        const provider = this;
        return this._httpClient.get(this._url).then(response => {
            provider._principal = response.data;
            if (window.onKibanaPrincipalUpdated) {
                window.onKibanaPrincipalUpdated(response.data);
            }
            provider.$rootScope.$emit(PRINCIPAL_UPDATE, provider._principal);
            return response.data;
        }).catch(e => {
            provider.$rootScope.$emit(PRINCIPAL_UPDATE_ERROR, e);
            throw new AuthorizationError(e.message); // TODO check whether this is 401
        });
    }
}