import PropTypes from 'prop-types';
import { FormattedMessage } from '@kbn/i18n/react';
import React, {
  Component,
} from 'react';

import {
  EuiAvatar,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHeaderSectionItemButton,
  EuiLink,
  EuiText,
  EuiSpacer,
  EuiPopover,
} from '@elastic/eui';

export default class UserNavControl extends React.Component {

  constructor(props) {
    super(props);
    this.state = { open: false };
  }

    toggleMenu = () => {
      this.setState({ open: !this.state.open });
    };

    closeMenu = () => {
      this.setState({ open: false });
    };

    renderButton = (name) => (
      <EuiHeaderSectionItemButton
        aria-controls="headerAccountMenu"
        aria-expanded={this.state.open}
        aria-haspopup="true"
        aria-label={<FormattedMessage id="keycloak.accountMenuAriaLabel" defaultMessage="Account menu" />}
        onClick={this.toggleMenu}
      >
        <EuiAvatar name={name} size="s" />
      </EuiHeaderSectionItemButton>
    );

    render() {
      const { user } = this.props;
      const name = user.name || '';
      return (
        <EuiPopover
          id="headerUserMenu"
          ownFocus
          button={this.renderButton(name)}
          isOpen={this.state.open}
          anchorPosition="downRight"
          repositionOnScroll
          closePopover={this.closeMenu}
          panelPaddingSize="none"
        >
          <div style={{ width: 320 }}>
            <EuiFlexGroup gutterSize="m" className="euiHeaderProfile" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiAvatar name={name} size="xl" />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText>
                  <p>{name}</p>
                </EuiText>
                <EuiText size="s" style={{ color: '#666' }}>
                  <p>{user.email}</p>
                </EuiText>
                <EuiSpacer size="m" />
                <EuiLink href={user.accountUrl}>
                  <FormattedMessage id="keycloak.editProfileLinkText" defaultMessage="Edit profile"/>
                </EuiLink>
                <EuiSpacer size="s" />
                <EuiLink href={user.changePasswordUrl}>
                  <FormattedMessage id="keycloak.changePasswordLinkText" defaultMessage="Change password"/>
                </EuiLink>
                <EuiSpacer size="s" />
                <EuiLink href={user.logoutUrl}>
                  <FormattedMessage id="keycloak.logoutLinkText" defaultMessage="Log out"/>
                </EuiLink>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        </EuiPopover>
      );
    }
}

UserNavControl.propTypes = {
  user: PropTypes.object.isRequired
};