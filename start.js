module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        path: "app/backend",
        venv: "../.venv",
        env: {
          OMNIVOICE_BIND_HOST: "127.0.0.1",
          OMNIVOICE_PORT: "{{port}}",
          OMNIVOICE_DATA_DIR: "{{path.resolve(cwd, 'data')}}",
          HF_HOME: "{{path.resolve(cwd, 'cache/huggingface')}}",
          TORCH_HOME: "{{path.resolve(cwd, 'cache/torch')}}",
          PYTHONUTF8: "1",
          PYTHONUNBUFFERED: "1",
          PYTORCH_ENABLE_MPS_FALLBACK: "1"
        },
        // Silence HTTP access logs while preserving VoiceStudio's normal startup and error logs.
        message: "python -c \"import runpy; from uvicorn.config import LOGGING_CONFIG; LOGGING_CONFIG['loggers']['uvicorn.access']['level'] = 'WARNING'; runpy.run_path('main.py', run_name='__main__')\"",
        on: [{
          event: "/(http:\\/\\/[0-9.:]+)/",
          done: true
        }]
      }
    },
    {
      method: "local.set",
      params: { url: "{{input.event[1]}}" }
    },
    {
      method: "process.wait",
      params: {
        on: {
          resources: [
            "{{local.url.replace('http://', 'http-get://')}}/health",
            "{{local.url.replace('http://', 'http-get://')}}/"
          ],
          interval: 1000,
          timeout: 300000,
          httpTimeout: 5000
        },
        title: "Starting VoiceStudio",
        description: "Waiting for the ML runtime and web interface to finish loading"
      }
    },
    {
      method: "local.set",
      params: { web_ready: true }
    }
  ]
}
