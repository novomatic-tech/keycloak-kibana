
export default class AuthorizationError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AuthorizationError';
    if (cause) {
      this.cause = cause;
    }
  }
}
