// api/briefings.js
// GET: 列出 briefings/*.md（通过 GitHub Contents API）
// POST: 写入 briefings/YYYY-MM-DD-{type}.md（通过 GitHub Contents API）
const REPO = process.env.GH_REPO || 'mmmmiller5525/stock-breifing-and-dashboard';
const BRANCH = process.env.GH_BRANCH || 'main';
const TOKEN = process.env.GH_TOKEN; // fine-grained PAT, Contents: read & write

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function ghHeaders(extra = {}) {
  return {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'stock-briefing-web',
    ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
    ...extra,
  };
}

async function ghListFiles() {
  const url = `https://api.github.com/repos/${REPO}/contents/briefings?ref=${BRANCH}&t=${Date.now()}`;
  const r = await fetch(url, {
    headers: ghHeaders({ 'Cache-Control': 'no-cache' }),
    cache: 'no-store',
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`GitHub list failed: ${r.status} ${text}`);
  }
  const arr = await r.json();
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(f => f.type === 'file' && f.name.endsWith('.md'))
    .map(f => {
      const stem = f.name.replace(/\.md$/, '');
      const parts = stem.split('-');
      const date = parts.slice(0, 3).join('-');
      const type = parts.slice(3).join('-');
      // 单篇加载走 /api/file?p=<filename>&sha=<sha>，
      // 服务端用 sha 作为 cache-buster 走 GitHub API 拿真实 bytes，
      // 避免 raw.githubusercontent.com 的 CDN 缓存返回旧内容
      return {
        name: f.name,
        date,
        type,
        url: `/api/file?p=${encodeURIComponent(f.name)}&sha=${f.sha}`,
        api_url: f.url,
        sha: f.sha,
        size: f.size,
      };
    });
}

async function ghGetFileSha(filename) {
  const url = `https://api.github.com/repos/${REPO}/contents/briefings/${filename}?ref=${BRANCH}`;
  const r = await fetch(url, { headers: ghHeaders() });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub get failed: ${r.status}`);
  const j = await r.json();
  return j.sha;
}

async function ghPutFile(filename, content, message, sha) {
  const url = `https://api.github.com/repos/${REPO}/contents/briefings/${filename}`;
  const body = {
    message,
    branch: BRANCH,
    content: Buffer.from(content, 'utf8').toString('base64'),
    ...(sha ? { sha } : {}),
  };
  const r = await fetch(url, {
    method: 'PUT',
    headers: ghHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`GitHub put failed: ${r.status} ${text}`);
  }
  return r.json();
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    if (!TOKEN) return res.status(500).json({ ok: false, error: 'GH_TOKEN not configured' });
    try {
      const files = await ghListFiles();
      return res.status(200).json({ ok: true, files });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e.message || e) });
    }
  }

  if (req.method === 'POST') {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    const pushToken = process.env.BRIEFING_PUSH_TOKEN || 'miller-default-token';
    if (token !== pushToken) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    if (!TOKEN) return res.status(500).json({ ok: false, error: 'GH_TOKEN not configured' });

    const { date, type, title, content } = req.body || {};
    if (!date || !type || !content) {
      return res.status(400).json({ ok: false, error: 'missing date/type/content' });
    }

    try {
      const filename = `${date}-${type}.md`;
      const sha = await ghGetFileSha(filename);
      const msg = sha
        ? `update briefings/${filename}`
        : `add briefings/${filename}`;
      const result = await ghPutFile(filename, content, msg, sha);
      return res.status(200).json({
        ok: true,
        url: `https://raw.githubusercontent.com/${REPO}/${BRANCH}/briefings/${filename}`,
        commit: result.commit?.sha,
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e.message || e) });
    }
  }

  return res.status(405).json({ ok: false, error: 'method not allowed' });
}