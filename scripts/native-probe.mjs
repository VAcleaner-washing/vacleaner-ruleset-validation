import { appendFileSync, readFileSync } from 'node:fs';

const expectedRepository = 'VAcleaner-washing/vacleaner-ruleset-validation';
const modes = new Set(['full', 'docs-only', 'failed', 'skipped', 'cancel-window']);
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

function context() {
  requireValue(process.env.GITHUB_ACTIONS === 'true', 'Real Actions context required');
  requireValue(process.env.GITHUB_REPOSITORY === expectedRepository, 'Only the isolated repository is allowed');
  requireValue(/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? ''), 'Runner SHA required');
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  requireValue(event.repository?.full_name === expectedRepository, 'Event repository mismatch');
  if (process.env.GITHUB_EVENT_NAME === 'push') {
    requireValue(['refs/heads/main', 'refs/heads/native/no-pr-001'].includes(process.env.GITHUB_REF) && event.ref === process.env.GITHUB_REF && event.deleted === false, 'Only explicitly listed non-deleted isolated push refs are allowed');
  } else {
    requireValue(process.env.GITHUB_EVENT_NAME === 'pull_request', 'Unsupported event');
    requireValue(['opened', 'synchronize', 'reopened'].includes(event.action), 'Unsupported PR action');
    requireValue(Number.isInteger(event.number) && event.number > 0 && process.env.GITHUB_REF === `refs/pull/${event.number}/merge`, 'PR ref mismatch');
    requireValue(event.pull_request?.base?.ref === 'main' && event.pull_request.base.repo?.full_name === expectedRepository, 'PR base mismatch');
    requireValue(event.pull_request?.head?.repo?.full_name === expectedRepository, 'Fork fixture not allowed');
  }
  const mode = readFileSync(new URL('../native-probe-mode.txt', import.meta.url), 'utf8').trim();
  requireValue(modes.has(mode), 'Unknown fixture mode');
  return mode;
}

function producer(mode) {
  requireValue(process.env.PROBE_CONFIG_RESULT === 'success', 'Configuration did not succeed');
  requireValue(process.env.PROBE_MODE === mode, 'Mode output/file mismatch');
}

try {
  const command = process.argv[2];
  const mode = context();
  if (command === 'configure') {
    requireValue(Boolean(process.env.GITHUB_OUTPUT), 'Runner output file required');
    appendFileSync(process.env.GITHUB_OUTPUT, `mode=${mode}\n`);
  } else if (command === 'producer') {
    producer(mode);
  } else if (command === 'readiness') {
    producer(mode);
    requireValue(process.env.PROBE_CLASSIFY_RESULT === 'success' && process.env.PROBE_SCOPE_RESULT === 'success', 'Required fixture producer unsuccessful');
    requireValue(process.env.PROBE_HEAVY_RESULT === (mode === 'docs-only' ? 'skipped' : 'success'), 'Synthetic heavy result mismatch');
    requireValue(!['failed', 'skipped'].includes(mode), 'Intentional failed fixture or unexpected execution of skipped fixture');
    if (mode === 'cancel-window') {
      console.log('CANCEL_WINDOW_OPEN: cancel this isolated run in the Actions UI now; no cancellation becomes failure after120seconds.');
      await new Promise(resolve => setTimeout(resolve, 120_000));
      throw new Error('Cancellation was not observed; this fixture never accepts an expired cancellation window');
    }
  } else {
    throw new Error('Unknown command');
  }
  console.log(JSON.stringify({ syntheticFixtureOnly: true, command, mode, applicationQa: false }));
} catch (error) {
  console.error(`NATIVE_PROBE_REJECTED: ${error.message}`);
  process.exitCode = 1;
}
