const overriddenReactDirective = (reactComponent) => {
    return function ($delegate, reactDirective) {
        return $delegate.map(d => {
            const directive = reactDirective(reactComponent);
            directive.compile = () => directive.link;
            return Object.assign(d, directive);
        });
    };
};
export default overriddenReactDirective;