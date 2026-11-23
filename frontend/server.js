const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, 'dist');

const indexTemplate = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');

function renderIndex() {
  const apiUrl = process.env.API_URL || '';
  return indexTemplate.replace('__RUNTIME_CONFIG_API_URL__', apiUrl);
}

app.use(express.static(DIST_DIR, { index: false }));

app.get('*', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send(renderIndex());
});

app.listen(PORT, () => {
  console.log(`examresults-frontend listening on port ${PORT}`);
});
