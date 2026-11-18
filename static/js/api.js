/**
 * API 统一封装层（严格对齐后端 server/api/index.php）
 * 返回结构：{code:0,msg,data} —— data 为业务数据（列表是裸数组，非 {list}）。
 * 迁移小程序：替换 request() 内部 fetch 为 wx.request 即可。
 */
(function (global) {
  'use strict';

  const BASE = (window.NOHEART_CONFIG && window.NOHEART_CONFIG.apiBase) || '/api';

  function getToken() {
    return global.Store ? global.Store.getToken() : null;
  }

  async function request(method, path, body, qs) {
    let url = BASE + '/' + path.replace(/^\/+/, '');
    if (qs && Object.keys(qs).length) {
      const sp = new URLSearchParams();
      Object.entries(qs).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') sp.set(k, v);
      });
      const s = sp.toString();
      if (s) url += '?' + s;
    }
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const init = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    let resp;
    try {
      resp = await fetch(url, init);
    } catch (e) {
      throw new Error('网络错误，请检查网络连接');
    }
    let json;
    try {
      json = await resp.json();
    } catch (e) {
      throw new Error('服务端返回异常 (HTTP ' + resp.status + ')');
    }
    if (!resp.ok || json.code !== 0) {
      const msg = (json && json.msg) || ('请求失败 (HTTP ' + resp.status + ')');
      const err = new Error(msg);
      err.code = json && json.code;
      throw err;
    }
    return json.data;
  }

  const Api = {
    BASE,
    get: (p, qs) => request('GET', p, undefined, qs),
    post: (p, body, qs) => request('POST', p, body || {}, qs),
    put: (p, body, qs) => request('PUT', p, body || {}, qs),
    del: (p, qs) => request('DELETE', p, undefined, qs),

    // ============ 认证 ============
    auth: {
      // 步进式第一步：检测账户是否存在（手机号/用户名）
      check: (account) => Api.post('auth/check', { account }),
      // 发送验证码（极验占位 geetest）
      sendCode: (phone, purpose, geetest) =>
        Api.post('auth/send-code', { phone, purpose, geetest: geetest || [] }),
      // 登录：type = password | code
      login: (account, credential, type) =>
        Api.post('auth/login', { account, [type === 'code' ? 'code' : 'password']: credential, type }),
      // 注册：手机号 + 验证码 + 账户名 + 密码
      register: (phone, code, username, password) =>
        Api.post('auth/register', { phone, code, username, password }),
      me: () => Api.get('auth/me'),
      logout: () => Api.post('auth/logout'),
    },

    // ============ 文章（首页） ============
    articles: {
      // 返回裸数组
      list: (qs) => Api.get('articles', qs),
      detail: (id) => Api.get('articles/detail/' + id),
      // 点赞/点踩：value = 1 赞 / -1 踩
      react: (id, value) => Api.post('articles/like/' + id, { value }),
      // 收藏 toggle（POST），返回 {faved}
      favorite: (id) => Api.post('articles/favorite/' + id),
    },

    // ============ ROM ============
    roms: {
      // 返回裸数组；facets 取筛选项
      list: (qs) => Api.get('roms', qs),
      facets: () => Api.get('roms/facets'),
      detail: (id) => Api.get('roms/detail/' + id),
      // 收藏 toggle（POST），返回 {faved}
      toggleFav: (id) => Api.post('roms/favorite/' + id),
      // 订阅 toggle（POST），返回 {subscribed}
      toggleSub: (id) => Api.post('roms/subscribe/' + id),
    },

    // ============ 论坛 ============
    boards: {
      list: () => Api.get('forum/boards'),
    },
    posts: {
      // 返回裸数组；board 参数筛选
      list: (qs) => Api.get('forum/posts', qs),
      // 详情：forum/post/{id}
      detail: (id) => Api.get('forum/post/' + id),
      create: (boardId, content) => Api.post('forum/posts', { board_id: boardId, content }),
      // 点赞：value = 1/-1
      react: (id, value) => Api.post('forum/post/' + id + '/like', { value }),
      // 评论：parent_id 一级id(0=一级)，reply_to 被回复用户id
      comment: (id, content, parentId, replyTo) =>
        Api.post('forum/post/' + id + '/comments', {
          content,
          parent_id: parentId || 0,
          reply_to: replyTo || 0,
        }),
      // 评论列表（两级，含 replies）
      comments: (id) => Api.get('forum/post/' + id + '/comments'),
    },

    // ============ 用户中心 ============
    user: {
      profile: (fields) => Api.post('user/profile', fields),
      // 我的收藏（仅 roms id 数组）
      favorites: () => Api.get('user/favorites'),
      // 通知：返回 {list, unread}
      notifications: (qs) => Api.get('user/notifications', qs),
      readAll: () => Api.post('user/notifications', { read: 'all' }),
    },
  };

  global.Api = Api;
})(window);
