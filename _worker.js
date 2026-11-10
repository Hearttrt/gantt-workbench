/**
 * Cloudflare Pages Advanced Mode Worker (_worker.js)
 * 作用：
 * 1. 拦截 /api/schedule 请求，读写绑定的 Cloudflare KV 命名空间 (变量名：SCHEDULE_KV)
 * 2. 其他所有静态页面请求直接交由 Cloudflare Pages 静态资产引擎 (env.ASSETS) 极速返回
 * 优点：无论是网页端直接拖拽上传 public 文件夹，还是使用 Git / Wrangler 部署，均自动生效！
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Content-Type': 'application/json; charset=utf-8'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/schedule') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      // 检查是否已在 Cloudflare Pages 后台绑定 SCHEDULE_KV
      if (!env.SCHEDULE_KV) {
        return new Response(
          JSON.stringify({
            ok: false,
            kvBound: false,
            message: '未检测到 SCHEDULE_KV 绑定。请在 Cloudflare Pages -> Settings -> Bindings (Functions) 中添加 KV 命名空间绑定，变量名设为 SCHEDULE_KV。'
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      const workspace = (url.searchParams.get('workspace') || 'default').trim().slice(0, 64) || 'default';
      const kvKey = `schedule_v2:${workspace}`;

      try {
        if (request.method === 'GET') {
          const raw = await env.SCHEDULE_KV.get(kvKey);
          const data = raw ? JSON.parse(raw) : null;
          return new Response(
            JSON.stringify({
              ok: true,
              kvBound: true,
              workspace,
              data
            }),
            { status: 200, headers: CORS_HEADERS }
          );
        }

        if (request.method === 'POST') {
          const body = await request.json();
          const payload = {
            workspace,
            tasks: Array.isArray(body.tasks) ? body.tasks : [],
            dailyNotes: body.dailyNotes && typeof body.dailyNotes === 'object' ? body.dailyNotes : {},
            updatedAt: body.updatedAt || new Date().toISOString()
          };
          await env.SCHEDULE_KV.put(kvKey, JSON.stringify(payload));
          return new Response(
            JSON.stringify({
              ok: true,
              kvBound: true,
              workspace,
              updatedAt: payload.updatedAt
            }),
            { status: 200, headers: CORS_HEADERS }
          );
        }

        return new Response(
          JSON.stringify({ ok: false, error: 'Method Not Allowed' }),
          { status: 405, headers: CORS_HEADERS }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ ok: false, kvBound: true, error: String(err && err.message ? err.message : err) }),
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }

    // 静态网页资源请求直接由 Cloudflare Pages ASSETS 托管返回
    return env.ASSETS.fetch(request);
  }
};
