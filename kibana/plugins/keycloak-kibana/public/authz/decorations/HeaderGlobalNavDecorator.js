/* eslint-disable import/no-unresolved */
import overriddenReactDirective from './OverriddenReactDirective';
import { Header } from 'ui/chrome/directives/header_global_nav/components/header';
import { wrapInI18nContext } from 'ui/i18n';
import { chromeHeaderNavControlsRegistry } from 'ui/registry/chrome_header_nav_controls';
import { getNewPlatform } from 'ui/new_platform';

/**
 * This overrides the original Header React component with a custom one
 * and injects overridden props so that it is possible to modify a list of links in the main menu.
 */
const component = wrapInI18nContext(Header);
const propsFactory = (reactDirective, chrome, navigationHandler, Private, uiCapabilities) => {
  const { recentlyAccessed } = require('ui/persisted_log');
  const navControls = Private(chromeHeaderNavControlsRegistry);
  const homeHref = chrome.addBasePath('/app/kibana#/home');
  const newPlatform = getNewPlatform();
  const newPlatformStart = newPlatform.start.core;

  return {
    badge$: chrome.badge.get$(),
    breadcrumbs$: chrome.breadcrumbs.get$(),
    helpExtension$: chrome.helpExtension.get$(),
    navLinks$: navigationHandler.getNavLinks$(),
    recentlyAccessed$: recentlyAccessed.get$(),
    forceAppSwitcherNavigation$: newPlatformStart.chrome.navLinks.getForceAppSwitcherNavigation$(),
    navControls,
    homeHref,
    uiCapabilities
  };
};
const watchedProps = [ // scope accepted by directive, passed in as React props
  'appTitle',
  'isVisible',
];
export default overriddenReactDirective(component, propsFactory, watchedProps);
