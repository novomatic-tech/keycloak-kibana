import { kfetch } from 'ui/kfetch';

export default class UserProvider {
    async getUsers(filter = null) {
        return kfetch({ method: 'GET', pathname: '/api/users', query: { filter } });
    }
}
