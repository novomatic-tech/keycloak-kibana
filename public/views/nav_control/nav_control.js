import {chromeNavControlsRegistry} from 'ui/registry/chrome_nav_controls';
import {chromeHeaderNavControlsRegistry} from 'ui/registry/chrome_header_nav_controls';
import {I18nContext} from 'ui/i18n';
import React from 'react';
import ReactDOM from 'react-dom';

import {uiModules} from 'ui/modules';
import {NavControlSide} from 'ui/chrome/directives/header_global_nav';
import UserNavControl from "../../authz/components/UserNavControl";

chromeHeaderNavControlsRegistry.register((principalProvider) => ({
    name: 'principal',
    order: 1000,
    side: NavControlSide.Right,
    render(el) {
        principalProvider.getPrincipal$().subscribe({
            next: (principal) => {
                const props = {user: principal};
                ReactDOM.render(
                    <I18nContext>
                        <UserNavControl {...props} />
                    </I18nContext>,
                    el
                );
            }
        });

        // props.principal.accountUrl, props.principal.logoutUrl

        return () => ReactDOM.unmountComponentAtNode(el);
    }
}));