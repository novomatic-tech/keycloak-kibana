const tar = require('tar');
const http = require('http');
const fs = require('fs');
const https = require('https');
const url = require('url');
const path = require('path');
const {execSync} = require('child_process');
const pkg = require('../package.json');
const KIBANA_CATALOG = 'kibana';
const stdio = [0, 1, 2];

const isUnsuccessfulResponse = response => response.statusCheck >= 400;
const isRedirectResponse = response => response.statusCode > 300 && response.statusCode < 400;

const request = {
  get: (location) => {
    const locationUrl = url.parse(location);
    const get = locationUrl.protocol === 'https:' ? https.get : http.get;
    return new Promise((resolve, reject) => {
      console.log(`Creating a get request to url: ${location}`);
      get(location, response => {
        if (isUnsuccessfulResponse(response)) {
          reject(response);
        } else if (isRedirectResponse(response)) {
          console.log(`Redirecting a get request to url: ${response.headers.location}`);
          get(response.headers.location, response => {
            if (isUnsuccessfulResponse(response)) {
              reject(response);
            } else {
              resolve(response);
            }
          }).on('error', error => {
            reject(error);
          });
        }
      }).on('error', error => {
        reject(error);
      });
    });
  }
};


const createCatalog = (catalogName) => {
  if (!fs.existsSync(catalogName)) {
    fs.mkdirSync(catalogName);
  }
};

const kibanaExists = () => {
  return fs.existsSync(path.join(KIBANA_CATALOG, 'package.json'));
};

const extractResponse = (response) => {
  return new Promise((resolve, reject) => {
    console.log(`Extracting response into kibana catalog`);
    const responseStream = response.pipe(
      tar.extract({
        strip: 1,
        cwd: KIBANA_CATALOG
      })
    );
    responseStream.on('end', () => {
      resolve();
    });

    responseStream.on('error', error => {
      reject(error);
    });
  });
};


const fetchKibana = (kibanaUrl) => {
  return request.get(kibanaUrl).then(response => extractResponse(response));
};

const switchKibanaConfig = () => {
  console.log('Switching kibana config');
  fs.copyFileSync('env/kibana/kibana.yml', path.join(KIBANA_CATALOG, 'config/kibana.yml'));
};

const installKibanaPlugin = (pluginLocation) => {
  const cmd = `node --no-warnings src/cli_plugin install ${pluginLocation}`;
  const cwd = KIBANA_CATALOG;
  console.log(`> ${cmd} in ${cwd}`);
  execSync(cmd, {stdio, cwd});
};

const bootstrapKibana = () => {
  const cmd = `yarn kbn bootstrap`;
  const cwd = KIBANA_CATALOG;
  console.log(`> ${cmd} in ${cwd}`);
  execSync(cmd, {stdio, cwd});
};

const deletePreCommitHook = () => {
    const hookPath = './.git/hooks/pre-commit';
    if (fs.existsSync(hookPath)) {
        console.log(`Removing pre-commit hook from git: ${hookPath}`);
        fs.unlinkSync(hookPath);
    }
};

if (kibanaExists()) {
  console.log('The kibana catalog already exists, so skipping the fetch kibana sources step');
} else {
  console.log('The kibana catalog does not exists, so fetching kibana sources');
  createCatalog(KIBANA_CATALOG);
  fetchKibana(pkg.kibana.location).then(() => {
    switchKibanaConfig();
    bootstrapKibana();
    deletePreCommitHook();
    pkg.kibana.plugins.forEach(plugin => {
      installKibanaPlugin(plugin.location);
    });
  }).catch(error => {
    console.error(`An error occurred during fetching kibana sources. ${error}`);
    process.exit(1);
  });
}