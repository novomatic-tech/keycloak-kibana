import $ from 'jquery';
import {MANAGE_DASHBOARDS, MANAGE_VISUALIZATIONS, MANAGE_KIBANA} from "./authz/roles";

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
    const style = $(`<style>${elementsToDisable.join(', ')} { display: none; }</style>`);
    $('head').append(style);
};
