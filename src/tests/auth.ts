import { assertEquals } from 'https://deno.land/std@0.200.0/testing/asserts.ts';
import { createApp }    from '../bootstrap.ts';

const TEST_PORT = 48129;

Deno.test({
  name: '🧪 Auth endpoint: 400 on bad payload, 401 on wrong creds',
  fn: async () => {
    // 1) Spin up a fresh server for this test
    const app = await createApp();
    await app.listen(TEST_PORT);

    try {
      // 2) Bad payload → 400
      {
        const res = await fetch(`http://localhost:${TEST_PORT}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foo: 'bar' }),
        });
        assertEquals(res.status, 400);
        const body = await res.json();
        assertEquals(body.error, 'Bad Request');
      }

      // 3) Wrong credentials → 401
      {
        const res = await fetch(`http://localhost:${TEST_PORT}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: 'nope', password: 'wrongpass' }),
        });
        assertEquals(res.status, 401);
        const body = await res.json();
        assertEquals(body.error, 'Unauthorized');
      }
    } finally {
      // 4) Tear it down immediately to avoid leaking the listener
      await app.close();
    }
  },
  // leave sanitizers on, since we're not leaking
});
