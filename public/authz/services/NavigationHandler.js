import _ from "lodash";

export default class NavigationHandler {

    constructor($rootScope, chrome) {
        this._chrome = chrome;
        this._activeNavLinks = [];
        this._allNavLinks = []
    }

    initialize() {
        this._activeNavLinks = [];
        this._allNavLinks = this._chrome.getNavLinks().slice();
    }

    getAllLinks() {
        return this._allNavLinks;
    }

    getLink(linkId) {
        return _.find(this._allNavLinks, link => link.id === linkId);
    }

    getActiveLinks() {
        return this._activeNavLinks;
    }

    isLinkActive(linkId) {
        const existingLink = _.find(this._activeNavLinks, link => link.id === linkId);
        return existingLink !== undefined;
    }

    showLinks(linkIds) {
        linkIds.map(this._showLink.bind(this));
    }

    hideLinks(linkIds) {
        linkIds.map(this._hideLink.bind(this))
    }

    _showLink(linkId) {
        if (this.isLinkActive(linkId)) {
            return false;
        }
        const navLink = this.getLink(linkId);
        if (!navLink) {
            return false;
        }
        let index = _.findIndex(this._activeNavLinks, link => link.order > navLink.order);
        if (index === -1) {
            index = this._activeNavLinks.length;
        }
        this._activeNavLinks.splice(index, 0, navLink);
        return true;
    }

    _hideLink(linkId) {
        const removed = _.remove(this._activeNavLinks, link => link.id === linkId);
        return removed && removed.length > 0;
    }
}