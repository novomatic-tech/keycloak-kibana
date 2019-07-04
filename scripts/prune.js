const fs = require('fs');
const { execSync } = require('child_process');
const KIBANA_CATALOG = 'kibana';
const whitelist = new Set(['.gitignore', 'plugins']);

const pruneKibana = function (path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      if(whitelist.has(file)) {
        return;
      }
      const currentPath = path + '/' + file;
      if (fs.lstatSync(currentPath).isDirectory()) {
        execSync(`rm -rf ${currentPath}`);
      } else {
        fs.unlinkSync(currentPath);
      }
    });
  }
};

console.log('Pruning kibana sources...');
pruneKibana(KIBANA_CATALOG);
