/**
 * 登录态管理：JWT 存 localStorage，提供用户信息与事件订阅。
 * 迁移小程序时把 localStorage 换成 wx.getStorageSync 即可。
 */
(function (global) {
  'use strict';

  const TOKEN_KEY = 'noheart_token';
  const USER_KEY = 'noheart_user';
  const listeners = new Set();

  const Store = {
    getToken() {
      return localStorage.getItem(TOKEN_KEY) || null;
    },
    setToken(t) {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    },
    getUser() {
      try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    setUser(u) {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_KEY);
    },
    isLogin() {
      return !!this.getToken();
    },
    // 登录成功后写入 token + user
    login(token, user) {
      this.setToken(token);
      this.setUser(user);
      this._emit();
    },
    logout() {
      this.setToken(null);
      this.setUser(null);
      this._emit();
    },
    // 拉取最新用户信息
    async refresh() {
      if (!this.isLogin()) return null;
      try {
        const user = await global.Api.auth.me();
        this.setUser(user);
        this._emit();
        return user;
      } catch (e) {
        // token 失效
        this.logout();
        return null;
      }
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    _emit() {
      const u = this.getUser();
      listeners.forEach((fn) => {
        try {
          fn(u);
        } catch (e) {}
      });
    },
  };

  global.Store = Store;
})(window);
