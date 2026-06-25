// api/briefings.js
// POST: agent 推送简报；GET: 列出所有简报
import { put, list } from '@vercel/blob';

const PUSH_TOKEN = process.env.BRIEFING_PUSH_TOKEN || 'miller-default-token';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'briefings/' });
      const files = blobs
        .map(b => {
          const parts = b.pathname.replace(/^briefings\//, '').replace(/\.md$/, '').split('-');
          if (parts.length < 4) return null;
          const date = parts.slice(0, 3).join('-');
          const type = parts.slice(3).join('-');
          return { name: b.pathname.split('/').pop(), date, type, url: b.url, title: `简报 · ${date}` };
        })
        .filter(Boolean);
      return res.status(200).json({ ok: true, files });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e) });
    }
  }

  if (req.method === 'POST') {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (token !== PUSH_TOKEN) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const { date, type, title, content } = req.body || {};
    if (!date || !type || !content) {
      return res.status(400).json({ ok: false, error: 'missing date/type/content' });
    }

    try {
      const filename = `briefings/${date}-${type}.md`;
      const blob = await put(filename, content, {
        access: 'public',
        contentType: 'text/markdown; charset=utf-8',
        addRandomSuffix: false,
      });
      return res.status(200).json({ ok: true, url: blob.url, pathname: blob.pathname });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e) });
    }
  }

  return res.status(405).json({ ok: false, error: 'method not allowed' });
}