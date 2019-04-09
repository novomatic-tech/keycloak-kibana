const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const KIBANA_EXTRA_CATALOG = 'kibana-extra';

const runTest = (testType, path) => {
  const cmd = `yarn test:${testType}`;
  console.log(`> ${cmd} in ${path}`);
  execSync(cmd, {
    cwd: path,
    stdio: ['ignore', 1, 2]
  });
};

fs.readdirSync(KIBANA_EXTRA_CATALOG).forEach(pluginName => {
  const pluginPath = path.join(KIBANA_EXTRA_CATALOG, pluginName);
  runTest('server', pluginPath);
  runTest('browser', pluginPath);
});