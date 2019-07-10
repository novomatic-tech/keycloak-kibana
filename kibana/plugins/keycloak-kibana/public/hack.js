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
    'visualize-listing-table button.kuiButton',
    'visualize-listing-table th.kuiTableHeaderCell:first-child',
    'visualize-listing-table td.kuiTableRowCell:first-child',
    '[data-test-subj=dashboardAddPanel] [data-test-subj=addNewSavedObjectLink]',
    '[data-test-subj=dashboardPanelAction-editPanel]'
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
