/**
 * Temporarily add the missing browser download path to VoiceStudio's Save as button.
 * Only the built web UI contains this change. The upstream source is restored after
 * build:web so subsequent `git pull --ff-only` commands can work normally.
 *
 * Remove this workaround when upstream implements browser saves itself.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SAVE_BUTTON = 'electron/src/renderer/src/components/save-audio-button.tsx';

function replaceExactlyOnce(content, original, replacement) {
  const first = content.indexOf(original);
  if (first === -1 || content.indexOf(original, first + original.length) !== -1) {
    throw new Error(`VoiceStudio SaveAudioButton has changed. Cannot safely apply browser-download fix (expected exactly one: ${JSON.stringify(original)}).`);
  }
  return content.slice(0, first) + replacement + content.slice(first + original.length);
}

function patchSaveButton(source) {
  const changes = [
    [
      "import { saveExport } from '@/lib/export-history';",
      "import { saveExport } from '@/lib/export-history';\nimport { apiFetch } from '@/lib/api/client';\nimport { saveLocalFile } from '@/lib/local-export';",
    ],
    [
      '    if (!url || !bridge) return;',
      '    if (!url) return;',
    ],
    [
      '      const saved = await saveExport(url, suggestedName);',
      `      if (!bridge) {
        // Both the latest take and history provide an audioUrl() backend path.
        // apiFetch adds the configured API base and includes browser auth.
        const pathname = new URL(url, window.location.href).pathname;
        const audioRoute = pathname.lastIndexOf('/audio/');
        if (audioRoute < 0) throw new Error('Invalid audio download URL');
        const response = await apiFetch(pathname.slice(audioRoute));
        await saveLocalFile(await response.blob(), suggestedName);
        return;
      }
      const saved = await saveExport(url, suggestedName);`,
    ],
    [
      'disabled={disabled || saving || !url || !bridge}',
      'disabled={disabled || saving || !url}',
    ],
  ];
  return changes.reduce((content, [original, replacement]) =>
    replaceExactlyOnce(content, original, replacement), source);
}

function buildWeb({ appDir = path.resolve(__dirname, '..', 'app'), runBuild } = {}) {
  const file = path.join(appDir, SAVE_BUTTON);
  const original = fs.readFileSync(file, 'utf8');
  const patched = patchSaveButton(original); // Validate everything before touching the source.
  fs.writeFileSync(file, patched);
  try {
    const result = (runBuild ?? (() => spawnSync(process.execPath, ['run', 'build:web'], {
      cwd: appDir,
      stdio: 'inherit',
    })))();
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`VoiceStudio web build failed (${result.signal || result.status}).`);
    }
  } finally {
    fs.writeFileSync(file, original);
  }
}

module.exports = { patchSaveButton, buildWeb, SAVE_BUTTON };

if (require.main === module) {
  try {
    buildWeb();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
