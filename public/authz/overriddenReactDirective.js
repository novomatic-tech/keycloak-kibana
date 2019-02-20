const overriddenReactDirective = (reactComponent) => {
    return function ($delegate, reactDirective, principalProvider, userProvider, dashboardPermissions) {
        return $delegate.map(d => {

            const props = {
                principal: principalProvider.getPrincipal(),
                getUsers: userProvider.getUsers,
                getPermissions: dashboardPermissions.getPermissions,
                addPermission: dashboardPermissions.addPermission,
                addPermissionForAll: dashboardPermissions.addPermissionForAll,
                revokePermission: dashboardPermissions.revokePermission,
                revokePermissionForAll: dashboardPermissions.revokePermissionForAll,
            };
            const directive = reactDirective(reactComponent, undefined, {}, props);
            directive.compile = () => directive.link;
            return Object.assign(d, directive);
        });
    };
};
export default overriddenReactDirective;