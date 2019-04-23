/*
 * The dashboard listening component enriched with dashboard ownership feature.
 * Original source: https://github.com/elastic/kibana/blob/7.0/src/legacy/core_plugins/kibana/public/dashboard/listing/dashboard_listing.js
 */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectI18n } from '@kbn/i18n/react';
import _ from 'lodash';
import { toastNotifications } from 'ui/notify';
import {
  EuiBasicTable,
  EuiButton,
  EuiCallOut,
  EuiConfirmModal,
  EuiEmptyPrompt,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiOverlayMask,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiTitle
} from '@elastic/eui';
import { ShareDashboardModal } from './ShareDashboardModal';
import Permissions from '../constants/Permissions';
import Roles from '../constants/Roles';
import DashboardTags from './DashboardTags';


// import { DashboardConstants, createDashboardEditUrl } from '../dashboard_constants';
// Copy of: https://github.com/elastic/kibana/blob/7.0/src/legacy/core_plugins/kibana/public/dashboard/dashboard_constants.ts
export const DashboardConstants = {
  ADD_VISUALIZATION_TO_DASHBOARD_MODE_PARAM: 'addToDashboard',
  NEW_VISUALIZATION_ID_PARAM: 'addVisualization',
  LANDING_PAGE_PATH: '/dashboards',
  CREATE_NEW_DASHBOARD_URL: '/dashboard',
};

export function createDashboardEditUrl(id) {
  return `/dashboard/${id}`;
}
// End copy

export const EMPTY_FILTER = '';

