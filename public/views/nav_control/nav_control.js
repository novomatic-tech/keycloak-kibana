import { chromeHeaderNavControlsRegistry } from 'ui/registry/chrome_header_nav_controls';
import { I18nContext } from 'ui/i18n';
import React from 'react';
import ReactDOM from 'react-dom';

import { NavControlSide } from 'ui/chrome/directives/header_global_nav';
import UserNavControl from '../../authz/components/UserNavControl';

chromeHeaderNavControlsRegistry.register((principalProvider) => ({
  name: 'principal',
  order: 1000,
  side: NavControlSide.Right,
  render(el) {
    principalProvider.getPrincipal$().subscribe({
      next: (principal) => {
        const props = { user: principal };
        ReactDOM.render(
          <I18nContext>
            <UserNavControl {...props} />
          </I18nContext>,
          el
        );
      }
    });
    return () => ReactDOM.unmountComponentAtNode(el);
  }
}));