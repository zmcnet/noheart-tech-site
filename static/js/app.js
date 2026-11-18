/**
 * 主控制器：Tab 切换、顶部用户态渲染、全局搜索、登录态初始化。
 * 各页面在 Pages 对象中注册 { mount(container), onShow() }。
 */
(function (global) {
  'use strict';

  const Pages = global.Pages || (global.Pages = {});
  let currentTab = 'home';

  const el = {
    host: document.getElementById('pageHost'),
    tabs: document.querySelectorAll('.tab'),
    topbarUser: document.getElementById('topbarUser'),
    search: document.getElementById('globalSearch'),
  };

  function renderTopbarUser() {
    const u = global.Store.getUser();
    if (u) {
      el.topbarUser.innerHTML =
        `<span class="uname">${UI.esc(u.nickname || u.username)}</span>` +
        UI.avatar(u);
    } else {
      el.topbarUser.innerHTML = `<button class="btn sm" data-go="me">登录</button>`;
      el.topbarUser.querySelector('[data-go]').onclick = () => switchTab('me');
    }
  }

  function switchTab(name) {
    currentTab = name;
    el.tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    el.host.querySelectorAll('.page').forEach((p) => {
      p.classList.toggle('hidden', p.dataset.page !== name);
    });
    const page = Pages[name];
    if (page && page.onShow) {
      try { page.onShow(); } catch (e) { console.error(e); }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function init() {
    // Tab 点击
    el.tabs.forEach((t) => {
      t.addEventListener('click', () => switchTab(t.dataset.tab));
    });

    // 顶部用户态
    renderTopbarUser();
    global.Store.onChange(renderTopbarUser);

    // 登录态续期（有 token 则拉取最新用户）
    if (global.Store.isLogin()) {
      global.Store.refresh().catch(() => {});
    }

    // 全局搜索（回车触发）
    el.search.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        // 搜索优先进讨论，其次首页
        switchTab('forum');
        if (Pages.forum && Pages.forum.search) Pages.forum.search(q);
        UI.toast('搜索：' + q);
      }
    });

    // 首次进入首页
    if (Pages.home && Pages.home.onShow) Pages.home.onShow();
  }

  global.App = { switchTab, renderTopbarUser, getCurrentTab: () => currentTab };
  document.addEventListener('DOMContentLoaded', init);
})(window);
