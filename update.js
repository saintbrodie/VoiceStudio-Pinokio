module.exports = {
  run: [
    {
      method: "shell.run",
      params: {
        message: 'node -e "const {spawnSync}=require(\'child_process\'); if(spawnSync(\'git\',[\'remote\',\'get-url\',\'origin\'],{stdio:\'ignore\'}).status===0){const r=spawnSync(\'git\',[\'pull\',\'--ff-only\'],{stdio:\'inherit\'});process.exit(r.status??1)}else{console.log(\'No launcher origin configured; skipping launcher pull.\')}"'
      }
    },
    {
      when: "{{exists('app/.git')}}",
      method: "shell.run",
      params: { path: "app", message: "git pull --ff-only" }
    },
    {
      method: "script.start",
      params: { uri: "install.js" }
    }
  ]
}
