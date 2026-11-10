/**
 * VAQENO — وسيط إشعارات آمن
 * التوكن يبقى هنا على سيرفر Cloudflare فقط، ولا يظهر في كود الموقع أبداً.
 *
 * المتغيرات المطلوبة (Settings → Variables and Secrets):
 *   TELEGRAM_TOKEN  = توكن بوت تيليجرام (سري)
 *   CHAT_ID         = 8814437947
 * أو بدلاً منها:
 *   NTFY_TOPIC      = اسم موضوع في ntfy.sh (بدون حساب)
 */

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': 'https://vaqenoo.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }

    // اسمح فقط لطلبات قادمة من موقعك
    const origin = request.headers.get('Origin') || '';
    const referer = request.headers.get('Referer') || '';
    const fromSite = origin.endsWith('vaqenoo.com') || referer.includes('vaqenoo.com');
    if (origin && !fromSite) {
      return new Response('Forbidden', { status: 403, headers: cors });
    }

    let data = {};
    try {
      data = await request.json();
    } catch (e) {
      data = {};
    }

    const text = String(data.text || '').trim().slice(0, 1500);
    if (!text) {
      return new Response(JSON.stringify({ ok: false, error: 'empty' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    let ok = false;

    // 1) تيليجرام
    if (env.TELEGRAM_TOKEN && env.CHAT_ID) {
      const res = await fetch(
        'https://api.telegram.org/bot' + env.TELEGRAM_TOKEN + '/sendMessage',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.CHAT_ID,
            text: text,
            disable_web_page_preview: true
          })
        }
      );
      ok = res.ok;
    }
    // 2) ntfy.sh (بديل بدون حساب)
    else if (env.NTFY_TOPIC) {
      const res = await fetch('https://ntfy.sh/' + env.NTFY_TOPIC, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: text
      });
      ok = res.ok;
    }

    return new Response(JSON.stringify({ ok: ok }), {
      status: ok ? 200 : 502,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};
