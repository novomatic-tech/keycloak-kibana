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
        this.state = {
            isOpen: false,
        };
    }

    onMenuButtonClick = () => {
        this.setState({
            isOpen: !this.state.isOpen,
        });
    };

    closeMenu = () => {
        this.setState({
            isOpen: false,
        });
    };

    render() {
        const { user  } = this.props;

        const name = user.name || '';
        console.log(user);

        const button = (
            <EuiHeaderSectionItemButton
                aria-controls="headerUserMenu"
                aria-expanded={this.state.isOpen}
                aria-haspopup="true"
                aria-label={
                    <FormattedMessage
                        id="xpack.security.navControlComponent.accountMenuAriaLabel"
                        defaultMessage="Account menu"
                    />
                }
                onClick={this.onMenuButtonClick}
                data-test-subj="userMenuButton"
            >
                <EuiAvatar name={name} size="s" />
            </EuiHeaderSectionItemButton>
        );

        return (
            <EuiPopover
                id="headerUserMenu"
                ownFocus
                button={button}
                isOpen={this.state.isOpen}
                anchorPosition="downRight"
                repositionOnScroll
                closePopover={this.closeMenu}
                panelPaddingSize="none">
                <div style={{ width: 320 }} data-test-subj="userMenu">
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

                            <EuiLink href={user.accountUrl} data-test-subj="profileLink">
                                <FormattedMessage
                                    id="xpack.security.navControlComponent.editProfileLinkText"
                                    defaultMessage="Edit profile"
                                />
                            </EuiLink>

                            <EuiSpacer size="s" />

                            <EuiLink href={user.changePasswordUrl} data-test-subj="changePasswordLink">
                                <FormattedMessage
                                    id="xpack.security.navControlComponent.changePasswordText"
                                    defaultMessage="Change password"
                                />
                            </EuiLink>

                            <EuiSpacer size="s" />

                            <EuiLink href={user.logoutUrl} data-test-subj="logoutLink">
                                <FormattedMessage
                                    id="xpack.security.navControlComponent.logoutLinkText"
                                    defaultMessage="Log out"
                                />
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