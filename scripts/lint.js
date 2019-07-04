const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KIBANA_PLUGINS_CATALOG = 'kibana/plugins';

const args = process.argv.slice(2);

fs.readdirSync(KIBANA_PLUGINS_CATALOG, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const cmd = `yarn lint ${args.join(' ')}`;
    const pluginPath = path.join(KIBANA_PLUGINS_CATALOG, dirent.name);
    console.log(`> ${cmd} in ${pluginPath}`);
    execSync(cmd, {
      cwd: pluginPath,
      stdio: ['ignore', 1, 2]
    });
  });
