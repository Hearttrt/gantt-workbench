/**
 * Cloudflare Pages Functions (/functions/api/schedule.js)
 * 对应路由：/api/schedule
 * 绑定 KV 变量名：SCHEDULE_KV
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Content-Type': 'application/json; charset=utf-8'
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!env.SCHEDULE_KV) {
    return new Response(
      JSON.stringify({
        ok: false,
        kvBound: false,
        message: '未检测到 SCHEDULE_KV 绑定，请在 Cloudflare Pages -> Settings -> Bindings 中绑定 SCHEDULE_KV。'
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  }

  const workspace = (url.searchParams.get('workspace') || 'default').trim().slice(0, 64) || 'default';
  const kvKey = `schedule_v2:${workspace}`;

  try {
    if (request.method === 'GET') {
      const raw = await env.SCHEDULE_KV.get(kvKey);
      return new Response(
        JSON.stringify({
          ok: true,
          kvBound: true,
          workspace,
          data: raw ? JSON.parse(raw) : null
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

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: CORS_HEADERS
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, kvBound: true, error: String(err && err.message ? err.message : err) }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
