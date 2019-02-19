const overriddenReactDirective = (reactComponent) => {
    return function ($delegate, reactDirective, principalProvider, userProvider) {
        return $delegate.map(d => {

            const props = {
                principal: principalProvider.getPrincipal(),
                getUsers: userProvider.getUsers
            };
            const directive = reactDirective(reactComponent, undefined, {}, props);
            directive.compile = () => directive.link;
            return Object.assign(d, directive);
        });
    };
};
export default overriddenReactDirective;