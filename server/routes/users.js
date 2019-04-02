const configureUsersRoutes = (server, userProvider, userMapper) => {

  server.route({
    method: 'GET',
    path: '/api/users',
    handler: async (request) => {
      const search = (request.query.filter || '').toLowerCase().trim();
      const users = await userProvider.getUsers(search);
      return users.map(userMapper.map);
    }
  });
};

export default configureUsersRoutes;