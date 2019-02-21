
const configureUsersRoute = (server) => {

    server.route({ // TODO: fetch users from Keycloak.
        method: 'GET',
        path: '/api/users',
        handler: (request, reply) => {
            let users = [
                {"id":"d70f600a-dcc2-4a84-af7a-c9de8ca403bf","username":"admin","email":"admin@novomatic-tech.com","enabled":true,"totp":false,"emailVerified":false,"firstName":"Admin","lastName":"van Buuren","disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}},
                {"id":"97aa1a38-6ae4-448e-abb6-0f0ec687b5e5","username":"user1","email":"user1@novomatic-tech.com","enabled":true,"totp":false,"emailVerified":false,"firstName":"Lady","lastName":"Gaga","attributes":{"country":["IT"]},"disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}},
                {"id":"5d26acdb-bc8f-413c-857a-832379bd4556","username":"user2","email":"user2@novomatic-tech.com","enabled":true,"totp":false,"emailVerified":false,"firstName":"Travis","lastName":"Rice","attributes":{"country":["US"]},"disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}},
                {"id":"eafe2c51-6afa-4cf6-8155-3fe379499506","username":"user3","email":"user3@novomatic-tech.com","enabled":true,"totp":false,"emailVerified":false,"firstName":"Bradley","lastName":"Cooper","attributes":{"country":["CA"]},"disableableCredentialTypes":["password"],"requiredActions":[],"notBefore":0,"access":{"manageGroupMembership":true,"view":true,"mapRoles":true,"impersonate":true,"manage":true}}
            ];
            const filter = (request.query.filter || '').toLowerCase().trim();
            if (filter !== '') {
                users = users.filter(u => u.username.toLowerCase().indexOf(filter) !== -1 ||
                    u.firstName.toLowerCase().indexOf(filter) !== -1 ||
                    u.lastName.toLowerCase().indexOf(filter) !== -1  ||
                    u.email.toLowerCase().indexOf(filter) !== -1)
            }
            return reply(users);
        }
    });

    server.route({
        method: 'GET',
        path: '/info/routes',
        handler: (request, reply) => {
            const routes = server.table()[0].table;
            return reply(routes.filter(r => r.path.startsWith('/api/saved_objects')).map(r => { return { method: r.method, path: r.path}}));
        },
        config: {
            auth: false
        }
    })


};

export default configureUsersRoute;