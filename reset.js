module.exports = {
  run: [
    { when: "{{exists('app/.pinokio-installed')}}", method: "fs.rm", params: { path: "app/.pinokio-installed" } },
    { when: "{{exists('app/.venv')}}", method: "fs.rm", params: { path: "app/.venv" } },
    { when: "{{exists('app/node_modules')}}", method: "fs.rm", params: { path: "app/node_modules" } },
    { when: "{{exists('app/electron/node_modules')}}", method: "fs.rm", params: { path: "app/electron/node_modules" } },
    { when: "{{exists('app/frontend/dist')}}", method: "fs.rm", params: { path: "app/frontend/dist" } }
  ]
}
