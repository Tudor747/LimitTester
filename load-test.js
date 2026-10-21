import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
for (const field of ['requestsPerMinute', 'durationSeconds', 'maxConcurrency']) {
  if (!Number.isSafeInteger(config[field]) || config[field] < 1) throw new Error(field + ' must be a positive integer');
}
const url = process.env.TARGET_URL || 'http://localhost:3000/';
const pending = new Set();
let sent = 0, completed = 0, errors = 0, skipped = 0, bytes = 0;
let stopped = false;
process.on('SIGINT', () => { stopped = true; });
const started = performance.now();
const interval = 60000 / config.requestsPerMinute;
const duration = config.durationSeconds * 1000;
console.log('Sending ' + config.requestsPerMinute + ' requests/min to ' + url + ' for ' + config.durationSeconds + 's');
async function request() {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    bytes += (await res.arrayBuffer()).byteLength;
    if (res.ok) completed++; else errors++;
  } catch { errors++; }
}
while (!stopped && performance.now() - started < duration) {
  if (pending.size < config.maxConcurrency) {
    sent++;
    const job = request();
    pending.add(job);
    job.finally(() => pending.delete(job));
  } else { skipped++; }
  await sleep(Math.min(interval, Math.max(0, duration - (performance.now() - started))));
}
await Promise.all(pending);
console.log({ sent, completed, errors, skipped, receivedMB: +(bytes / 1024 / 1024).toFixed(2) });
if (errors) process.exitCode = 1;
