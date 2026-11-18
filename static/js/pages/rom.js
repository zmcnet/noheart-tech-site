/**
 * ROM 页：裸数组列表 + facets 筛选项 + 详情（下载开关/收藏/订阅 toggle）。
 */
(function (global) {
  'use strict';
  const { esc, timeAgo, toast } = UI;

  let state = {
    page: 1, loading: false, done: false, items: [],
    filters: { category: '', android: '', device: '' },
    facets: { categories: [], android: [], devices: [] },
  };
  let favSet = new Set(); // 已收藏 rom id
  let subSet = new Set(); // 已订阅 rom id

  function chipGroup(values, key, active) {
    const all = `<span class="chip ${!active ? 'active' : ''}" data-f="${key}" data-v="">全部</span>`;
    const rest = values.map((v) => `<span class="chip ${v == active ? 'active' : ''}" data-f="${key}" data-v="${esc(v)}">${esc(v)}</span>`).join('');
    return all + rest;
  }

  function filtersHtml() {
    return `
      <div class="filter-bar">${chipGroup(state.facets.categories, 'category', state.filters.category)}</div>
      <div class="filter-bar">${chipGroup(state.facets.android, 'android', state.filters.android)}</div>
      <div class="filter-bar">${chipGroup(state.facets.devices, 'device', state.filters.device)}</div>`;
  }

  function cardHtml(r) {
    const faved = favSet.has(r.id);
    const subed = subSet.has(r.id);
    const showDl = r.show_download && r.download_url;
    return `
      <article class="card" data-id="${r.id}">
        <div class="row">
          <div class="thumb">📦</div>
          <div class="row-main">
            <div class="t">${esc(r.alias || r.pkg_name || ('ROM #' + r.id))} <span class="tag">${esc(r.category || '')}</span></div>
            <div class="s">安卓 ${esc(r.android_ver || '?')} · 机型 ${esc(r.device || '通用')} · ${timeAgo(r.created_at)}</div>
          </div>
        </div>
        <div class="action-bar">
          <button class="btn sm ${faved ? 'active' : ''}" data-act="fav">${faved ? '★ 已收藏' : '☆ 收藏'}</button>
          <button class="btn sm ${subed ? 'active' : ''}" data-act="sub">${subed ? '🔔 已订阅' : '🔔 订阅'}</button>
          ${showDl ? `<a class="btn sm primary" href="${esc(r.download_url)}" target="_blank" rel="noopener" data-act="dl">⬇ 下载</a>` : `<span class="tag">下载暂不开放</span>`}
        </div>
      </article>`;
  }

  function render(container) {
    if (!state.items.length && state.done) {
      container.innerHTML = filtersHtml() + UI.emptyState('暂无 ROM');
      bindBar(container);
      return;
    }
    container.innerHTML =
      filtersHtml() +
      state.items.map(cardHtml).join('') +
      `<div class="load-more" id="romMore"></div>`;
    bindBar(container);
    bind(container);
  }

  function bindBar(container) {
    container.querySelectorAll('.chip').forEach((chip) => {
      chip.onclick = () => {
        const key = chip.dataset.f;
        state.filters[key] = chip.dataset.v;
        reset();
        render(container);
        loadMore();
      };
    });
  }

  function bind(container) {
    container.querySelectorAll('.card').forEach((card) => {
      const id = +card.dataset.id;
      card.querySelector('[data-act="fav"]').onclick = (e) => toggleFav(e, id);
      card.querySelector('[data-act="sub"]').onclick = (e) => toggleSub(e, id);
      const dl = card.querySelector('[data-act="dl"]');
      if (dl) dl.onclick = (e) => e.stopPropagation();
      card.onclick = (e) => {
        if (e.target.closest('[data-act]')) return;
        openDetail(id);
      };
    });
    const more = container.querySelector('#romMore');
    if (more && !state.done) more.innerHTML = `<div class="spinner"></div>`;
  }

  function guardLogin() {
    if (!Store.isLogin()) { toast('请先登录', 'danger'); App.switchTab('me'); return false; }
    return true;
  }

  async function toggleFav(e, id) {
    if (!guardLogin()) return;
    try {
      const r = await Api.roms.toggleFav(id);
      if (r.faved) favSet.add(id); else favSet.delete(id);
      render(document.getElementById('page-rom'));
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function toggleSub(e, id) {
    if (!guardLogin()) return;
    try {
      const r = await Api.roms.toggleSub(id);
      if (r.subscribed) { subSet.add(id); toast('已订阅更新通知', 'ok'); }
      else subSet.delete(id);
      render(document.getElementById('page-rom'));
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function openDetail(id) {
    const modal = UI.modal({ title: 'ROM 详情', width: '640px', bodyHtml: '<div class="spinner"></div>' });
    try {
      const r = await Api.roms.detail(id);
      const showDl = r.show_download && r.download_url;
      modal.box.querySelector('.modal-body').innerHTML = `
        <div class="detail-head">
          <h2>${esc(r.alias || r.pkg_name || ('ROM #' + r.id))}</h2>
          <div class="meta">${esc(r.category || '')} · 安卓 ${esc(r.android_ver || '')} · ${esc(r.device || '通用')}</div>
        </div>
        <div class="detail-body">
          <p><b>包名：</b>${esc(r.pkg_name || '-')}</p>
          ${r.md5 ? `<p><b>MD5：</b><code>${esc(r.md5)}</code></p>` : ''}
          ${r.summary ? `<p>${esc(r.summary)}</p>` : ''}
        </div>
        <div class="action-bar">
          ${showDl ? `<a class="btn primary" href="${esc(r.download_url)}" target="_blank" rel="noopener">⬇ 下载</a>` : `<span class="tag">下载暂不开放</span>`}
          <button class="btn" data-d="fav">${favSet.has(id) ? '★ 已收藏' : '☆ 收藏'}</button>
        </div>`;
    } catch (err) {
      modal.box.querySelector('.modal-body').innerHTML = `<p class="confirm-msg">${esc(err.message)}</p>`;
    }
  }

  async function loadMore() {
    if (state.loading || state.done) return;
    state.loading = true;
    try {
      const qs = { page: state.page };
      if (state.filters.category) qs.category = state.filters.category;
      if (state.filters.android) qs.android = state.filters.android;
      if (state.filters.device) qs.device = state.filters.device;
      const list = await Api.roms.list(qs);
      if (!list || !list.length) state.done = true;
      else { state.items = state.items.concat(list); state.page++; }
    } catch (err) {
      toast(err.message, 'danger');
    } finally {
      state.loading = false;
      render(document.getElementById('page-rom'));
    }
  }

  async function loadFavState() {
    if (!Store.isLogin()) return;
    try {
      const f = await Api.user.favorites();
      (f.roms || []).forEach((id) => favSet.add(id));
    } catch (e) {}
  }

  function reset() {
    state.page = 1; state.items = []; state.done = false; state.loading = false;
  }

  window.addEventListener('scroll', () => {
    if (App.getCurrentTab() !== 'rom') return;
    if (state.loading || state.done) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) loadMore();
  });

  Pages.rom = {
    onShow() {
      const c = document.getElementById('page-rom');
      if (!state.facets.categories.length) {
        Api.roms.facets().then((f) => {
          if (f) state.facets = f;
          render(c);
        }).catch(() => render(c));
      }
      if (!state.items.length) {
        c.innerHTML = filtersHtml() + `<div class="load-more"><div class="spinner"></div></div>`;
        loadFavState().then(loadMore);
      } else render(c);
    },
  };
})(window);
