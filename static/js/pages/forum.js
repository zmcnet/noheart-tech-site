/**
 * 讨论页：裸数组帖子 + forum/post/{id} 详情 + value 点赞 + 两级评论(parent_id/reply_to)。
 * 评论结构：comments 为一级数组，每项含 replies[]（二级，平铺显示"A 回复 B"）。
 */
(function (global) {
  'use strict';
  const { esc, timeAgo, toast, avatar } = UI;

  let state = {
    boards: [], boardId: '',
    page: 1, loading: false, done: false, items: [],
    keyword: '',
  };

  function boardBar() {
    const all = `<span class="chip ${!state.boardId ? 'active' : ''}" data-b="">全部</span>`;
    const rest = state.boards.map((b) => `<span class="chip ${b.id == state.boardId ? 'active' : ''}" data-b="${b.id}">${esc(b.name)}</span>`).join('');
    return `<div class="filter-bar">${all}${rest}</div>`;
  }

  function postHtml(p) {
    const r = p.reactions || {};
    const mine = r.mine || 0;
    return `
      <article class="card" data-id="${p.id}">
        <div class="row" style="margin-bottom:8px">
          ${avatar({ nickname: p.nickname })}
          <div class="row-main">
            <div class="t">${esc(p.nickname || '匿名')}</div>
            <div class="s">${timeAgo(p.created_at)} · 💬 ${p.comments || 0}</div>
          </div>
        </div>
        <div class="detail-body" style="font-size:14px">${esc(p.content || '').slice(0, 120)}${p.content && p.content.length > 120 ? '…' : ''}</div>
        <div class="action-bar">
          <button class="btn sm ${mine === 1 ? 'active' : ''}" data-act="like">👍 ${r.likes || 0}</button>
          <button class="btn sm ${mine === -1 ? 'active' : ''}" data-act="dislike">👎 ${r.dislikes || 0}</button>
          <button class="btn sm" data-act="comment">💬 评论</button>
        </div>
      </article>`;
  }

  function render(container) {
    if (!state.items.length && state.done) {
      container.innerHTML = boardBar() + UI.emptyState('该板块暂无帖子');
      bindBar(container);
      return;
    }
    container.innerHTML =
      boardBar() +
      `<div style="text-align:right;margin:6px 0"><button class="btn sm primary" data-act="new">＋ 发帖</button></div>` +
      state.items.map(postHtml).join('') +
      `<div class="load-more" id="forumMore"></div>`;
    bindBar(container);
    bind(container);
  }

  function bindBar(container) {
    container.querySelectorAll('[data-b]').forEach((chip) => {
      chip.onclick = () => {
        state.boardId = chip.dataset.b;
        reset(); render(container); loadMore();
      };
    });
  }

  function bind(container) {
    const newBtn = container.querySelector('[data-act="new"]');
    if (newBtn) newBtn.onclick = () => openEditor();
    container.querySelectorAll('.card').forEach((card) => {
      const id = card.dataset.id;
      card.querySelector('[data-act="like"]').onclick = (e) => react(e, id, 1);
      card.querySelector('[data-act="dislike"]').onclick = (e) => react(e, id, -1);
      card.querySelector('[data-act="comment"]').onclick = (e) => { e.stopPropagation(); openDetail(id); };
      card.onclick = () => openDetail(id);
    });
    const more = container.querySelector('#forumMore');
    if (more && !state.done) more.innerHTML = `<div class="spinner"></div>`;
  }

  function guardLogin() {
    if (!Store.isLogin()) { toast('请先登录', 'danger'); App.switchTab('me'); return false; }
    return true;
  }

  async function react(e, id, value) {
    if (!guardLogin()) return;
    try {
      const r = await Api.posts.react(id, value);
      const item = state.items.find((x) => x.id == id);
      if (item) item.reactions = r;
      render(document.getElementById('page-forum'));
    } catch (err) { toast(err.message, 'danger'); }
  }

  async function openEditor() {
    if (!guardLogin()) return;
    if (!state.boards.length) {
      try { state.boards = await Api.boards.list(); } catch (e) {}
    }
    const opts = state.boards.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join('')
      || `<option value="0">默认板块</option>`;
    const modal = UI.modal({
      title: '发布帖子',
      width: '560px',
      bodyHtml: `
        <div class="field"><label>板块</label><select class="input" id="fBoard">${opts}</select></div>
        <div class="field"><label>正文</label><textarea class="input" id="fContent" rows="5" placeholder="分享你的看法…"></textarea></div>`,
      actions: [
        { text: '取消', cls: 'ghost', onClick: (c) => c() },
        { text: '发布', cls: 'primary', onClick: (c) => {
            const btn = c.box.querySelector('.btn.primary');
            const payload = {
              board_id: +modal.box.querySelector('#fBoard').value,
              content: modal.box.querySelector('#fContent').value.trim(),
            };
            if (!payload.content) { toast('正文不能为空', 'danger'); return; }
            UI.withLoading(btn, async () => {
              await Api.posts.create(payload.board_id, payload.content);
              toast('发布成功', 'ok');
              c(); reset(); loadMore();
            }).catch((err) => toast(err.message, 'danger'));
          } },
      ],
    });
  }

  // 两级评论渲染：一级 + 其 replies
  function renderComments(list) {
    if (!list || !list.length) return UI.emptyState('还没有评论，来抢沙发');
    let html = '';
    list.forEach((c) => {
      html += commentHtml(c, false);
      (c.replies || []).forEach((rc) => { html += commentHtml(rc, true); });
    });
    return html;
  }

  function commentHtml(c, isReply) {
    const replyName = c.reply_nick ? esc(c.reply_nick) : '';
    return `
      <div class="comment ${isReply ? 'reply' : ''}">
        ${avatar({ nickname: c.nickname })}
        <div class="c-main">
          <div class="c-name">${esc(c.nickname || '匿名')}</div>
          <div class="c-text">${replyName ? `<span class="reply-to">回复 @${replyName}：</span>` : ''}${esc(c.content)}</div>
          <div class="c-meta">
            <span>${timeAgo(c.created_at)}</span>
            <a data-reply="${c.id}" data-uid="${c.user_id}" data-name="${esc(c.nickname || '匿名')}">回复</a>
          </div>
        </div>
      </div>`;
  }

  async function openDetail(id) {
    const modal = UI.modal({ title: '帖子详情', width: '640px', bodyHtml: '<div class="spinner"></div>' });
    try {
      const [p, cmt] = await Promise.all([Api.posts.detail(id), Api.posts.comments(id)]);
      const r = p.reactions || {};
      modal.box.querySelector('.modal-body').innerHTML = `
        <div class="detail-head">
          <h2>${esc(p.nickname || '匿名')} 的帖子</h2>
          <div class="meta">${timeAgo(p.created_at)}</div>
        </div>
        <div class="detail-body">${esc(p.content || '')}</div>
        <div class="action-bar">
          <button class="btn sm">👍 ${r.likes || 0}</button>
          <button class="btn sm">👎 ${r.dislikes || 0}</button>
        </div>
        <hr style="border-color:var(--glass-border);margin:16px 0" />
        <div class="field">
          <textarea class="input" id="cInput" rows="2" placeholder="友善评论…" style="height:auto"></textarea>
          <div style="text-align:right;margin-top:8px"><button class="btn sm primary" id="cSend">发送</button></div>
        </div>
        <div id="cList">${renderComments(cmt)}</div>`;

      const input = modal.box.querySelector('#cInput');
      const send = modal.box.querySelector('#cSend');
      let replyTo = 0, replyUid = 0, replyName = '';
      modal.box.querySelector('#cList').addEventListener('click', (e) => {
        const a = e.target.closest('[data-reply]');
        if (a) {
          replyTo = +a.dataset.reply;
          replyUid = +a.dataset.uid;
          replyName = a.dataset.name;
          input.value = `回复 @${replyName}：`;
          input.focus();
        }
      });
      send.onclick = () => UI.withLoading(send, async () => {
        const text = input.value.replace(/^回复 @[^：]+：/, '').trim();
        if (!text) { toast('评论不能为空', 'danger'); return; }
        // 一级评论 parent_id=0；回复一级时 parent_id=一级id, reply_to=被回复用户
        const parentId = replyTo ? replyTo : 0;
        await Api.posts.comment(id, text, parentId, replyUid);
        toast('评论成功', 'ok');
        const fresh = await Api.posts.comments(id);
        modal.box.querySelector('#cList').innerHTML = renderComments(fresh);
        input.value = ''; replyTo = 0; replyUid = 0; replyName = '';
      }).catch((err) => toast(err.message, 'danger'));
    } catch (err) {
      modal.box.querySelector('.modal-body').innerHTML = `<p class="confirm-msg">${esc(err.message)}</p>`;
    }
  }

  async function loadMore() {
    if (state.loading || state.done) return;
    state.loading = true;
    try {
      const qs = { page: state.page };
      if (state.boardId) qs.board = state.boardId;
      if (state.keyword) qs.keyword = state.keyword;
      const list = await Api.posts.list(qs);
      if (!list || !list.length) state.done = true;
      else { state.items = state.items.concat(list); state.page++; }
    } catch (err) {
      toast(err.message, 'danger');
    } finally {
      state.loading = false;
      render(document.getElementById('page-forum'));
    }
  }

  function reset() {
    state.page = 1; state.items = []; state.done = false; state.loading = false;
  }

  window.addEventListener('scroll', () => {
    if (App.getCurrentTab() !== 'forum') return;
    if (state.loading || state.done) return;
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) loadMore();
  });

  Pages.forum = {
    onShow() {
      const c = document.getElementById('page-forum');
      if (!state.boards.length) {
        Api.boards.list().then((b) => { state.boards = b || []; render(c); }).catch(() => render(c));
      }
      if (!state.items.length) {
        c.innerHTML = boardBar() + `<div class="load-more"><div class="spinner"></div></div>`;
        loadMore();
      } else render(c);
    },
    search(q) {
      state.keyword = q || '';
      reset();
      const c = document.getElementById('page-forum');
      c.innerHTML = boardBar() + `<div class="load-more"><div class="spinner"></div></div>`;
      loadMore();
    },
  };
})(window);
