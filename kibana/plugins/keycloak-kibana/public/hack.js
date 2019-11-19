import $ from 'jquery';
import Roles from './authz/constants/Roles';

const STYLE_ID = 'kc-elements-to-disable-id';

window.onKibanaPrincipalUpdated = function (principal) {
  const manageDashboardsControls = [
    'dashboard-listing [data-test-subj=newDashboardLink]',
    'dashboard-listing th.euiTableHeaderCellCheckbox',
    'dashboard-listing td.euiTableRowCellCheckbox',
    'dashboard-listing th.euiTableHeaderCell:last-child',
    'dashboard-listing td.euiTableRowCell:last-child'
  ];
  const manageVisualizationControls = [
    'visualize-listing-table [data-test-subj=newItemButton]',
    'visualize-listing-table th.euiTableHeaderCellCheckbox:first-child',
    'visualize-listing-table th.euiTableHeaderCell:last-child',
    'visualize-listing-table td.euiTableRowCellCheckbox:first-child',
    'visualize-listing-table td.euiTableRowCell:last-child',
    '[data-test-subj=dashboardAddPanel] .euiFlyoutFooter',
    '[data-test-subj=embeddablePanelAction-editPanel]'
  ];
  const manageKibanaControls = [
    'saved-object-finder button.kuiButton'
  ];
  const viewSearchesControls = [
    '[data-test-subj=discoverOpenButton]',
    '[data-test-subj=discoverShareButton]',
    '[data-test-subj=visualizeSelectSearch] .wizard-column--large',
    '[data-test-subj=addSavedSearchTab]'
  ];
  const manageSearchesControls = [
    '[data-test-subj=discoverSaveButton]'
  ];

  let elementsToDisable = [];
  if (!principal.hasRole(Roles.MANAGE_DASHBOARDS)) {
    elementsToDisable = elementsToDisable.concat(manageDashboardsControls);
  }
  if (!principal.hasRole(Roles.MANAGE_VISUALIZATIONS)) {
    elementsToDisable = elementsToDisable.concat(manageVisualizationControls);
  }
  if (!principal.hasRole(Roles.MANAGE_KIBANA)) {
    elementsToDisable = elementsToDisable.concat(manageKibanaControls);
  }
  if (!principal.hasRole(Roles.VIEW_SEARCHES)) {
    elementsToDisable = elementsToDisable.concat(viewSearchesControls);
  }
  if (!principal.hasRole(Roles.MANAGE_SEARCHES)) {
    elementsToDisable = elementsToDisable.concat(manageSearchesControls);
  }

  const style = $(`<style id="${STYLE_ID}">${elementsToDisable.join(', ')} { display: none !important;  }</style>`);
  $('head').find(`.${STYLE_ID}`).remove();
  $('head').append(style);
};
