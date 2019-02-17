import $ from 'jquery';
import {MANAGE_DASHBOARDS, MANAGE_VISUALIZATIONS, MANAGE_KIBANA, MANAGE_SEARCHES, VIEW_SEARCHES} from "./authz/roles";

window.onKibanaPrincipalUpdated = function(principal) {
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
    if (!principal.scope.includes(MANAGE_DASHBOARDS)) {
        elementsToDisable = elementsToDisable.concat(manageDashboardsControls);
    }
    if (!principal.scope.includes(MANAGE_VISUALIZATIONS)) {
        elementsToDisable = elementsToDisable.concat(manageVisualizationControls);
    }
    if (!principal.scope.includes(MANAGE_KIBANA)) {
        elementsToDisable = elementsToDisable.concat(manageKibanaControls);
    }
    if (!principal.scope.includes(VIEW_SEARCHES)) {
        elementsToDisable = elementsToDisable.concat(viewSearchesControls);
    }
    if (!principal.scope.includes(MANAGE_SEARCHES)) {
        elementsToDisable = elementsToDisable.concat(manageSearchesControls);
    }

    const style = $(`<style>${elementsToDisable.join(', ')} { display: none !important;  }</style>`);
    $('head').append(style);
};
