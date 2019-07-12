# keycloak-kibana

[![Build Status](https://travis-ci.org/novomatic-tech/keycloak-kibana.svg?branch=master)](https://travis-ci.org/novomatic-tech/keycloak-kibana)

A Keycloak authorization plugin for Kibana

## Building the plugin

**Prerequisites:**

- Node.js - v10.15.2
- Yarn - min. v1.10.1

**Building:**

```bash
$ yarn install
$ yarn build
```

Artifacts will be produced in the `kibana-extra/keycloak-kibana/build` directory.

## Installing the plugin

Before you install the plugin, you must have Kibana installed in the `$KIBANA_HOME` directory.
You can download it [here](https://www.elastic.co/downloads/kibana). Also make sure that you have configured 
plugin in the ``kibana.yml`` file before installation (there are several mandatory parameters).

```bash
# Remove the previously installed plugin (optional)
$ $KIBANA_HOME/bin/kibana-plugin.sh remove keycloak-kibana
# Install a new version of plugin
$ $KIBANA_HOME/bin/kibana-plugin.sh install file:./kibana-extra/keycloak-kibana/build/keycloak-kibana-0.1.0.zip
```

## Versioning and compatibility

The following versioning schema is used:

Kibana version | Plugin version
--- | ---
`5.4.3` | `1.0.0_5.4.3`
`5.6.9` | `1.0.0_5.6.9`
`6.2.4` | `1.0.0_6.2.4`
`6.6.1` | `2.0.0_6.6.1`
`6.6.2` | `2.0.0_6.6.2`
`7.0.0` | `3.0.0_7.0.0`
`7.0.1` | `3.0.0_7.0.1`
`7.1.1` | `3.0.0_7.1.1`

The second version in the plugin (after `'_'`) must correspond to your Kibana version or the plugin will fail.
If the required version is not available to download, you must build it yourself. Please read further for additional details on this topic.

**Racionale**

Kibana has quite rigid plugin compatibility model - each plugin must include the exact version of Kibana it is compatible with. 
This requirement enforces releasing a new version of the plugin each time a new version of Kibana is released (even when only "patch" changes were released). 

Since it's hard to keep up with Kibana release train,
this repository does not attempt to do it.
However, you can still try to build the plugin which works with
your Kibana version (the plugin was tested with the major Kibana releases and hardly anything has changed):

- Checkout the branch which corresponds to your kibana version (`6.x`, `7.x` etc).
- Just change the `kibana.version` property in the `package.json` file to your desired Kibana version.
- Build and install the plugin

## Configuration

The plugin is configurable via `config/kibana.yml` file residing in the Kibana home directory.
The following properties are available to be set.

Parameter | Description | Default
--- | --- | ---
`keycloak.serverUrl` | The base URL of the Keycloak server. All other Keycloak pages and REST service endpoints are derived from this. It is usually of the form https://host:port/auth. This is REQUIRED. | 
`keycloak.realm` | Name of the realm. This is REQUIRED. | 
`keycloak.clientId` |  The client-id of the application. Each application has a client-id that is used to identify the application. This is REQUIRED. | 
`keycloak.clientSecret` | The client secret of the application. Each application that uses OAuth's Authorization Code flow has one assigned. This is REQUIRED. |  
`keycloak.realmPublicKey` | PEM format of the realm public key. You can obtain this from the administration console. This is OPTIONAL. | `undefined`
`keycloak.minTimeBetweenJwksRequests` | Amount of time, in seconds, specifying minimum interval between two requests to Keycloak to retrieve new public keys. | `10`
`keycloak.principalNameAttribute` | OpenID Connect ID Token attribute which will be used as the user principal name. It will fallback to *sub* ID token attribute in case the *principalAttribute* is not present. Possible values are *sub*, *preferred_username*, *email*, *name*. | `name`
`keycloak.session.name` | Determines the name of the cookie used to store session information. | `kc_session`
`keycloak.session.cookieOptions.password` |  A password used to encrypt session cookies. It must be at least 32 characters long. It is also recommended to rotate your ookie session password on a regular basis. This is REQUIRED. | 
`keycloak.session.cookieOptions.isSecure` | Determines whether or not to transfer session cookies using TLS/SSL. | `false`
`keycloak.session.cookieOptions.isHttpOnly` | Determines whether or not to set HttpOnly option in cookie. Cookies, when used with the HttpOnly cookie flag, are not accessible through JavaScript, and are immune to XSS. | `false`
`keycloak.requiredRoles` | A list of Keycloak roles a user has to be assigned to in order to access Kibana. By default, any authenticated user can use Kibana. When this property is set only users with certain roles assigned can access Kibana. | `[]`
`keycloak.propagateBearerToken` | A boolean value determining whether `Authorization: Bearer [ACCESS_TOKEN]` header should be propagated to Elasticsearch. | `true`
`keycloak.acl.enabled` | A toggle for dashboard ownership feature. When enabled, each created dashboard has its owner and cannot be viewed, edited or managed by others unless shared. | `false`
`keycloak.acl.ownerAttribute`| OpenID Connect ID Token attribute which will be used as the user identifier for ACLs. Possible values are *sub*, *preferred_username*, *email*. | `sub`
`keycloak.tagging.enabled` | A toggle for dashboard tagging feature. When enabled users are able to manage their favourite and home dashboards. | `false`


Sample configuration section can be found in the `env/kibana/kibana.yml` file.

## Roles

Role | Description
--- | ---
`discover` | Can discover logs.
`view-visualizations` | Can view visualisations.
`manage-visualizations` | Can create and edit visualisations.
`view-dashboards` | Can view dashboards.
`manage-dashboards` | Can create and edit dashboards.
`view-searches` | Can view searches.
`manage-searches` | Can create and edit searches.
`use-canvas` | Can use canvas.
`use-maps` | Can use maps.
`use-ml` | Can use machine learning.
`use-infra` | Can use infrastructure.
`use-infra-logs` | Can use infrastructure logs.
`use-apm` | Can use application performance monitoring.
`use-uptime` | Can use uptime.
`use-siem` | Can use security analytics.
`use-dev-tools` | Can use dev tools.
`use-monitoring` | Can use monitoring.
`manage-kibana` | Can manage kibana.

## Running the example

- Run a preconfigured Keycloak instance using docker compose

  ```bash
  $ docker-compose up -d
  ```

- Install all dependency along with Kibana using yarn and start Kibana with plugins

  ```bash
  $ yarn install
  $ yarn start
  ```

- Visit `localhost:5601` and log in as `admin:admin` to try it out.

## Extracting translations keys

The `keycloak-kibana` plugin support i18n feature.
According to the [documentation](https://github.com/elastic/kibana/blob/7.0/src/dev/i18n/README.md), 
kibana has tool for extracting all translation keys from source code. Example:

  ```bash
  $ mkdir translations
  $ cd kibana
  $ node scripts/i18n_extract.js --path ../kibana-extra/keycloak-kibana --output-dir ../translations --include-config ../kibana-extra/keycloak-kibana/.i18nrc.json
  ```
