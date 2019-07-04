const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KIBANA_PLUGINS_CATALOG = 'kibana/plugins';
const BUILD_OUTPUT = 'release';
const PROJECT_ROOT = process.cwd();

if (!fs.existsSync(BUILD_OUTPUT)) {
  fs.mkdirSync(BUILD_OUTPUT);
}
fs.readdirSync(KIBANA_PLUGINS_CATALOG, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    const cmd = 'yarn build';
    const pluginPath = path.join(KIBANA_PLUGINS_CATALOG, dirent.name);
    console.log(`> ${cmd} in ${pluginPath}`);
    execSync(cmd, {
      cwd: pluginPath,
      stdio: ['ignore', 1, 2]
    });
    const pkg = require(path.join(PROJECT_ROOT, pluginPath, 'package.json'));
    const bundlePath = path.join(pluginPath, 'build', `${pkg.name}-${pkg.version}.zip`);
    const bundleDestination = path.join(BUILD_OUTPUT, `${pkg.name}-${pkg.version}_${pkg.kibana.version}.zip`);
    fs.copyFileSync(bundlePath, bundleDestination);
  });
