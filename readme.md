# keycloak-kibana

A Keycloak authorization plugin for Kibana

## Building the plugin

```bash
$ npm install
$ npm run build
```

Artifacts will be produced in the `build` directory.

## Installing the plugin

Before you install the plugin, you must have Kibana installed in the `$KIBANA_HOME` directory.
You can download it [here](https://www.elastic.co/downloads/kibana).

```bash
# Remove the  previously installed plugin (optional)
$ $KIBANA_HOME/bin/kibana-plugin.sh remove keycloak-kibana
# Install a new version of plugin
$ $KIBANA_HOME/bin/kibana-plugin.sh install file:./build/keycloak-kibana-0.1.0.zip
```

## Versioning and compatibility

The following versioning schema is used:

Kibana version | Plugin version
--- | ---
`5.4.3` | `1.0.0_5.4.3`
`5.6.9` | `1.0.0_5.6.9`
`6.2.4` | `1.0.0_6.2.4`


  The second version in the plugin (after `'_'`) must correspond to your Kibana version or the plugin will fail.
  If the required version is not available to download, you must build it yourself. Please read further for additional details on this topic.

  **Racionale**

  Kibana has quite rigid plugin compatibility model - each plugin must include the exact version of Kibana it is compatible with. 
  This requirement enforces releasing a new version of the plugin each time a new version of Kibana is released (even when only "patch" changes were released). 
  
  Since it's hard to keep up with Kibana release train,
  this repository does not attempt to do it.
  However, you can still try to build the plugin which works with
  your Kibana version (the plugin was tested with the major Kibana releases and hardly anything has changed):

  - Just change the `kibana.version` property in the `package.json` file to your desired Kibana version (it should work with 5.x - 6.2.x)
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
`keycloak.propagateBearerToken` | A boolean value determining whether `Authorization: Bearer [ACCESS_TOKEN]` header should be propagated to Elasticsearch. | `false`

Sample configuration section can be found in the `env/kibana/kibana.yml` file.

## Running the example

- Run a preconfigured Keycloak instance using docker compose

  ```bash
  $ docker-compose up -d
  ```

- Configure the Kibana by coping the content of the the `env/kibana/kibana.yml` file at the end of the `$KIBANA_HOME/config/kibana.yml` file.
- Install the plugin in a suitable version and run Kibana.

  ```bash
  # The second version after '_' must correspond to your Kibana version or it will fail.
  # If the required version is not available, please refer to the Compatibility section of this guide. 
  $ $KIBANA_HOME/bin/kibana-plugin.sh install https://github.com/novomatic-tech/keycloak-kibana/releases/download/1.0.0/keycloak-kibana-1.0.0_6.2.4.zip
  $ $KIBANA_HOME/bin/kibana.sh
  ```

- Visit `localhost:5601` and log in as `trice:trice` to try it out.

