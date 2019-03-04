const permissions = {
    VIEW: 'view',
    EDIT: 'edit',
    MANAGE: 'manage',
};

permissions.listAvailable = () => [
    { label: 'Can view', value: permissions.VIEW, icon: 'eye' },
    { label: 'Can edit', value: permissions.EDIT, icon: 'pencil' },
    { label: 'Can manage', value: permissions.MANAGE, icon: 'wrench' }
];

permissions.getMappings = () => {
    const permissionProperties = permissions.listAvailable().reduce((obj, permission) => {
        obj[permission.value] = {type: 'keyword'};
        return obj;
    }, {});
    return {
        acl: {
            properties: {
                owner: { type: "keyword" },
                permissions: {
                    properties: permissionProperties
                }
            }
        }
    }
};

permissions.allKeyword = () => 'all';

export default permissions;