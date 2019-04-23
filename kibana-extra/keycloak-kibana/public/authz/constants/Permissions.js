import React from 'react';
import { FormattedMessage } from '@kbn/i18n/react';

const permissions = {
  VIEW: 'view',
  EDIT: 'edit',
  MANAGE: 'manage',
};

permissions.listAvailable = () => [
  {
    label: <FormattedMessage id="keycloak.permissions.canView" defaultMessage="Can view"/>,
    value: permissions.VIEW,
    icon: 'eye'
  },
  {
    label: <FormattedMessage id="keycloak.permissions.canEdit" defaultMessage="Can edit"/>,
    value: permissions.EDIT,
    icon: 'pencil'
  },
  {
    label: <FormattedMessage id="keycloak.permissions.canManage" defaultMessage="Can manage"/>,
    value: permissions.MANAGE,
    icon: 'wrench'
  }
];

permissions.getMappings = () => {
  const permissionProperties = permissions.listAvailable().reduce((obj, permission) => {
    obj[permission.value] = { type: 'keyword' };
    return obj;
  }, {});
  return {
    acl: {
      properties: {
        owner: { type: 'keyword' },
        permissions: {
          properties: permissionProperties
        }
      }
    }
  };
};

permissions.allKeyword = () => 'all';

export default permissions;
