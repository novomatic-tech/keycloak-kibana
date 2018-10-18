import _ from "lodash";
import {NAVIGATION_UPDATE} from "./events";

export default class NavigationHandler {

    constructor($rootScope, chrome) {
        this._chrome = chrome;
        this._activeNavLinks = [];
        this._allNavLinks = [];
        this._rootScope = $rootScope;
    }

    initialize() {
        this._activeNavLinks = this._chrome.getNavLinks();
        this._allNavLinks = this._activeNavLinks.slice();
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
        if (_.some(linkIds.map(this._showLink.bind(this)))) {
            this._rootScope.$emit(NAVIGATION_UPDATE, this._activeNavLinks);
        }
    }

    hideLinks(linkIds) {
        if (_.some(linkIds.map(this._hideLink.bind(this)))) {
            this._rootScope.$emit(NAVIGATION_UPDATE, this._activeNavLinks);
        }
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