import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { createServer } from 'node:http';

test('health endpoint returns ok', async () => {
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(response.status, 200);
    const json = await response.json();
    assert.equal(json.ok, true);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
