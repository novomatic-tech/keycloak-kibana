import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { toastNotifications } from 'ui/notify';
import {
    EuiTitle,
    EuiFieldSearch,
    EuiBasicTable,
    EuiPage,
    EuiPageBody,
    EuiPageContent,
    EuiLink,
    EuiFlexGroup,
    EuiFlexItem,
    EuiButton,
    EuiSpacer,
    EuiIcon,
    EuiOverlayMask,
    EuiConfirmModal,
    EuiCallOut,
    EuiText,
    EuiTextColor,
    EuiEmptyPrompt,
    EuiFieldText,
    EuiModal,
    EuiModalBody,
    EuiModalFooter,
    EuiModalHeader,
    EuiModalHeaderTitle,
    EuiPanel,
    EuiComboBox,
    EuiContextMenuPanel,
    EuiContextMenuItem,
    EuiPopover,
    EuiButtonIcon
} from '@elastic/eui';


class PermissionSelectBox extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            popoverOpen: false
        };
    }

    togglePopover = () => {
        this.setState(prevState => ({ popoverOpen: !prevState.popoverOpen }));
    };

    closePopover = () => {
        this.setState({ popoverOpen: false });
    };

    onPopoverBlur = () => {
        // you must be asking... WTF? I know... but this timeout is
        // required to make sure we process the onBlur events after the initial
        // event cycle. Reference:
        // https://medium.com/@jessebeach/dealing-with-focus-and-blur-in-a-composite-widget-in-react-90d3c3b49a9b
        window.requestAnimationFrame(() => {
            if (!this.popoverDiv.contains(document.activeElement) && this.props.onBlur) {
                this.props.onBlur();
            }
        });
    };

    registerPopoverDiv = (popoverDiv) => {
        if (!this.popoverDiv) {
            this.popoverDiv = popoverDiv;
            this.popoverDiv.addEventListener('focusout', this.onPopoverBlur);
        }
    };

    componentWillUnmount() {
        if (this.popoverDiv) {
            this.popoverDiv.removeEventListener('focusout', this.onPopoverBlur);
        }
    }

    onItemSelected = (item) => {
        this.closePopover();
        this.props.onChange(item);
    };

    render() {
        const { onFocus } = this.props;
        const isOpen = this.state.popoverOpen;
        const popoverButton = (
            <EuiButtonIcon style={{ width: '2.9em', height: '2.9em', marginLeft: '1em', borderColor: 'rgba(45, 45, 45, 0.2)' }}
                size={"l"}
                aria-label="actions"
                iconType={this.props.selectedOption.icon}
                color="text"
                onClick={this.togglePopover.bind(this)}
                onFocus={onFocus}
            />
        );

        const controls = this.props.options.map(item =>
            (<EuiContextMenuItem onClick={() => this.onItemSelected(item)} key={item.value} icon={item.icon}>{item.label}</EuiContextMenuItem>)
        );

        return (
            <EuiPopover
                popoverRef={this.registerPopoverDiv}
                id={`permission-types`}
                isOpen={isOpen}
                button={popoverButton}
                closePopover={this.closePopover}
                panelPaddingSize="none"
                anchorPosition="rightCenter" >
                <EuiContextMenuPanel items={controls}/>
            </EuiPopover>
        );
    }
}


export default class ShareDashboardModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            availablePermissions: [
                { label: 'View', value: 'view', icon: 'eye' },
                { label: 'Manage', value: 'manage', icon: 'pencil' }
            ],
            availableUsers: [],
            selectedUsers: [],
            isFetchingUsers: false,
            userFilter: null
        };
        this.state.selectedPermission = this.state.availablePermissions[0];
    }

    debouncedFetchUsers = _.debounce(async (filter) => {
        const response = await this.props.getUsers(filter);
        this.setState({
            isFetchingUsers: false,
            availableUsers: response.map(u => {
                return {
                    label: `${u.firstName} ${u.lastName}`,
                    value: u.username,
                    data: u
                }
            })
        });
    }, 300);

    fetchUsers = (userFilter) => {
        this.setState({
            isFetchingUsers: true,
            userFilter
        }, this.debouncedFetchUsers.bind(null, userFilter));
    };

    componentDidMount() {
        this.fetchUsers();
    }

    setSelectedUsers = (selectedUsers) => {
        this.setState({ selectedUsers });
    };

    setSelectedPermission = (selectedPermission) => {
        this.setState({ selectedPermission });
    };

    render() {
        return (<EuiOverlayMask>
            <EuiPanel style={{ flexGrow: 0.05 }}>
                <EuiModalHeader>
                    <EuiModalHeaderTitle>
                        Share Dashboard
                    </EuiModalHeaderTitle>
                </EuiModalHeader>
                <EuiModalBody>
                    <EuiText>
                        <p>Please select people you want the dashboard to be shared with.</p>
                    </EuiText>
                    <EuiSpacer />
                    <div>
                    <EuiComboBox options={this.state.isFetchingUsers ? [] : this.state.availableUsers}
                                 selectedOptions={this.state.selectedUsers}
                                 onSearchChange={this.fetchUsers}
                                 onChange={this.setSelectedUsers}
                                 placeholder="Enter user names or emails..."
                                 singleSelection={false} style={{ float: 'left'}} />

                    <PermissionSelectBox options={this.state.availablePermissions}
                                         selectedOption={this.state.selectedPermission}
                                         onChange={this.setSelectedPermission}/>
                    </div>
                </EuiModalBody>

                <EuiModalFooter>
                    <EuiButton data-test-subj="shareCancelButton" onClick={this.props.onClose}>
                        Cancel
                    </EuiButton>
                    <EuiButton fill data-test-subj="shareConfirmButton" onClick={this.props.onShare}>
                        Share
                    </EuiButton>
                </EuiModalFooter>
            </EuiPanel>
        </EuiOverlayMask>)
    }
}


ShareDashboardModal.propTypes = {
    onClose: PropTypes.func.isRequired
};