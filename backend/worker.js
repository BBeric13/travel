/**
 * 高加索行程 · 三人共享记账后端
 * Cloudflare Worker + Workers KV，免费额度对三个人的记账量绰绰有余。
 *
 * 绑定要求：KV 命名空间的变量名必须填 TRIPS
 *
 * 接口（与页面里的同步设置一一对应）：
 *   GET  /trips/<行程码>.json   → 返回记录数组，没有记录时返回 []
 *   PUT  /trips/<行程码>.json   → 覆盖写入记录数组
 * 任何域名下的页面都能调用（已带 CORS）。
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

const MAX_BYTES = 256 * 1024;
const CODE_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, CORS)
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const matched = url.pathname.match(/^\/trips\/([^/]+?)(?:\.json)?$/);
    if (!matched) {
      return json({ error: 'not_found', hint: '正确路径形如 /trips/你的行程码.json' }, 404);
    }

    if (!env.TRIPS) {
      return json({ error: 'missing_binding', hint: '请在 Worker 设置里绑定 KV 命名空间，变量名填 TRIPS' }, 500);
    }

    const code = decodeURIComponent(matched[1]);
    if (!CODE_PATTERN.test(code)) {
      return json({ error: 'bad_code', hint: '行程码只能用字母、数字、下划线和连字符，长度 4–64' }, 400);
    }

    const key = 'trip:' + code;

    if (request.method === 'GET' || request.method === 'HEAD') {
      const raw = await env.TRIPS.get(key);
      return new Response(raw || '[]', {
        headers: Object.assign({
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }, CORS)
      });
    }

    if (request.method === 'PUT' || request.method === 'POST') {
      const body = await request.text();
      if (body.length > MAX_BYTES) {
        return json({ error: 'too_large', hint: '记录过多，建议先把历史记录导出备份' }, 413);
      }

      let data;
      try {
        data = JSON.parse(body);
      } catch (err) {
        return json({ error: 'bad_json' }, 400);
      }

      /* 兼容两种格式：旧版是记录数组，新版是 { expenses, checks, rates } */
      const isLegacy = Array.isArray(data);
      const isCurrent = data && typeof data === 'object' && Array.isArray(data.expenses);
      if (!isLegacy && !isCurrent) {
        return json({ error: 'bad_payload', hint: '请求体需要是记录数组，或含 expenses 数组的对象' }, 400);
      }

      await env.TRIPS.put(key, JSON.stringify(data));
      return json({
        ok: true,
        count: (isLegacy ? data : data.expenses).length,
        savedAt: new Date().toISOString()
      });
    }

    return json({ error: 'method_not_allowed' }, 405);
  }
};
