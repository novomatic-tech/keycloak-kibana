const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KIBANA_PLUGINS_CATALOG = 'kibana/plugins';

const runTest = (testType, path) => {
  const cmd = `yarn test:${testType}`;
  console.log(`> ${cmd} in ${path}`);
  execSync(cmd, {
    cwd: path,
    stdio: ['ignore', 1, 2]
  });
};

fs.readdirSync(KIBANA_PLUGINS_CATALOG, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const pluginPath = path.join(KIBANA_PLUGINS_CATALOG, dirent.name);
    runTest('server', pluginPath);
    runTest('browser', pluginPath);
  });
