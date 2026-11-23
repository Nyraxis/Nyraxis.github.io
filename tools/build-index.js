// Erzeugt src/articles/index.json aus den Ordnern in src/articles/
// Aufruf:  node tools/build-index.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src', 'articles');
const folders = fs.readdirSync(dir, { withFileTypes: true })
  .filter(d => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'content.md')))
  .map(d => d.name).sort().reverse();
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(folders, null, 2));
console.log(folders.length + ' Artikel eingetragen.');
