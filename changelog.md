## Upcoming 3.0.0-alpha7
* Add support for Kibana X-Pack - [#24](https://github.com/novomatic-tech/keycloak-kibana/pull/24)
* Add compatibility with Kibana 7.2.0

## 3.0.0-alpha6
* Fix problem with save again already saved dashboard - [#19](https://github.com/novomatic-tech/keycloak-kibana/issues/19)
* Fix problem with deleting of dashboard

## 3.0.0-alpha5
* Add compatibility with Kibana 7.1.1

## 3.0.0-alpha4
* Fix problem with importing i18n library

## 3.0.0-alpha3
* Add compatibility with Kibana 7.0.1

## 3.0.0-alpha2

* Add compatibility with Kibana 7.0.0
* Add support for i18n feature

## 2.0.0-alpha2

* Handle unauthorized HTTP responses in Kibana
* Introduce concurrency control to update and delete on dashboards in kibana
* Fix bug with UI runtime error when Kibana monitor page is displayed
* Fix invalid UI controls being hidden with different roles assigned

## 2.0.0-alpha1

* Allow to propagate bearer token to elasticsearch
* Add authorization for angular routes and Kibana menu items
* Add dashboard ownership
* Add dashboard tagging

## 1.1.0

* Add support for [Back-Channel Logout](https://openid.net/specs/openid-connect-backchannel-1_0.html) procedure

## 1.0.2

* Add kibana-elasticsearch endpoints to return 401 if not authorized

## 1.0.1

* Handle ``server.basePath`` parameter in keycloak integration

## 1.0.0 - initial release