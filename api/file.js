// api/file.js
// 代理 GitHub 文件内容：避免 raw.githubusercontent.com CDN 缓存问题
// GET /api/file?p=<filename>&sha=<sha>
const REPO = process.env.GH_REPO || 'mmmmiller5525/stock-breifing-and-dashboard';
const BRANCH = process.env.GH_BRANCH || 'main';
const TOKEN = process.env.GH_TOKEN;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const { p, sha } = req.query || {};
  if (!p || typeof p !== 'string') return res.status(400).send('missing p');

  // 安全检查：只允许读取 briefings/ 下的 .md 文件
  if (p.includes('..') || !p.endsWith('.md')) {
    return res.status(400).send('bad path');
  }

  const url = `https://api.github.com/repos/${REPO}/contents/briefings/${encodeURIComponent(p)}?ref=${BRANCH}&t=${Date.now()}`;
  try {
    const r = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${TOKEN}`,
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });
    if (!r.ok) {
      return res.status(r.status).send(`GitHub fetch failed: ${r.status}`);
    }
    const j = await r.json();
    if (j.encoding !== 'base64' || !j.content) {
      return res.status(500).send('unexpected encoding');
    }
    // GitHub 返回 base64 是带换行的，去掉再 decode
    const b64 = j.content.replace(/\n/g, '');
    const buf = Buffer.from(b64, 'base64');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).send(buf);
  } catch (e) {
    res.status(500).send(String(e.message || e));
  }
}