// saved object client does not support sorting by title because title is only mapped as analyzed
// the legacy implementation got around this by pulling `listingLimit` items and doing client side sorting
// and not supporting server-side paging.
// This component does not try to tackle these problems (yet) and is just feature matching the legacy component
// TODO support server side sorting/paging once title and description are sortable on the server.
class DashboardListingUi extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      ...defaultSortOrder(this.props.initialFilter),
      hasInitialFetchReturned: false,
      isFetchingItems: false,
      showDeleteModal: false,
      showLimitError: false,
      filter: this.props.initialFilter,
      dashboards: [],
      selectedIds: [],
      showShareModal: false,
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
  };

  deleteSelectedItems = async () => {
    try {
      await this.props.delete(this.state.selectedIds);
    } catch (error) {
      toastNotifications.addDanger({
        title: (
          <FormattedMessage
            id="keycloak.dashboard.listing.unableToDeleteDashboardsDangerMessage"
            defaultMessage="Unable to delete dashboard(s)"
          />
        ),
        text: `${error}`,
      });
    }
    this.fetchItems();
    this.setState({
      selectedIds: []
    });
    this.closeDeleteModal();
  };

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
  setFilter(filter) {
    // If the user is searching, we want to clear the sort order so that
    // results are ordered by Elasticsearch's relevance.
    this.setState({
      ...defaultSortOrder(filter),
      filter,
    }, this.fetchItems);
  }

  onTableChange = ({ page, sort = {} }) => {
    const {
      index: pageIndex,
      size: pageSize,
    } = page;

    let {
      field: sortField,
      direction: sortDirection,
    } = sort;

    // 3rd sorting state that is not captured by sort - default order (asc by title)
    // when switching from desc to asc for the same, non-default field - use default order,
    // unless we have a filter, in which case, we want to use Elasticsearch's ranking order.
    if (this.state.sortField === sortField
        && this.state.sortDirection === 'desc'
        && sortDirection === 'asc') {

      const defaultSort = defaultSortOrder(this.state.filter);

      sortField = defaultSort.sortField;
      sortDirection = defaultSort.sortDirection;
    }

    this.setState({
      page: pageIndex,
      perPage: pageSize,
      sortField,
      sortDirection,
    });
  };

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
  };

  hasNoDashboards() {
    return !this.state.isFetchingItems && this.state.dashboards.length === 0 && !this.state.filter;
  }

  toggleDashboardTag = (dashboardId, tag, active) => {
    const { intl } = this.props;
    this.props.toggleDashboardTag(dashboardId, tag, active)
      .then(() => {
        const updatedDashboards = this.state.dashboards.map(dashboard => {
          if (dashboard.id === dashboardId) {
            if (active) {
              dashboard.tags.push(tag);
            } else {
              _.remove(dashboard.tags, t => t === tag);
            }
          } else if (tag === 'home') {
            _.remove(dashboard.tags, t => t === tag);
          }
          return dashboard;
        });
        this.setState({
          dashboards: updatedDashboards
        });
        if (active) {
          toastNotifications.addSuccess(intl.formatMessage({
            id: 'keycloak.dashboard.listing.dashboardTaggedSuccessfully',
            defaultMessage: 'Dashboard was successfully tagged as { tag }'
          }, { tag }));
        } else {
          toastNotifications.addSuccess(intl.formatMessage({
            id: 'keycloak.dashboard.listing.dashboardUntaggedSuccessfully',
            defaultMessage: 'Dashboard was successfully untagged as { tag }'
          }, { tag }));
        }
      })
      .catch(error => {
        if (active) {
          toastNotifications.addSuccess({
            title: intl.formatMessage({
              id: 'keycloak.dashboard.listing.dashboardTaggingError',
              defaultMessage: 'Unable to tag dashboard'
            }),
            text: `${error.message}` });
        } else {
          toastNotifications.addSuccess({
            title: intl.formatMessage({
              id: 'keycloak.dashboard.listing.dashboardUntaggingError',
              defaultMessage: 'Unable to untag dashboard'
            }),
            text: `${error.message}` });
        }
      });
  };

  renderShareModal() {
    return (
      <ShareDashboardModal {...this.props} dashboard={this.state.selectedItem} onClose={this.closeShareModal}/>
    );
  }

  renderConfirmDeleteModal() {
    return (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={
            <FormattedMessage
              id="keycloak.dashboard.listing.deleteSelectedDashboardsConfirmModal.title"
              defaultMessage="Delete selected dashboards?"
            />
          }
          onCancel={this.closeDeleteModal}
          onConfirm={this.deleteSelectedItems}
          cancelButtonText={
            <FormattedMessage
              id="keycloak.dashboard.listing.deleteSelectedDashboardsConfirmModal.cancelButtonLabel"
              defaultMessage="Cancel"
            />
          }
          confirmButtonText={
            <FormattedMessage
              id="keycloak.dashboard.listing.deleteSelectedDashboardsConfirmModal.confirmButtonLabel"
              defaultMessage="Delete"
            />
          }
          defaultFocusedButton="cancel"
        >
          <p>
            <FormattedMessage
              id="keycloak.dashboard.listing.deleteDashboardsConfirmModalDescription"
              defaultMessage="You can't recover deleted dashboards."
            />
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  renderListingLimitWarning() {
    if (this.state.showLimitError) {
      return (
        <React.Fragment>
          <EuiCallOut
            title={
              <FormattedMessage
                id="keycloak.dashboard.listing.listingLimitExceededTitle"
                defaultMessage="Listing limit exceeded"
              />
            }
            color="warning"
            iconType="help"
          >
            <p>
              <FormattedMessage
                id="keycloak.dashboard.listing.listingLimitExceededDescription"
                defaultMessage="You have {totalDashboards} dashboards, but your {listingLimitText} setting prevents
                the table below from displaying more than {listingLimitValue}. You can change this setting under {advancedSettingsLink}."
                values={{
                  totalDashboards: this.state.totalDashboards,
                  listingLimitValue: this.props.listingLimit,
                  listingLimitText: (
                    <strong>
                            listingLimit
                    </strong>
                  ),
                  advancedSettingsLink: (
                    <EuiLink href="#/management/kibana/settings">
                      <FormattedMessage
                        id="keycloak.dashboard.listing.listingLimitExceeded.advancedSettingsLinkText"
                        defaultMessage="Advanced Settings"
                      />
                    </EuiLink>
                  )
                }}
              />
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

    return (
      <FormattedMessage
        id="keycloak.dashboard.listing.noMatchedDashboardsMessage"
        defaultMessage="No dashboards matched your search."
      />
    );
  }

  renderNoItemsMessage() {

    if (this.props.hideWriteControls) {
      return (
        <EuiText>
          <h2>
            <EuiTextColor color="subdued">
              <FormattedMessage
                id="keycloak.dashboard.listing.noDashboardsItemsMessage"
                defaultMessage="Looks like you don't have any dashboards."
              />
            </EuiTextColor>
          </h2>
        </EuiText>
      );
    }

    return (
      <div>
        <EuiEmptyPrompt
          iconType="dashboardApp"
          title={
            <h2>
              <FormattedMessage
                id="keycloak.dashboard.listing.createNewDashboard.title"
                defaultMessage="Create your first dashboard"
              />
            </h2>
          }
          body={
            <Fragment>
              <p>
                <FormattedMessage
                  id="keycloak.dashboard.listing.createNewDashboard.combineDataViewFromKibanaAppDescription"
                  defaultMessage="You can combine data views from any Kibana app into one dashboard and see everything in one place."
                />
              </p>
              <p>
                <FormattedMessage
                  id="keycloak.dashboard.listing.createNewDashboard.newToKibanaDescription"
                  defaultMessage="New to Kibana? {sampleDataInstallLink} to take a test drive."
                  values={{
                    sampleDataInstallLink: (
                      <EuiLink href="#/home/tutorial_directory/sampleData">
                        <FormattedMessage
                          id="keycloak.dashboard.listing.createNewDashboard.sampleDataInstallLinkText"
                          defaultMessage="Install some sample data"
                        />
                      </EuiLink>
                    ),
                  }}
                />
              </p>
            </Fragment>
          }
          actions={
            <EuiButton
              href={`#${DashboardConstants.CREATE_NEW_DASHBOARD_URL}`}
              fill
              iconType="plusInCircle"
              data-test-subj="createDashboardPromptButton"
            >
              <FormattedMessage
                id="keycloak.dashboard.listing.createNewDashboard.createButtonLabel"
                defaultMessage="Create new dashboard"
              />
            </EuiButton>
          }
        />
      </div>
    );

  }

  renderSearchBar() {
    const { intl } = this.props;
    let deleteBtn;
    if (this.state.selectedIds.length > 0) {
      deleteBtn = (
        <EuiFlexItem grow={false}>
          <EuiButton
            color="danger"
            onClick={this.openDeleteModal}
            data-test-subj="deleteSelectedDashboards"
            key="delete"
          >
            <FormattedMessage
              id="keycloak.dashboard.listing.searchBar.deleteSelectedButtonLabel"
              defaultMessage="Delete selected"
            />
          </EuiButton>
        </EuiFlexItem>
      );
    }

    return (
      <EuiFlexGroup>
        {deleteBtn}
        <EuiFlexItem grow={true}>
          <EuiFieldSearch
            aria-label={intl.formatMessage({
              id: 'keycloak.dashboard.listing.searchBar.searchFieldAriaLabel',
              defaultMessage: 'Filter dashboards',
              description: '"Filter" is used as a verb here, similar to "search through dashboards".',
            })}
            placeholder={intl.formatMessage({
              id: 'keycloak.dashboard.listing.searchBar.searchFieldPlaceholder',
              defaultMessage: 'Search…',
            })}
            fullWidth
            value={this.state.filter}
            onChange={(e) => this.setFilter(e.target.value)}
            data-test-subj="searchFilter"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  renderTable() {
    const { intl } = this.props;
    const tableColumns = [
      {
        field: 'title',
        name: intl.formatMessage({
          id: 'keycloak.dashboard.listing.table.titleColumnName',
          defaultMessage: 'Title',
        }),
        sortable: true,
        render: (field, record) => (
          <EuiLink
            href={`#${createDashboardEditUrl(record.id)}`}
            data-test-subj={`dashboardListingTitleLink-${record.title.split(' ').join('-')}`}
          >
            {field}
          </EuiLink>
        )
      },
      {
        field: 'description',
        name: intl.formatMessage({
          id: 'keycloak.dashboard.listing.table.descriptionColumnName',
          defaultMessage: 'Description',
        }),
        dataType: 'string',
        sortable: true,
      }
    ];

    const principal = this.props.principal;
    const onlyWhenUserCan = (permissions) => (record) => {
      return principal.scope.includes(Roles.MANAGE_KIBANA) || // TODO: put this logic to backend
          (principal.scope.includes(Roles.MANAGE_DASHBOARDS) &&
              _.some(permissions, permission => record.permissions.includes(permission)));
    };

    const deleteItem = (record) => {
      this.setState({ selectedItem: record });
      this.openDeleteModal();
    };

    const shareItem = (record) => {
      this.setState({ selectedItem: record });
      this.openShareModal();
    };

    if (this.props.isFeatureEnabled('tagging')) {
      tableColumns.push({
        field: 'markers',
        name: intl.formatMessage({
          id: 'keycloak.dashboard.listing.table.markersColumnName',
          defaultMessage: 'Markers',
        }),
        width: '65px',
        align: 'right',
        render: (field, dashboard) => {
          return (<DashboardTags dashboard={dashboard} toggleDashboardTag={this.toggleDashboardTag}/>);
        }
      });
    }

    if (!this.props.hideWriteControls) {
      const actions = [];

      actions.push({
        name: intl.formatMessage({
          id: 'keycloak.dashboard.listing.table.actionsColumn.editLinkText',
          defaultMessage: 'Edit',
        }),
        icon: 'pencil',
        enabled: onlyWhenUserCan([Permissions.EDIT, Permissions.MANAGE]),
        onClick: (item) => {
          window.location.href = `#${createDashboardEditUrl(item.id)}?_a=(viewMode:edit)`;
        }
      });

      // TODO: use i18n feature like above
      if (this.props.isFeatureEnabled('tagging')) {
        actions.push({
          name: intl.formatMessage({
            id: 'keycloak.dashboard.listing.table.actionsColumn.pinAsHomepageLinkText',
            defaultMessage: 'Pin as homepage',
          }),
          icon: 'pin',
          enabled: (item) => !item.tags.includes('home'),
          onClick: (item) => {
            this.toggleDashboardTag(item.id, 'home', true);
          }
        });
      }
      if (this.props.isFeatureEnabled('acl')) {
        actions.push({
          name: intl.formatMessage({
            id: 'keycloak.dashboard.listing.table.actionsColumn.shareLinkText',
            defaultMessage: 'Share',
          }),
          icon: 'share',
          enabled: onlyWhenUserCan([Permissions.MANAGE]),
          onClick: shareItem
        });
      }
      actions.push({
        name: intl.formatMessage({
          id: 'keycloak.dashboard.listing.table.actionsColumn.deleteLinkText',
          defaultMessage: 'Delete',
        }),
        icon: 'trash',
        enabled: onlyWhenUserCan([Permissions.MANAGE]),
        onClick: deleteItem
      });

      tableColumns.push({
        field: 'actions',
        name: intl.formatMessage({
          id: 'keycloak.dashboard.listing.table.actionsColumnName',
          defaultMessage: 'Actions',
        }),
        width: '65px',
        actions
      });
    }
    const pagination = {
      pageIndex: this.state.page,
      pageSize: this.state.perPage,
      totalItemCount: this.state.dashboards.length,
      pageSizeOptions: [10, 20, 50],
    };
    const selection = {
      onSelectionChange: (selection) => {
        this.setState({
          selectedIds: selection.map(item => { return item.id; })
        });
      }
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
        selection={selection}
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
            fill
          >
            <FormattedMessage
              id="keycloak.dashboard.listing.createNewDashboardButtonLabel"
              defaultMessage="Create new dashboard"
            />
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
                <FormattedMessage
                  id="keycloak.dashboard.listing.dashboardsTitle"
                  defaultMessage="Dashboards"
                />
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
      <EuiPageContent horizontalPosition="center">
        {this.renderListingOrEmptyState()}
      </EuiPageContent>
    );
  }

  render() {
    return (
      <EuiPage data-test-subj="dashboardLandingPage" className="dshDashboardListing__page" restrictWidth>
        <EuiPageBody>
          {this.renderPageContent()}
        </EuiPageBody>
      </EuiPage>
    );
  }
}

DashboardListingUi.propTypes = {
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
  toggleDashboardTag: PropTypes.func.isRequired,
  isFeatureEnabled: PropTypes.func.isRequired
};

DashboardListingUi.defaultProps = {
  initialFilter: EMPTY_FILTER,
};

export const DashboardListing = injectI18n(DashboardListingUi);

// The table supports three sort states:
// field-asc, field-desc, and default.
//
// If you click a non-default sort header three times,
// the sort returns to the default sort, described here.
function defaultSortOrder(filter) {
  // If the user has searched for something, we want our
  // default sort to be by Elasticsearch's relevance, so
  // we clear out our overriding sort options.
  if (filter.length > 0) {
    return { sortField: undefined, sortDirection: undefined };
  }

  return {
    sortField: 'title',
    sortDirection: 'asc',
  };
}
