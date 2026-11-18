/**
 * 首页：文章流（裸数组；tags 为数组；reactions={likes,dislikes,mine}；无 user 对象）
 */
(function (global) {
  'use strict';
  const { esc, timeAgo, toast } = UI;

  let state = { page: 1, loading: false, done: false, items: [] };
  let favSet = new Set();

  function cardHtml(a) {
    const tags = (a.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
    const r = a.reactions || {};
    const mine = r.mine || 0;
    const faved = favSet.has(a.id);
    return `
      <article class="card" data-id="${a.id}">
        <h3>${esc(a.title)}</h3>
        ${a.summary ? `<p class="summary">${esc(a.summary)}</p>` : ''}
        ${tags ? `<div class="tags">${tags}</div>` : ''}
        <div class="meta" style="margin-top:8px"><span>👍 ${r.likes || 0}</span><span>👎 ${r.dislikes || 0}</span><span>${timeAgo(a.created_at)}</span><span>${esc(a.category || '')}</span></div>
        <div class="action-bar">
          <button class="btn sm ${mine === 1 ? 'active' : ''}" data-act="like">👍 ${r.likes || 0}</button>
          <button class="btn sm ${mine === -1 ? 'active' : ''}" data-act="dislike">👎 ${r.dislikes || 0}</button>
          <button class="btn sm ${faved ? 'active' : ''}" data-act="fav">${faved ? '★ 已收藏' : '☆ 收藏'}</button>
        </div>
      </article>`;
  }

  function render(container) {
    if (!state.items.length && state.done) {
      container.innerHTML = UI.emptyState('暂无文章');
      return;
    }
    container.innerHTML =
      `<div class="section-title"><span>最新文章</span></div>` +
      state.items.map(cardHtml).join('') +
      `<div class="load-more" id="homeMore"></div>`;
    bind(container);
  }

  function bind(container) {
    container.querySelectorAll('.card').forEach((card) => {
      const id = card.dataset.id;
      card.querySelector('[data-act="like"]').onclick = (e) => react(e, id, 1);
      card.querySelector('[data-act="dislike"]').onclick = (e) => react(e, id, -1);
      card.querySelector('[data-act="fav"]').onclick = (e) => toggleFav(e, id);
      card.onclick = (e) => {
        if (e.target.closest('[data-act]')) return;
        openDetail(id);
      };
    });
    const more = container.querySelector('#homeMore');
    if (more && !state.done) more.innerHTML = `<div class="spinner"></div>`;
  }

  async function react(e, id, value) {
    if (!guardLogin()) return;
    try {
      const r = await Api.articles.react(id, value);
      const item = state.items.find((x) => x.id == id);
      if (item) item.reactions = r;
      render(document.getElementById('page-home'));
    } catch (err) {
      toast(err.message, 'danger');
    }
  }

  async function openDetail(id) {
    const modal = UI.modal({ title: '文章详情', width: '640px', bodyHtml: '<div class="spinner"></div>' });
    try {
      const a = await Api.articles.detail(id);
      const r = a.reactions || {};
      modal.box.querySelector('.modal-body').innerHTML = `
        <div class="detail-head">
          <h2>${esc(a.title)}</h2>
          <div class="meta">${esc(a.category || '')} · ${timeAgo(a.created_at)} · 👁 ${a.views || 0}</div>
        </div>
        <div class="detail-body">${esc(a.body || a.summary || '')}</div>
        <div class="action-bar">
          <button class="btn sm">👍 ${r.likes || 0}</button>
          <button class="btn sm">👎 ${r.dislikes || 0}</button>
        </div>`;
    } catch (err) {
      modal.box.querySelector('.modal-body').innerHTML = `<p class="confirm-msg">${esc(err.message)}</p>`;
    }
  }

  function guardLogin() {
    if (!Store.isLogin()) { toast('请先登录', 'danger'); App.switchTab('me'); return false; }
    return true;
  }

  async function toggleFav(e, id) {
    if (!guardLogin()) return;
    try {
      const r = await Api.articles.favorite(id);
      if (r.faved) favSet.add(id); else favSet.delete(id);
      render(document.getElementById('page-home'));
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function loadFavState() {
    if (!Store.isLogin()) return;
    try {
      const f = await Api.user.favorites();
      (f.articles || []).forEach((id) => favSet.add(id));
    } catch (e) {}
  }

  async function loadMore() {
    if (state.loading || state.done) return;
    state.loading = true;
    try {
      const list = await Api.articles.list({ page: state.page });
      if (!list || !list.length) state.done = true;
      else { state.items = state.items.concat(list); state.page++; }
    } catch (err) {
      toast(err.message, 'danger');
    } finally {
      state.loading = false;
      render(document.getElementById('page-home'));
    }
  }

  window.addEventListener('scroll', () => {
    if (App.getCurrentTab() !== 'home') return;
    if (state.loading || state.done) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) loadMore();
  });

  Pages.home = {
    onShow() {
      const c = document.getElementById('page-home');
      if (!state.items.length) {
        c.innerHTML = `<div class="section-title"><span>最新文章</span></div><div class="load-more"><div class="spinner"></div></div>`;
        loadFavState().then(loadMore);
      } else { render(c); }
    },
  };
})(window);
