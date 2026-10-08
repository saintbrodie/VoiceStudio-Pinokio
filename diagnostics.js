module.exports = {
  run: [{
    method: "shell.run",
    params: {
      path: "app/backend",
      venv: "../.venv",
      env: {
        OMNIVOICE_DATA_DIR: "{{path.resolve(cwd, 'data')}}",
        HF_HOME: "{{path.resolve(cwd, 'cache/huggingface')}}",
        TORCH_HOME: "{{path.resolve(cwd, 'cache/torch')}}",
        PYTHONUTF8: "1",
        PYTHONUNBUFFERED: "1",
        PYTORCH_ENABLE_MPS_FALLBACK: "1"
      },
      message: "python main.py --diagnose"
    }
  }]
}
