const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KIBANA_EXTRA_CATALOG = 'kibana-extra';

const args = process.argv.slice(2);

fs.readdirSync(KIBANA_EXTRA_CATALOG).forEach(pluginName => {
  const cmd = `yarn lint ${args.join(' ')}`;
  const pluginPath = path.join(KIBANA_EXTRA_CATALOG, pluginName);
  console.log(`> ${cmd} in ${pluginPath}`);
  execSync(cmd, {
    cwd: pluginPath,
    stdio: ['ignore', 1, 2]
  });
});
