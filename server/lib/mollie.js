/* ============================================================
   Mollie, over plain fetch. No SDK — two calls is not worth a dependency.
   ============================================================ */

const BASE = 'https://api.mollie.com/v2';

function key() {
  const k = process.env.MOLLIE_API_KEY?.trim();
  if (!k) throw new Error('MOLLIE_API_KEY is not set.');
  return k;
}

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${key()}`,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Mollie puts the useful part in detail; never leak the key.
    throw new Error(payload.detail ?? `Mollie returned ${res.status}.`);
  }
  return payload;
}

export function createPayment({ amount, description, redirectUrl, webhookUrl, metadata }) {
  return call('/payments', {
    method: 'POST',
    body: {
      amount,
      description: description.slice(0, 255),
      redirectUrl,
      // Mollie rejects localhost webhooks, so omit rather than fail the sale.
      ...(webhookUrl && !/localhost|127\.0\.0\.1/.test(webhookUrl) ? { webhookUrl } : {}),
      metadata
    }
  });
}

export function getPayment(id) {
  if (!/^tr_[A-Za-z0-9]+$/.test(id ?? '')) throw new Error('That is not a payment id.');
  return call(`/payments/${id}`);
}
