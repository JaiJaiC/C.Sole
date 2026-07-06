/**
 * C.Sole Visit Tracker — Cloudflare Worker
 *
 * Deploy: npx wrangler deploy
 * (Requires: Cloudflare account + Workers paid/unpaid plan)
 *
 * Endpoints:
 *   POST /api/visit  — record a visit
 *   GET  /api/visits?pwd=xxx  — admin: fetch all records
 *   GET  /api/wechat-auth     — WeChat OAuth entry (optional, needs WECHAT_APP_ID)
 *   GET  /api/wechat-callback — WeChat OAuth callback
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // ─── Record a visit ──────────────────────────────────────
    if (path === '/api/visit' && request.method === 'POST') {
      try {
        const body = await request.json();
        const visits = JSON.parse(await env.VISITS.get('visits', 'json') || '[]');

        visits.push({
          vid:       body.vid       || '',
          isWeChat:  body.isWeChat  || false,
          ua:        body.ua        || '',
          referrer:  body.referrer  || '',
          url:       body.url       || '',
          screen:    body.screen    || '',
          lang:      body.lang      || '',
          timezone:  body.timezone  || '',
          wxNick:    body.wxNick    || '',
          wxAvatar:  body.wxAvatar  || '',
          ip:        request.headers.get('cf-connecting-ip') || '',
          country:   request.cf?.country  || '',
          city:      request.cf?.city     || '',
          timestamp: Date.now(),
        });

        // Keep max 5000 records
        if (visits.length > 5000) visits.splice(0, visits.length - 5000);

        await env.VISITS.put('visits', JSON.stringify(visits));
        return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
    }

    // ─── Admin: fetch visits ─────────────────────────────────
    if (path === '/api/visits' && request.method === 'GET') {
      const pwd = url.searchParams.get('pwd');
      if (pwd !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Incorrect password' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      const visits = JSON.parse(await env.VISITS.get('visits', 'json') || '[]');
      return new Response(JSON.stringify(visits), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ─── WeChat OAuth entry (optional) ────────────────────────
    if (path === '/api/wechat-auth' && env.WECHAT_APP_ID) {
      const redirectUri = url.origin + '/api/wechat-callback';
      const state = url.searchParams.get('to') || (url.origin + '/');
      const wxUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?' +
        'appid=' + env.WECHAT_APP_ID +
        '&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&response_type=code' +
        '&scope=snsapi_userinfo' +
        '&state=' + encodeURIComponent(state) +
        '#wechat_redirect';
      return Response.redirect(wxUrl, 302);
    }

    // ─── WeChat OAuth callback ────────────────────────────────
    if (path === '/api/wechat-callback' && env.WECHAT_APP_ID && env.WECHAT_APP_SECRET) {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state') || (url.origin + '/');
      if (!code) return Response.redirect(state, 302);

      try {
        // Exchange code for access_token
        const tokenRes = await fetch(
          'https://api.weixin.qq.com/sns/oauth2/access_token?' +
          'appid=' + env.WECHAT_APP_ID +
          '&secret=' + env.WECHAT_APP_SECRET +
          '&code=' + code +
          '&grant_type=authorization_code'
        );
        const tokenData = await tokenRes.json();
        if (tokenData.errcode) throw new Error(tokenData.errmsg);

        // Get user info
        const userRes = await fetch(
          'https://api.weixin.qq.com/sns/userinfo?' +
          'access_token=' + tokenData.access_token +
          '&openid=' + tokenData.openid +
          '&lang=zh_CN'
        );
        const userData = await userRes.json();
        if (userData.errcode) throw new Error(userData.errmsg);

        // Store visit with WeChat info
        const visits = JSON.parse(await env.VISITS.get('visits', 'json') || '[]');
        visits.push({
          vid:       'wx_' + tokenData.openid,
          isWeChat:  true,
          wxNick:    userData.nickname  || '',
          wxAvatar:  userData.headimgurl || '',
          ua:        request.headers.get('user-agent') || '',
          ip:        request.headers.get('cf-connecting-ip') || '',
          country:   userData.country   || '',
          city:      userData.city      || '',
          timestamp: Date.now(),
        });
        if (visits.length > 5000) visits.splice(0, visits.length - 5000);
        await env.VISITS.put('visits', JSON.stringify(visits));
      } catch (e) {
        // OAuth failed, still record basic visit below
      }

      return Response.redirect(state, 302);
    }

    return new Response('C.Sole Visit Tracker API', {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
  },
};
