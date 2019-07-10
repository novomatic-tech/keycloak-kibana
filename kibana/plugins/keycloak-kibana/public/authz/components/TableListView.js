/*
 * The table list view component enriched with dashboard ownership feature.
 * Original source: https://github.com/elastic/kibana/blob/7.2/src/legacy/core_plugins/kibana/public/table_list_view/table_list_view.js
 * Only admin can select & delete multiple dashboards.
 */
/* eslint-disable import/no-unresolved */

import React from 'react';
import PropTypes from 'prop-types';
import { injectI18n, FormattedMessage } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';
import _ from 'lodash';
import { toastNotifications } from 'ui/notify';
import {
  EuiTitle,
  EuiInMemoryTable,
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
} from '@elastic/eui';
import { ShareDashboardModal } from './ShareDashboardModal';
import Permissions from '../constants/Permissions';
import Roles from '../constants/Roles';
import DashboardTags from './DashboardTags';

export const EMPTY_FILTER = '';
const PAGE_SIZE_OPTIONS = [10, 20, 50];

// saved object client does not support sorting by title because title is only mapped as analyzed
// the legacy implementation got around this by pulling `listingLimit` items and doing client side sorting
// and not supporting server-side paging.
// This component does not try to tackle these problems (yet) and is just feature matching the legacy component
// TODO support server side sorting/paging once title and description are sortable on the server.
class TableListViewUi extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      items: [],
      totalItems: 0,
      hasInitialFetchReturned: false,
      isFetchingItems: false,
      isDeletingItems: false,
      showDeleteModal: false,
      showLimitError: false,
      filter: this.props.initialFilter,
      selectedIds: [],
      page: 0,
      perPage: 20,
      showShareModal: false
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
    const response = await this.props.findItems(filter);

    if (!this._isMounted) {
      return;
    }

    // We need this check to handle the case where search results come back in a different
    // order than they were sent out. Only load results for the most recent search.
    // Also, in case filter is empty, items are being pre-sorted alphabetically.
    if (filter === this.state.filter) {
      this.setState({
        hasInitialFetchReturned: true,
        isFetchingItems: false,
        items: (!filter ? _.sortBy(response.hits, 'title') : response.hits),
        totalItems: response.total,
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
    if (this.state.isDeletingItems) {
      return;
    }
    this.setState({
      isDeletingItems: true
    });
    try {
      await this.props.deleteItems(this.getSelectedItems());
    } catch (error) {
      toastNotifications.addDanger({
        title: (
          <FormattedMessage
            id="kbn.table_list_view.listing.unableToDeleteDangerMessage"
            defaultMessage="Unable to delete {entityName}(s)"
            values={{ entityName: this.props.entityName }}
          />
        ),
        text: `${error}`,
      });
    }
    this.fetchItems();
    this.setState({
      isDeletingItems: false,
      selectedIds: []
    });
    this.closeDeleteModal();
  }

  closeDeleteModal = () => {
    this.setState({ showDeleteModal: false, selectedItem: null });
  }

  openDeleteModal = () => {
    this.setState({ showDeleteModal: true });
  }

  setFilter(filter) {
    // If the user is searching, we want to clear the sort order so that
    // results are ordered by Elasticsearch's relevance.
    this.setState({
      filter: filter.queryText,
    }, this.fetchItems);
  }

  hasNoItems() {
    if (!this.state.isFetchingItems && this.state.items.length === 0 && !this.state.filter) {
      return true;
    }

    return false;
  }

  getSelectedItems() {
    return this.state.selectedItem && [this.state.selectedItem.id] || this.state.selectedIds;
  }

  renderConfirmDeleteModal() {
    const selection = this.getSelectedItems();

    let deleteButton = (
      <FormattedMessage
        id="kbn.table_list_view.listing.deleteSelectedItemsConfirmModal.confirmButtonLabel"
        defaultMessage="Delete"
      />
    );
    if (this.state.isDeletingItems) {
      deleteButton = (
        <FormattedMessage
          id="kbn.table_list_view.listing.deleteSelectedItemsConfirmModal.confirmButtonLabelDeleting"
          defaultMessage="Deleting"
        />
      );
    }

    return (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={
            <FormattedMessage
              id="kbn.table_list_view.listing.deleteSelectedConfirmModal.title"
              defaultMessage="Delete {itemCount} selected {entityName}?"
              values={{
                itemCount: selection.length,
                entityName: (selection.length === 1) ? this.props.entityName : this.props.entityNamePlural
              }}
            />
          }
          buttonColor="danger"
          onCancel={this.closeDeleteModal}
          onConfirm={this.deleteSelectedItems}
          cancelButtonText={
            <FormattedMessage
              id="kbn.table_list_view.listing.deleteSelectedItemsConfirmModal.cancelButtonLabel"
              defaultMessage="Cancel"
            />
          }
          confirmButtonText={deleteButton}
          defaultFocusedButton="cancel"
        >
          <p>
            <FormattedMessage
              id="kbn.table_list_view.listing.deleteConfirmModalDescription"
              defaultMessage="You can't recover deleted {entityNamePlural}."
              values={{ entityNamePlural: this.props.entityNamePlural }}
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
                id="kbn.table_list_view.listing.listingLimitExceededTitle"
                defaultMessage="Listing limit exceeded"
              />
            }
            color="warning"
            iconType="help"
          >
            <p>
              <FormattedMessage
                id="kbn.table_list_view.listing.listingLimitExceededDescription"
                defaultMessage="You have {totalItems} {entityNamePlural}, but your {listingLimitText} setting prevents
                the table below from displaying more than {listingLimitValue}. You can change this setting under {advancedSettingsLink}."
                values={{
                  entityNamePlural: this.props.entityNamePlural,
                  totalItems: this.state.totalItems,
                  listingLimitValue: this.props.listingLimit,
                  listingLimitText: (
                    <strong>
                      listingLimit
                    </strong>
                  ),
                  advancedSettingsLink: (
                    <EuiLink href="#/management/kibana/settings">
                      <FormattedMessage
                        id="kbn.table_list_view.listing.listingLimitExceeded.advancedSettingsLinkText"
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

  renderNoItemsMessage() {
    if (this.props.noItemsFragment) {
      return (
        this.props.noItemsFragment
      );
    } else {
      return (
        <FormattedMessage
          id="kbn.table_list_view.listing.noAvailableItemsMessage"
          defaultMessage="No {entityNamePlural} available."
          values={{ entityNamePlural: this.props.entityNamePlural }}
        />
      );

    }
  }

  renderToolsLeft() {
    const selection = this.state.selectedIds;

    if (selection.length === 0) {
      return;
    }

    const onClick = () => {
      this.openDeleteModal();
    };

    return (
      <EuiButton
        color="danger"
        iconType="trash"
        onClick={onClick}
        data-test-subj="deleteSelectedItems"
      >
        <FormattedMessage
          id="kbn.table_list_view.listing.deleteButtonMessage"
          defaultMessage="Delete {itemCount} {entityName}"
          values={{
            itemCount: selection.length,
            entityName: (selection.length === 1) ? this.props.entityName : this.props.entityNamePlural
          }}
        />
      </EuiButton>
    );
  }

  closeShareModal = () => {
    this.setState({ showShareModal: false, selectedItem: null });
  };

  openShareModal = () => {
    this.setState({ showShareModal: true });
  };

  toggleDashboardTag = (itemId, tag, active) => {
    this.props.ownership.toggleDashboardTag(itemId, tag, active)
      .then(() => {
        const updatedItems = this.state.items.map(item => {
          if (item.id === itemId) {
            if (active) {
              item.tags.push(tag);
            } else {
              _.remove(item.tags, t => t === tag);
            }
          } else if (tag === 'home') {
            _.remove(item.tags, t => t === tag);
          }
          return item;
        });
        this.setState({
          items: updatedItems
        });
        if (active) {
          toastNotifications.addSuccess(i18n.translate('keycloak.dashboard.listing.dashboardTaggedSuccessfully', {
            defaultMessage: 'Dashboard was successfully tagged as { tag }',
            values: { tag }
          }));
        } else {
          toastNotifications.addSuccess(i18n.translate('keycloak.dashboard.listing.dashboardUntaggedSuccessfully', {
            defaultMessage: 'Dashboard was successfully untagged as { tag }',
            values: { tag }
          }));
        }
      })
      .catch(error => {
        if (active) {
          toastNotifications.addSuccess({
            title: i18n.translate('keycloak.dashboard.listing.dashboardTaggingError', {
              defaultMessage: 'Unable to tag dashboard'
            }),
            text: `${error.message}` });
        } else {
          toastNotifications.addSuccess({
            title: i18n.translate('keycloak.dashboard.listing.dashboardUntaggingError', {
              defaultMessage: 'Unable to untag dashboard'
            }),
            text: `${error.message}` });
        }
      });
  };

  renderShareModal() {
    return (
      <ShareDashboardModal {...this.props.ownership} dashboard={this.state.selectedItem} onClose={this.closeShareModal}/>
    );
  }

  onlyWhenUserCan = (permissions) => (record) => {
    const { principal } = this.props.ownership;
    return principal.isAdmin() || // TODO: put this logic to backend
      (principal.hasRole(Roles.MANAGE_DASHBOARDS) &&
        _.some(permissions, permission => record.permissions.includes(permission)));
  };

  shareItem = (record) => {
    this.setState({ selectedItem: record });
    this.openShareModal();
  };

  deleteItem = (record) => {
    this.setState({ selectedItem: record });
    this.openDeleteModal();
  };

  renderTable() {
    const { principal } = this.props.ownership;
    const pagination = {
      pageIndex: this.state.page,
      pageSize: this.state.perPage,
      totalItemCount: this.state.items.length,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    };

    const selection = this.props.deleteItems && principal.isAdmin() ? {
      onSelectionChange: (selection) => {
        this.setState({
          selectedIds: selection.map(item => { return item.id; })
        });
      }
    } : null;

    const actions = [{
      name: i18n.translate('kbn.table_list_view.listing.table.editActionName', {
        defaultMessage: 'Edit'
      }),
      description: i18n.translate('kbn.table_list_view.listing.table.editActionDescription', {
        defaultMessage: 'Edit'
      }),
      icon: 'pencil',
      enabled: this.onlyWhenUserCan([Permissions.EDIT, Permissions.MANAGE]),
      type: 'icon',
      onClick: this.props.editItem
    }];

    const search = {
      onChange: this.setFilter.bind(this),
      toolsLeft: principal.isAdmin() ? this.renderToolsLeft() : null,
      defaultQuery: this.state.filter,
      box: {
        incremental: true,
      },
    };

    const columns = this.props.tableColumns.slice();

    if (this.props.ownership.isFeatureEnabled('tagging')) {
      columns.push({
        field: 'markers',
        name: i18n.translate('keycloak.dashboard.listing.table.markersTitle', {
          defaultMessage: 'Markers',
        }),
        width: '65px',
        align: 'right',
        render: (field, item) => {
          return (<DashboardTags dashboard={item} toggleDashboardTag={this.toggleDashboardTag}/>);
        }
      });
      actions.push({
        name: i18n.translate('keycloak.dashboard.listing.table.pinAsHomepageActionName', {
          defaultMessage: 'Pin as homepage',
        }),
        description: i18n.translate('keycloak.dashboard.listing.table.pinAsHomepageActionDescription', {
          defaultMessage: 'Pin dashboard as homepage',
        }),
        icon: 'pin',
        type: 'icon',
        enabled: (item) => !item.tags.includes('home'),
        onClick: (item) => {
          this.toggleDashboardTag(item.id, 'home', true);
        }
      });
    }

    if (this.props.ownership.isFeatureEnabled('acl')) {
      actions.push({
        name: i18n.translate('keycloak.dashboard.listing.table.shareActionName', {
          defaultMessage: 'Share',
        }),
        description: i18n.translate('keycloak.dashboard.listing.table.shareActionDescription', {
          defaultMessage: 'Share dashboard',
        }),
        icon: 'share',
        type: 'icon',
        enabled: this.onlyWhenUserCan([Permissions.MANAGE]),
        onClick: this.shareItem
      });
    }
    actions.push({
      name: i18n.translate('keycloak.dashboard.listing.table.deleteActionName', {
        defaultMessage: 'Delete',
      }),
      description: i18n.translate('keycloak.dashboard.listing.table.deleteActionDescription', {
        defaultMessage: 'Delete dashboard',
      }),
      icon: 'trash',
      type: 'icon',
      enabled: this.onlyWhenUserCan([Permissions.MANAGE]),
      onClick: this.deleteItem
    });

    if (this.props.editItem) {
      columns.push({
        name: i18n.translate('kbn.table_list_view.listing.table.actionTitle', {
          defaultMessage: 'Actions'
        }),
        width: '100px',
        actions
      });
    }

    const noItemsMessage = (
      <FormattedMessage
        id="kbn.table_list_view.listing.noMatchedItemsMessage"
        defaultMessage="No {entityNamePlural} matched your search."
        values={{ entityNamePlural: this.props.entityNamePlural }}
      />
    );
    return (
      <EuiInMemoryTable
        itemId="id"
        items={this.state.items}
        columns={columns}
        pagination={pagination}
        loading={this.state.isFetchingItems}
        message={noItemsMessage}
        selection={selection}
        search={search}
        sorting={true}
        data-test-subj="itemsInMemTable"
      />
    );
  }

  renderListingOrEmptyState() {
    if (this.hasNoItems()) {
      return this.renderNoItemsMessage();
    }

    return this.renderListing();
  }

  renderListing() {
    let createButton;
    if (this.props.createItem) {
      createButton = (
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={this.props.createItem}
            data-test-subj="newItemButton"
            iconType="plusInCircle"
            fill
          >
            <FormattedMessage
              id="kbn.table_list_view.listing.createNewItemButtonLabel"
              defaultMessage="Create new {entityName}"
              values={{ entityName: this.props.entityName }}
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
                {this.props.tableListTitle}
              </h1>
            </EuiTitle>
          </EuiFlexItem>

          {createButton}

        </EuiFlexGroup>

        <EuiSpacer size="m" />

        {this.renderListingLimitWarning()}

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
      <EuiPage
        data-test-subj={this.props.entityName + 'LandingPage'}
        className="itemListing__page"
        restrictWidth
      >
        <EuiPageBody>
          {this.renderPageContent()}
        </EuiPageBody>
      </EuiPage>
    );
  }
}

TableListViewUi.propTypes = {
  tableColumns: PropTypes.array.isRequired,

  noItemsFragment: PropTypes.object,

  findItems: PropTypes.func.isRequired,
  deleteItems: PropTypes.func,
  createItem: PropTypes.func,
  editItem: PropTypes.func,

  listingLimit: PropTypes.number,
  initialFilter: PropTypes.string,

  entityName: PropTypes.string.isRequired,
  entityNamePlural: PropTypes.string.isRequired,
  tableListTitle: PropTypes.string.isRequired,

  ownership: PropTypes.shape({
    principal: PropTypes.object,
    getPermissions: PropTypes.func.isRequired,
    addPermission: PropTypes.func.isRequired,
    addPermissionForAll: PropTypes.func.isRequired,
    revokePermission: PropTypes.func.isRequired,
    revokePermissionForAll: PropTypes.func.isRequired,
    toggleDashboardTag: PropTypes.func.isRequired,
    isFeatureEnabled: PropTypes.func.isRequired
  }).isRequired
};

TableListViewUi.defaultProps = {
  initialFilter: EMPTY_FILTER
};

export const TableListView = injectI18n(TableListViewUi);

