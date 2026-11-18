/**
 * 通用 UI 工具：toast、modal（弹窗）、confirm、loading、HTML 转义、时间格式化。
 */
(function (global) {
  'use strict';

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function timeAgo(ts) {
    if (!ts) return '';
    let d;
    if (typeof ts === 'number') {
      // 秒级时间戳
      d = new Date(ts * 1000);
    } else {
      // 后端 DATETIME 字符串（"2026-07-01 10:00:00"）或 ISO 字符串
      d = new Date(String(ts).replace(' ', 'T'));
    }
    if (isNaN(d.getTime())) return '';
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 86400 * 30) return Math.floor(diff / 86400) + ' 天前';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  let toastTimer = null;
  function toast(msg, type) {
    const root = document.getElementById('toastRoot');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast glass ' + (type || '');
    el.textContent = msg;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastTimer);
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    }, 2200);
  }

  // 通用弹窗：返回 { close }
  function modal({ title, bodyHtml, actions, width }) {
    const root = document.getElementById('overlayRoot');
    const wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    const box = document.createElement('div');
    box.className = 'modal glass';
    if (width) box.style.maxWidth = width;
    box.innerHTML = `
      ${title ? `<div class="modal-head">${esc(title)}</div>` : ''}
      <div class="modal-body">${bodyHtml || ''}</div>
      <div class="modal-foot"></div>
    `;
    const foot = box.querySelector('.modal-foot');
    (actions || []).forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (a.cls || '');
      btn.textContent = a.text;
      btn.onclick = () => a.onClick && a.onClick(close);
      foot.appendChild(btn);
    });
    wrap.appendChild(box);
    root.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));

    function close() {
      wrap.classList.remove('show');
      setTimeout(() => wrap.remove(), 200);
    }
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap && !(actions && actions.length)) close();
    });
    return { close, box };
  }

  function confirm({ title, message, okText, cancelText, onOk }) {
    modal({
      title,
      bodyHtml: `<p class="confirm-msg">${esc(message || '')}</p>`,
      actions: [
        { text: cancelText || '取消', cls: 'ghost', onClick: (c) => c() },
        {
          text: okText || '确定',
          cls: 'primary',
          onClick: (c) => {
            c();
            onOk && onOk();
          },
        },
      ],
    });
  }

  // 轻量 loading（按钮内联）
  function withLoading(btn, fn) {
    if (!btn) return fn();
    const old = btn.textContent;
    btn.disabled = true;
    btn.textContent = '处理中…';
    return Promise.resolve()
      .then(fn)
      .finally(() => {
        btn.disabled = false;
        btn.textContent = old;
      });
  }

  // 简易分页/加载更多容器辅助
  function emptyState(text) {
    return `<div class="empty-state">${esc(text || '暂无内容')}</div>`;
  }

  function avatar(user) {
    const name = (user && (user.nickname || user.username)) || '匿名';
    const letter = esc(name.charAt(0).toUpperCase());
    return `<span class="avatar">${letter}</span>`;
  }

  global.UI = {
    esc,
    timeAgo,
    toast,
    modal,
    confirm,
    withLoading,
    emptyState,
    avatar,
  };
})(window);
