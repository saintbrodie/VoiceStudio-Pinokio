const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { patchSaveButton, buildWeb, SAVE_BUTTON } = require('../scripts/build-web-with-browser-download');

const upstreamFixture = `import { saveExport } from '@/lib/export-history';

  const save = async () => {
    if (!url || !bridge) return;
    setSaving(true);
    try {
      const saved = await saveExport(url, suggestedName);
      if (!saved) return;
    } finally {
      setSaving(false);
    }
  };
  return <Button disabled={disabled || saving || !url || !bridge} />;
`;

test('browser save is enabled and uses authenticated API and local-export helper', () => {
  const result = patchSaveButton(upstreamFixture);
  assert.ok(result.includes("import { saveLocalFile } from '@/lib/local-export';"));
  assert.ok(result.includes('const response = await apiFetch(pathname.slice(audioRoute));'));
  assert.ok(result.includes('await saveLocalFile(await response.blob(), suggestedName);'));
  assert.ok(result.includes('if (!bridge) {'));
  assert.ok(result.includes('disabled={disabled || saving || !url}'));
  assert.ok(!result.includes('if (!url || !bridge) return;'));
  assert.ok(result.includes('const saved = await saveExport(url, suggestedName);'));
});

test('fails closed when upstream component changes', () => {
  assert.throws(() => patchSaveButton(upstreamFixture.replace('if (!url || !bridge) return;', 'if (!url) return;')), /has changed/);
  assert.throws(() => patchSaveButton(upstreamFixture + upstreamFixture), /has changed/);
});

for (const [description, result, error] of [
  ['success', { status: 0 }, null],
  ['build failure', { status: 1 }, /web build failed/],
]) {
  test(`restores the pristine upstream source after ${description}`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-build-'));
    const appDir = path.join(root, 'app');
    const target = path.join(appDir, SAVE_BUTTON);
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, upstreamFixture);
      const runBuild = () => {
        const content = fs.readFileSync(target, 'utf8');
        assert.match(content, /await saveLocalFile/);
        return result;
      };
      if (error) assert.throws(() => buildWeb({ appDir, runBuild }), error);
      else buildWeb({ appDir, runBuild });
      assert.equal(fs.readFileSync(target, 'utf8'), upstreamFixture);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}
