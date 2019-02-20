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
    EuiComboBox,
    EuiIcon
} from '@elastic/eui';
import ShareDashboardModal from "./ShareDashboardModal";

const DashboardConstants = {
    ADD_VISUALIZATION_TO_DASHBOARD_MODE_PARAM: 'addToDashboard',
    NEW_VISUALIZATION_ID_PARAM: 'addVisualization',
    LANDING_PAGE_PATH: '/dashboards',
    CREATE_NEW_DASHBOARD_URL: '/dashboard',
};

function createDashboardEditUrl(id) {
    return `/dashboard/${id}`;
}

export const EMPTY_FILTER = '';

// saved object client does not support sorting by title because title is only mapped as analyzed
// the legacy implementation got around this by pulling `listingLimit` items and doing client side sorting
// and not supporting server-side paging.
// This component does not try to tackle these problems (yet) and is just feature matching the legacy component
// TODO support server side sorting/paging once title and description are sortable on the server.
export class DashboardListing extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            hasInitialFetchReturned: false,
            isFetchingItems: false,
            showDeleteModal: false,
            showShareModal: false,
            showLimitError: false,
            filter: this.props.initialFilter,
            dashboards: [],
            selectedItem: null,
            page: 0,
            perPage: 20,
        };
    }

    componentWillMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.debouncedFetch.cancel();
    }

    componentDidMount() {
        this.fetchItems();
    }

    debouncedFetch = _.debounce(async (filter) => {
        const response = await this.props.find(filter);

        if (!this._isMounted) {
            return;
        }

        // We need this check to handle the case where search results come back in a different
        // order than they were sent out. Only load results for the most recent search.
        if (filter === this.state.filter) {
            this.setState({
                hasInitialFetchReturned: true,
                isFetchingItems: false,
                dashboards: response.hits,
                totalDashboards: response.total,
                showLimitError: response.total > this.props.listingLimit,
            });
        }
    }, 300);

    fetchItems = () => {
        this.setState({
            isFetchingItems: true,
        }, this.debouncedFetch.bind(null, this.state.filter));
    }

    deleteSelectedItems = async () => {
        try {
            await this.props.delete([this.state.selectedItem.id]);
        } catch (error) {
            toastNotifications.addDanger({
                title: `Unable to delete dashboard(s)`,
                text: `${error}`,
            });
        }
        this.fetchItems();
        this.setState({ selectedItem: null });
        this.closeDeleteModal();
    }

    closeDeleteModal = () => {
        this.setState({ showDeleteModal: false });
    };

    openDeleteModal = () => {
        this.setState({ showDeleteModal: true });
    };

    closeShareModal = () => {
        this.setState({ showShareModal: false });
    };

    openShareModal = () => {
        this.setState({ showShareModal: true });
    };

    onTableChange = ({ page, sort = {} }) => {
        const {
            index: pageIndex,
            size: pageSize,
        } = page;

        let {
            field: sortField,
            direction: sortDirection,
        } = sort;

        // 3rd sorting state that is not captured by sort - native order (no sort)
        // when switching from desc to asc for the same field - use native order
        if (this.state.sortField === sortField
            && this.state.sortDirection === 'desc'
            && sortDirection === 'asc') {
            sortField = null;
            sortDirection = null;
        }

        this.setState({
            page: pageIndex,
            perPage: pageSize,
            sortField,
            sortDirection,
        });
    }

    // server-side paging not supported - see component comment for details
    getPageOfItems = () => {
        // do not sort original list to preserve elasticsearch ranking order
        const dashboardsCopy = this.state.dashboards.slice();

        if (this.state.sortField) {
            dashboardsCopy.sort((a, b) => {
                const fieldA = _.get(a, this.state.sortField, '');
                const fieldB = _.get(b, this.state.sortField, '');
                let order = 1;
                if (this.state.sortDirection === 'desc') {
                    order = -1;
                }
                return order * fieldA.toLowerCase().localeCompare(fieldB.toLowerCase());
            });
        }

        // If begin is greater than the length of the sequence, an empty array is returned.
        const startIndex = this.state.page * this.state.perPage;
        // If end is greater than the length of the sequence, slice extracts through to the end of the sequence (arr.length).
        const lastIndex = startIndex + this.state.perPage;
        return dashboardsCopy.slice(startIndex, lastIndex);
    }

    hasNoDashboards() {
        return !this.state.isFetchingItems && this.state.dashboards.length === 0 && !this.state.filter;
    }

    renderConfirmDeleteModal() {
        return (
            <EuiOverlayMask>
                <EuiConfirmModal
                    title={`Are you sure want to delete ${this.state.selectedItem ? this.state.selectedItem.title : 'selected dashboard'}?`}
                    onCancel={this.closeDeleteModal}
                    onConfirm={this.deleteSelectedItems}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete"
                    defaultFocusedButton="cancel"
                >
                    <p>{`You can't recover deleted dashboards.`}</p>
                </EuiConfirmModal>
            </EuiOverlayMask>
        );
    }

    renderShareModal() {
        return (
            <ShareDashboardModal {...this.props} dashboard={this.state.selectedItem} onClose={this.closeShareModal}/>
        );
    }

    renderListingLimitWarning() {
        if (this.state.showLimitError) {
            return (
                <React.Fragment>
                    <EuiCallOut
                        title="Listing limit exceeded"
                        color="warning"
                        iconType="help"
                    >
                        <p>
                            You have {this.state.totalDashboards} dashboards,
                            but your <strong>listingLimit</strong> setting prevents the table below from displaying more than {this.props.listingLimit}.
                            You can change this setting under <EuiLink href="#/management/kibana/settings">Advanced Settings</EuiLink>.
                        </p>
                    </EuiCallOut>
                    <EuiSpacer size="m" />
                </React.Fragment>
            );
        }
    }

    renderNoResultsMessage() {
        if (this.state.isFetchingItems) {
            return '';
        }

        return 'No dashboards matched your search.';
    }

    renderNoItemsMessage() {

        if (this.props.hideWriteControls) {
            return (
                <EuiText>
                    <h2>
                        <EuiTextColor color="subdued">
                            {`Looks like you don't have any dashboards.`}
                        </EuiTextColor>
                    </h2>
                </EuiText>
            );
        }

        return (
            <div>
                <EuiEmptyPrompt
                    iconType="dashboardApp"
                    title={<h2>Create your first dashboard</h2>}
                    body={
                        <Fragment>
                            <p>
                                You can combine data views from any Kibana app into one dashboard and see everything in one place.
                            </p>
                        </Fragment>
                    }
                    actions={
                        <EuiButton
                            href={`#${DashboardConstants.CREATE_NEW_DASHBOARD_URL}`}
                            fill
                            iconType="plusInCircle"
                            data-test-subj="createDashboardPromptButton">
                            Create new dashboard
                        </EuiButton>
                    }
                />
            </div>
        );
    }

    renderSearchBar() {
        return (
            <EuiFlexGroup>
                <EuiFlexItem grow={true}>
                    <EuiFieldSearch
                        aria-label="Filter dashboards"
                        placeholder="Search..."
                        fullWidth
                        value={this.state.filter}
                        onChange={(e) => {
                            this.setState({
                                filter: e.target.value
                            }, this.fetchItems);
                        }}
                        data-test-subj="searchFilter"
                    />
                </EuiFlexItem>
            </EuiFlexGroup>
        );
    }

    renderTable() {
        const tableColumns = [
            {
                field: 'title',
                name: 'Title',
                sortable: true,
                render: (field, record) => (
                    <EuiLink
                        className="dashboardLink"
                        href={`#${createDashboardEditUrl(record.id)}`}
                        data-test-subj={`dashboardListingTitleLink-${record.title.split(' ').join('-')}`}
                    >
                        {field}
                    </EuiLink>
                )
            },
            {
                field: 'description',
                name: 'Description',
                dataType: 'string',
                sortable: true,
            },
            {
                field: 'owner',
                name: 'Created by',
                dataType: 'string',
                sortable: true,
            }
        ];

        const principal = this.props.principal;
        const onlyWhenUserCanManage = (record) => {
            return principal.scope.includes('manage-kibana') ||
                (principal.scope.includes('manage-dashboards') &&
                record.permissions.includes('manage'))
        };

        const deleteItem = (record) => {
            this.setState({ selectedItem: record });
            this.openDeleteModal();
        };

        const shareItem = (record) => {
            this.setState({ selectedItem: record });
            this.openShareModal();
        };

        if (!this.props.hideWriteControls) {
            const editAction = {
                enabled: onlyWhenUserCanManage,
                render: (item) => (
                    <EuiLink href={`#${createDashboardEditUrl(item.id)}?_a=(viewMode:edit)`}><EuiIcon type="pencil" /> Edit</EuiLink>
                )
            };
            const shareAction = {
                enabled: onlyWhenUserCanManage,
                render: (item) => (
                    <EuiLink onClick={() => shareItem(item)}><EuiIcon type="share" /> Share</EuiLink>
                )
            };
            const deleteAction = {
                enabled: onlyWhenUserCanManage,
                render: (item) => (
                    <EuiLink onClick={() => deleteItem(item)}><EuiIcon type="trash" /> Delete</EuiLink>
                )
            };
            tableColumns.push({
                name: 'Actions',
                actions: [editAction, shareAction, deleteAction]
            });
        }
        const pagination = {
            pageIndex: this.state.page,
            pageSize: this.state.perPage,
            totalItemCount: this.state.dashboards.length,
            pageSizeOptions: [10, 20, 50],
        };

        const sorting = {};
        if (this.state.sortField) {
            sorting.sort = {
                field: this.state.sortField,
                direction: this.state.sortDirection,
            };
        }
        const items = this.state.dashboards.length === 0 ? [] : this.getPageOfItems();

        return (
            <EuiBasicTable
                itemId={'id'}
                items={items}
                loading={this.state.isFetchingItems}
                columns={tableColumns}
                noItemsMessage={this.renderNoResultsMessage()}
                pagination={pagination}
                sorting={sorting}
                onChange={this.onTableChange}
            />
        );
    }

    renderListingOrEmptyState() {
        if (this.hasNoDashboards()) {
            return this.renderNoItemsMessage();
        }

        return this.renderListing();
    }

    renderListing() {
        let createButton;
        if (!this.props.hideWriteControls) {
            createButton = (
                <EuiFlexItem grow={false}>
                    <EuiButton
                        href={`#${DashboardConstants.CREATE_NEW_DASHBOARD_URL}`}
                        data-test-subj="newDashboardLink"
                    >
                        Create new dashboard
                    </EuiButton>
                </EuiFlexItem>
            );
        }
        return (
            <div>
                {this.state.showDeleteModal && this.renderConfirmDeleteModal()}
                {this.state.showShareModal && this.renderShareModal()}
                <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexEnd" data-test-subj="top-nav">
                    <EuiFlexItem grow={false}>
                        <EuiTitle size="l">
                            <h1>
                                Dashboards
                            </h1>
                        </EuiTitle>
                    </EuiFlexItem>
                    {createButton}
                </EuiFlexGroup>
                <EuiSpacer size="m" />
                {this.renderListingLimitWarning()}
                {this.renderSearchBar()}
                <EuiSpacer size="m" />
                {this.renderTable()}
            </div>
        );
    }

    renderPageContent() {
        if (!this.state.hasInitialFetchReturned) {
            return;
        }

        return (
            <EuiPageContent className="dashboardLandingPageContent" horizontalPosition="center">
                {this.renderListingOrEmptyState()}
            </EuiPageContent>
        );
    }

    render() {
        return (
            <EuiPage data-test-subj="dashboardLandingPage" className="dashboardLandingPage" restrictWidth>
                <EuiPageBody>
                    {this.renderPageContent()}
                </EuiPageBody>
            </EuiPage>
        );
    }
}

DashboardListing.propTypes = {
    find: PropTypes.func.isRequired,
    delete: PropTypes.func.isRequired,
    listingLimit: PropTypes.number.isRequired,
    hideWriteControls: PropTypes.bool.isRequired,
    initialFilter: PropTypes.string,

    /* ADDED */
    principal: PropTypes.object,
    getPermissions: PropTypes.func.isRequired,
    addPermission: PropTypes.func.isRequired,
    addPermissionForAll: PropTypes.func.isRequired,
    revokePermission: PropTypes.func.isRequired,
    revokePermissionForAll: PropTypes.func.isRequired,
};

DashboardListing.defaultProps = {
    initialFilter: EMPTY_FILTER,
};
