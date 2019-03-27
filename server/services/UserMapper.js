
const UserIdMappers = {
  preferred_username: (user) => user.username,
  sub: (user) => user.id,
  email: (user) => user.email
};

const FullUserMapper = (idMapper) => (user) => {
  return {
    id: idMapper(user),
    name: `${user.firstName} ${user.lastName}`,
    username: user.username,
    email: user.email
  };
};

const LimitedUserMapper = (idMapper) => (user) => {
  const id = idMapper(user);
  return { id };
};

export default class UserMapper {

  constructor(keycloakConfig) {
    const idMapper = UserIdMappers[keycloakConfig.acl.ownerAttribute];
    const mapper = keycloakConfig.acl.ownerAttribute === 'sub'
      ? FullUserMapper
      : LimitedUserMapper;
    this._delegate = mapper(idMapper);
  }

    map = (user) => {
      return this._delegate(user);
    }
}