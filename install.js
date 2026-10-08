module.exports = {
  requires: { bundle: "ai" },
  run: [
    {
      when: "{{!exists('app')}}",
      method: "shell.run",
      params: { message: "git clone https://github.com/debpalash/VoiceStudio.git app" }
    },
    {
      when: "{{exists('app/.pinokio-installed')}}",
      method: "fs.rm",
      params: { path: "app/.pinokio-installed" }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        venv: ".venv",
        venv_python: "3.11",
        env: { PYTHONUTF8: "1" },
        message: [
          '"{{which("bun")}}" install --frozen-lockfile',
          '"{{which("bun")}}" run setup:api',
          '"{{which("bun")}}" ../scripts/build-web-with-browser-download.js'
        ]
      }
    },
    {
      method: "fs.write",
      params: { path: "app/.pinokio-installed", text: "Installation completed.\n" }
    }
  ]
}
