// api/notify.js
// POST: 触发 Server酱 推送微信
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { title, desp } = req.body || {};
  if (!title || !desp) return res.status(400).json({ ok: false, error: 'missing title/desp' });

  const sct = process.env.SCT_KEY;
  if (!sct) return res.status(500).json({ ok: false, error: 'SCT_KEY not configured' });

  try {
    const body = new URLSearchParams({ title, desp });
    const r = await fetch(`https://sctapi.ftqq.com/${sct}.send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const j = await r.json();
    return res.status(200).json({ ok: true, serverChan: j });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}