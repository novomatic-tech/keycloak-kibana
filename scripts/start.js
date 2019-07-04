const { readdirSync } = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KIBANA_CATALOG = 'kibana';
const KIBANA_PLUGINS_CATALOG = 'kibana/plugins';

let args = process.argv.slice(2);

readdirSync(KIBANA_PLUGINS_CATALOG, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .forEach(dirent => {
    args = args.concat(['--plugin-path', path.join(process.cwd(), KIBANA_PLUGINS_CATALOG, dirent.name)]);
  });

const cmd = `node --no-warnings --max-http-header-size=65536 src/cli ${args.join(' ')}`;
const cwd = KIBANA_CATALOG;

console.log(`> ${cmd} in ${cwd}`);
execSync(cmd, { stdio: ['ignore', 1, 2], cwd });
