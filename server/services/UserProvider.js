import axios from "axios/index";


export default class UserProvider {

    constructor(keycloakConfig, internalGrant) {
        this._keycloakConfig = keycloakConfig;
        this._internalGrant = internalGrant;
    }

    getUsers = async (search) => {
        const url = `${this._keycloakConfig.serverUrl}/admin/realms/${this._keycloakConfig.realm}/users`;
        const params = { briefRepresentation: true, first: 0, max: 10, search };
        const headers = await this._buildHeaders();
        const response = await axios.get(url, { params, headers });
        const users = response.data;
        return users;
    };

    getUserById = async (id) => {
        const url = `${this._keycloakConfig.serverUrl}/admin/realms/${this._keycloakConfig.realm}/users/${id}`;
        const headers = await this._buildHeaders();
        const response = await axios.get(url, { headers });
        return response.data;
    };

    updateUser = async (user) => {
        const url = `${this._keycloakConfig.serverUrl}/admin/realms/${this._keycloakConfig.realm}/users/${user.id}`;
        const headers = await this._buildHeaders();
        await axios.put(url, user, { headers });
    };

    _buildHeaders = async () => {
        const accessToken = await this._internalGrant.getAccessToken();
        return {
            authorization: `Bearer ${accessToken}`,
            contentType: 'application/json'
        };
    };

}
