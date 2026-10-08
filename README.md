# VoiceStudio for Pinokio

A one-click installer and browser launcher for [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio): local voice cloning, speech generation, dubbing, transcription, and audiobooks.

## Use

1. Open this folder in Pinokio and click **Install**. It clones upstream into `app/`, installs JavaScript dependencies with Bun, prepares Python 3.11 in `app/.venv` with upstream's locked UV setup, and builds the web interface.
2. Click **Start**. Pinokio selects a free port, captures the backend's localhost URL, and waits until both `/health` and the web interface return a successful response before opening **Open Web UI**. The terminal shows **Starting...** while the ML runtime loads. Startup has a five-minute timeout; if it fails, check the logs before retrying.
3. Install an engine/model in the app when prompted, select or create a voice, enter text, and generate audio. Model downloads are separate from dependency installation.
4. Stop the server with Pinokio's built-in stop control before using **Update**, **Reinstall**, or **Reset Dependencies**.

Start is a manual action while VoiceStudio is stopped. Completing Diagnostics or another utility does not automatically launch the server.

**Update** pulls the launcher when its Git origin is configured, pulls upstream, and repeats installation/build. **Reinstall** repeats dependency setup without pulling. **Reset Dependencies** removes only the Python environment, JavaScript dependencies, built web UI, and installation marker. Click Install afterward.

**Open Data Folder** opens your voices, projects, and generated audio in the system file explorer. **View App Log** opens `data/omnivoice.log` directly in your system's default text viewer, without running a launcher script or starting VoiceStudio. Both appear once their target exists. **Diagnostics** runs upstream's self-check for Python, GPU, FFmpeg, storage, engines, Hugging Face credentials, and connectivity, using this launcher's environment and data/cache folders. It can run while the app is open and does not download or load models or generate audio. Read the report's warnings and suggested fixes; an unset Hugging Face token may be fine for public models.

This launcher uses the upstream web build served by its Python backend. Native Electron features such as global dictation shortcuts, system text insertion, and desktop window controls require the separate upstream desktop app.

**Browser audio download fix:** In the Pinokio WebUI, **Save as…** on **Latest take** and **Recent takes** downloads the generated WAV using the browser. The upstream Electron-only button otherwise does nothing in a browser. During **Install**, **Reinstall**, or **Update**, `scripts/build-web-with-browser-download.js` temporarily patches that button to use VoiceStudio's existing authenticated API and browser-download helper, runs `build:web`, and restores the upstream source even if the build fails. This means the installed upstream Git tree stays clean for `git pull --ff-only`. The workaround fails with an explanatory error if upstream changes the affected component, rather than silently breaking the button. Remove it once upstream adds browser downloads natively. The original WAVs are also available under `data/outputs/`.

Launcher workaround tests: `node --test tests/browser-download.test.js`.


## Hardware and storage

Designed for Windows/Linux x64 and Apple Silicon macOS. Intel macOS and Windows ARM are not supported by this launcher. NVIDIA machines use upstream's automatic CUDA detection; machines without NVIDIA use CPU wheels. Apple Silicon uses native PyTorch/MPS. Dependencies and CUDA builds can require several GB, plus disk space and memory for the models you choose. Pinokio's AI bundle supplies shared prerequisites; upstream setup handles its platform compatibility fixes.

All launcher scripts stay in this folder; upstream source remains unmodified under `app/`.

| Folder | Contents | Kept by Reset Dependencies |
| --- | --- | --- |
| `app/` | Upstream source, Python environment, web dependencies/build | Source only |
| `data/` | Settings, database, voices, projects, generated audio | Yes |
| `cache/` | Hugging Face and Torch model cache | Yes |
| `logs/api/` | Pinokio installation/start logs (`latest` is the most recent) | Yes |

Back up `data/` before deleting this launcher folder. Existing standalone VoiceStudio data is not automatically imported.

## Local API

Use the actual URL displayed by **Open Web UI**, since the port changes between launches. **API Documentation** opens `/docs`; `/openapi.json` describes all available routes. `/health` reports readiness. Loopback calls need no credentials unless you configure authentication in VoiceStudio.

The following examples synthesize a WAV through the OpenAI-compatible speech endpoint. Install the `omnivoice` engine/model first, or change `model` to an installed engine ID. Set `voice` to a saved profile ID/name to clone that voice; `default` uses the engine's default voice. These requests may take time on CPU.

### JavaScript (Node.js)

```javascript
import { writeFile } from "node:fs/promises";
const base = process.env.VOICESTUDIO_URL; // e.g. the Open Web UI URL
if (!base) throw new Error("Set VOICESTUDIO_URL to the running app URL");
const response = await fetch(`${base}/v1/audio/speech`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "omnivoice", voice: "default",
    input: "Hello from VoiceStudio.", response_format: "wav"
  })
});
if (!response.ok) throw new Error(await response.text());
await writeFile("speech.wav", Buffer.from(await response.arrayBuffer()));
```

### Python (standard library)

```python
import json, os, urllib.request
base = os.environ["VOICESTUDIO_URL"].rstrip("/")
request = urllib.request.Request(
    base + "/v1/audio/speech",
    data=json.dumps({"model": "omnivoice", "voice": "default",
                     "input": "Hello from VoiceStudio.",
                     "response_format": "wav"}).encode(),
    headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(request, timeout=600) as response:
    with open("speech.wav", "wb") as output:
        output.write(response.read())
```

### Curl

Set `VOICESTUDIO_URL` to the displayed URL. Save this as `speech.json`:

```json
{"model":"omnivoice","voice":"default","input":"Hello from VoiceStudio.","response_format":"wav"}
```

On macOS/Linux:

```sh
curl --fail-with-body "$VOICESTUDIO_URL/v1/audio/speech" -H "Content-Type: application/json" --data-binary @speech.json --output speech.wav
```

In Windows PowerShell:

```powershell
curl.exe --fail-with-body "$env:VOICESTUDIO_URL/v1/audio/speech" -H "Content-Type: application/json" --data-binary "@speech.json" --output speech.wav
```

For file transcription, send a multipart `file` to `/v1/audio/transcriptions` with an installed ASR `model` ID. Voice management, dubbing, model installation, and audiobook routes are documented in the running app's `/docs`.

## Troubleshooting

Read `logs/api/install.js/latest` or `logs/api/start.js/latest` first. Application details are logged in `data/omnivoice.log`. If dependencies or the UI build are incomplete, use Reinstall; the Start button appears only after installation completes successfully. Reset Dependencies can repair a broken environment while keeping user data and downloaded models.

The launch command silences Uvicorn's HTTP access logger so background UI polling does not flood the terminal. Startup messages, VoiceStudio application logs, warnings, and server errors remain visible. This changes only launcher configuration; upstream source files are untouched.

Upstream is AGPL-3.0; individual model licenses can differ. See upstream's license and model information.
