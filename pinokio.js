module.exports = {
  version: "7.0",
  title: "VoiceStudio",
  description: "Local voice cloning, dubbing, transcription, and audiobooks. Windows/Linux x64 and Apple Silicon macOS.",
  icon: "icon.svg",
  menu: async (kernel, info) => {
    const supported = process.platform === "darwin" ? process.arch === "arm64" : process.arch === "x64"
    if (!supported) return [{ icon: "fa-solid fa-circle-info", text: "Requires Windows/Linux x64 or Apple Silicon macOS", href: "README.md" }]
    for (const [script, text, icon] of [
      ["install.js", "Installing...", "fa-solid fa-plug"],
      ["update.js", "Updating...", "fa-solid fa-arrows-rotate"],
      ["reset.js", "Resetting...", "fa-solid fa-broom"]
    ]) {
      if (info.running(script)) return [{ default: true, text, icon, href: script }]
    }
    const installed = info.exists("app/.pinokio-installed") &&
      info.exists("app/.venv") && info.exists("app/frontend/dist/index.html")
    const utilities = []
    if (info.exists("data")) utilities.push({ icon: "fa-regular fa-folder-open", text: "Open Data Folder", href: "data", fs: true })
    if (info.exists("data/omnivoice.log")) utilities.push({ icon: "fa-solid fa-file-lines", text: "View App Log", href: "data/omnivoice.log", fs: "open" })
    if (installed) utilities.push({ icon: "fa-solid fa-stethoscope", text: "Diagnostics", href: "diagnostics.js" })
    if (info.running("diagnostics.js")) return [
      { default: true, icon: "fa-solid fa-stethoscope", text: "Running Diagnostics...", href: "diagnostics.js" },
      ...utilities.filter(item => item.href !== "diagnostics.js")
    ]
    if (info.running("start.js")) {
      const local = info.local("start.js")
      if (local && local.url && local.web_ready) return [
        { default: true, icon: "fa-solid fa-rocket", text: "Open Web UI", href: local.url },
        { icon: "fa-solid fa-terminal", text: "Terminal", href: "start.js" },
        { icon: "fa-solid fa-code", text: "API Documentation", href: `${local.url}/docs` },
        ...utilities
      ]
      return [{ default: true, icon: "fa-solid fa-terminal", text: "Starting...", href: "start.js" }, ...utilities]
    }
    if (!installed) return [{ default: true, icon: "fa-solid fa-plug", text: "Install", href: "install.js" }, ...utilities]
    return [
      { icon: "fa-solid fa-power-off", text: "Start", href: "start.js" },
      { icon: "fa-solid fa-arrows-rotate", text: "Update", href: "update.js" },
      { icon: "fa-solid fa-plug", text: "Reinstall", href: "install.js" },
      { icon: "fa-solid fa-broom", text: "Reset Dependencies", href: "reset.js", confirm: "Remove the Python environment, JavaScript dependencies, and built UI? Your voices, projects, audio, and model cache will be kept." },
      ...utilities
    ]
  }
}
