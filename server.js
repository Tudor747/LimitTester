import express from 'express';
import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
for (const field of ['cpuMs', 'memoryMbPerRequest', 'holdMs', 'responseKb']) {
  if (!Number.isFinite(config[field]) || config[field] < 0) throw new Error(field + ' must be a non-negative number');
}
const app = express();
app.get('/', (req, res) => {
  const memory = Buffer.alloc(Math.ceil(config.memoryMbPerRequest * 1024 * 1024), 1);
  const until = performance.now() + config.cpuMs;
  while (performance.now() < until) { /* Deliberate CPU work. */ }
  setTimeout(() => {
    res.set('X-Allocated-Bytes', String(memory.length));
    res.type('application/octet-stream').send(Buffer.alloc(Math.ceil(config.responseKb * 1024), 120));
  }, config.holdMs);
});
app.listen(3000, '0.0.0.0', () => console.log('Test server listening on port 3000'));
