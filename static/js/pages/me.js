/**
 * 我的页：微软步进式登录/注册 + 用户中心。
 * 流程：step1 输入账户 -> 调 auth/check 检测存在性 -> step2 分流：
 *   存在 -> 主推密码登录（仍可切验证码登录）
 *   不存在 -> 主推注册（手机号发码 + 账户名 + 密码）
 */
(function (global) {
  'use strict';
  const { esc, timeAgo, toast, avatar } = UI;

  let step = 1;
  let account = '';
  let devCode = null;
  let accountExists = false; // step1 检测后的账户存在标记

  function renderLogin(container) {
    if (step === 1) return renderStep1(container);
    return renderStep2(container);
  }

  function renderStep1(container) {
    container.innerHTML = `
      <div class="center-box">
        <div class="section-title" style="justify-content:center"><span>欢迎来到 XFCE 社区</span></div>
        <div class="card">
          <div class="field">
            <label>手机号 / 用户名</label>
            <input class="input" id="acc" placeholder="输入手机号或用户名" value="${esc(account)}" />
          </div>
          <button class="btn primary block" id="next">下一步</button>
        </div>
        <p class="summary" style="text-align:center;color:var(--text-2);font-size:13px">
          已有账户直接登录；新手机号将引导注册
        </p>
      </div>`;
    container.querySelector('#next').onclick = () => UI.withLoading(container.querySelector('#next'), async () => {
      const v = container.querySelector('#acc').value.trim();
      if (!v) { toast('请输入账户', 'danger'); return; }
      account = v;
      try {
        const r = await Api.auth.check(account);
        accountExists = !!(r && r.exists);
      } catch (e) {
        // 检测失败不阻断流程，默认走注册入口
        accountExists = false;
      }
      step = 2;
      renderLogin(container);
    }).catch((e) => toast(e.message, 'danger'));
  }

  function renderStep2(container) {
    const isLoginFlow = accountExists;
    const tip = isLoginFlow
      ? '该账户已注册，请输入密码或使用验证码登录'
      : '该账户尚未注册，请先获取验证码并设置账户名完成注册';
    container.innerHTML = `
      <div class="center-box">
        <div class="section-title" style="justify-content:space-between">
          <a class="back-btn btn sm ghost" id="back">‹ 返回</a><span>账户：${esc(account)}</span><span style="width:40px"></span>
        </div>
        <p class="summary" style="text-align:center;color:var(--text-2);font-size:13px;margin-bottom:10px">${esc(tip)}</p>
        <div class="card">
          ${isLoginFlow ? `
          <div class="field">
            <label>密码登录（用户名或手机号）</label>
            <div class="input-row">
              <input class="input" id="pwd" type="password" placeholder="请输入密码" />
              <button class="btn" id="pwLogin">登录</button>
            </div>
          </div>
          <hr style="border-color:var(--glass-border);margin:14px 0" />
          ` : ''}
          <div class="field">
            <label>验证码${isLoginFlow ? '登录' : '注册'}（手机号）</label>
            <div class="input-row">
              <input class="input" id="code" placeholder="6 位验证码" />
              <button class="btn" id="sendCode">获取验证码</button>
            </div>
            ${!isLoginFlow ? `
            <div class="field" style="margin-top:12px">
              <label>设置账户名 + 密码</label>
              <input class="input" id="username" placeholder="账户名（4-32位字母数字_）" />
              <input class="input" id="regPwd" type="password" placeholder="设置密码（至少6位）" style="margin-top:8px" />
            </div>
            <button class="btn primary block" id="reg" style="margin-top:10px">注册并登录</button>
            ` : `<button class="btn primary block" id="codeLogin" style="margin-top:10px">验证码登录</button>`}
          </div>
          ${devCode ? `<p class="summary" style="color:var(--ok);margin-top:10px">开发验证码：${esc(devCode)}</p>` : ''}
        </div>
      </div>`;
    container.querySelector('#back').onclick = () => { step = 1; renderLogin(container); };
    container.querySelector('#pwLogin').onclick = () => UI.withLoading(container.querySelector('#pwLogin'), async () => {
      const pwd = container.querySelector('#pwd').value;
      if (!pwd) { toast('请输入密码', 'danger'); return; }
      try {
        const r = await Api.auth.login(account, pwd, 'password');
        doLogin(r);
      } catch (e) { toast(e.message, 'danger'); }
    }).catch((e) => toast(e.message, 'danger'));
    container.querySelector('#sendCode').onclick = () => sendCode(container, container.querySelector('#sendCode'), account);
    const codeLoginBtn = container.querySelector('#codeLogin');
    if (codeLoginBtn) codeLoginBtn.onclick = () => UI.withLoading(codeLoginBtn, async () => {
      const code = container.querySelector('#code').value.trim();
      if (!code) { toast('请输入验证码', 'danger'); return; }
      try {
        const r = await Api.auth.login(account, code, 'code');
        doLogin(r);
      } catch (e) { toast(e.message, 'danger'); }
    }).catch((e) => toast(e.message, 'danger'));
    container.querySelector('#reg').onclick = () => UI.withLoading(container.querySelector('#reg'), async () => {
      const code = container.querySelector('#code').value.trim();
      const username = container.querySelector('#username').value.trim();
      const pwd = container.querySelector('#regPwd').value;
      if (!code || !username || !pwd) { toast('验证码、账户名、密码均需填写', 'danger'); return; }
      try {
        const r = await Api.auth.register(account, code, username, pwd);
        doLogin(r);
      } catch (e) { toast(e.message, 'danger'); }
    }).catch((e) => toast(e.message, 'danger'));
  }

  async function sendCode(container, btn, phone) {
    if (!/^1\d{10}$/.test(phone)) { toast('请输入正确的手机号', 'danger'); return; }
    UI.withLoading(btn, async () => {
      try {
        const r = await Api.auth.sendCode(phone, 'login');
        if (r && r.dev_code) {
          devCode = r.dev_code;
          toast('验证码已发送（开发模式见下方）', 'ok');
          renderLogin(container);
        } else {
          toast('验证码已发送', 'ok');
        }
      } catch (e) { toast(e.message, 'danger'); }
    }).catch((e) => toast(e.message, 'danger'));
  }

  function doLogin(r) {
    Store.login(r.token, r.user);
    toast('登录成功', 'ok');
    step = 1; account = ''; devCode = null;
    renderCenter(document.getElementById('page-me'));
  }

  // ============ 用户中心 ============
  function renderCenter(container) {
    const u = Store.getUser();
    if (!u) { renderLogin(container); return; }
    container.innerHTML = `
      <div class="card">
        <div class="row">
          ${avatar(u)}
          <div class="row-main">
            <div class="t">${esc(u.nickname || u.username)}</div>
            <div class="s">${esc(u.phone || '')} · ${u.role == 2 ? '管理员' : u.role == 1 ? '作者' : '普通用户'}</div>
          </div>
        </div>
      </div>
      <div class="menu-list">
        <div class="card" data-menu="fav-article"><span>⭐ 收藏的文章</span><span>›</span></div>
        <div class="card" data-menu="fav-rom"><span>📦 收藏的 ROM</span><span>›</span></div>
        <div class="card" data-menu="noti"><span>🔔 通知</span><span>›</span></div>
        <div class="card" data-menu="profile"><span>✏️ 编辑资料</span><span>›</span></div>
        <div class="card" data-menu="logout"><span style="color:var(--danger)">退出登录</span><span>›</span></div>
      </div>`;
    container.querySelector('[data-menu="fav-article"]').onclick = () => showFavArticles();
    container.querySelector('[data-menu="fav-rom"]').onclick = () => showFavRoms();
    container.querySelector('[data-menu="noti"]').onclick = () => showNotifications();
    container.querySelector('[data-menu="profile"]').onclick = () => editProfile(container);
    container.querySelector('[data-menu="logout"]').onclick = () => {
      UI.confirm({ title: '退出登录', message: '确定要退出当前账户吗？', onOk: () => {
        Store.logout(); toast('已退出', 'ok'); renderCenter(container);
      } });
    };
  }

  async function showFavArticles() {
    const modal = UI.modal({ title: '收藏的文章', width: '560px', bodyHtml: '<div class="spinner"></div>' });
    try {
      const f = await Api.user.favorites();
      const ids = (f.articles || []);
      if (!ids.length) { modal.box.querySelector('.modal-body').innerHTML = UI.emptyState('还没有收藏'); return; }
      const arts = await Promise.all(ids.map((id) => Api.articles.detail(id).catch(() => null)));
      const list = arts.filter(Boolean);
      modal.box.querySelector('.modal-body').innerHTML = list.length
        ? list.map((a) => `<div class="card"><h3>${esc(a.title)}</h3><div class="meta">${timeAgo(a.created_at)}</div></div>`).join('')
        : UI.emptyState('收藏的文章已失效');
    } catch (e) { modal.box.querySelector('.modal-body').innerHTML = `<p class="confirm-msg">${esc(e.message)}</p>`; }
  }

  async function showFavRoms() {
    const modal = UI.modal({ title: '收藏的 ROM', width: '560px', bodyHtml: '<div class="spinner"></div>' });
    try {
      const f = await Api.user.favorites();
      const ids = (f.roms || []);
      if (!ids.length) { modal.box.querySelector('.modal-body').innerHTML = UI.emptyState('还没有收藏'); return; }
      const roms = await Promise.all(ids.map((id) => Api.roms.detail(id).catch(() => null)));
      const list = roms.filter(Boolean);
      modal.box.querySelector('.modal-body').innerHTML = list.length
        ? list.map((r) => `<div class="card"><h3>${esc(r.alias || r.pkg_name || ('ROM #' + r.id))}</h3><div class="meta">${esc(r.device || '通用')}</div></div>`).join('')
        : UI.emptyState('收藏的 ROM 已失效');
    } catch (e) { modal.box.querySelector('.modal-body').innerHTML = `<p class="confirm-msg">${esc(e.message)}</p>`; }
  }

  async function showNotifications() {
    const modal = UI.modal({ title: '通知', width: '560px', bodyHtml: '<div class="spinner"></div>' });
    try {
      const data = await Api.user.notifications({ page: 1 });
      const list = (data.list || []);
      modal.box.querySelector('.modal-body').innerHTML = list.length
        ? list.map((n) => `<div class="card"><div class="t">${esc(n.title)}</div><div class="summary">${esc(n.content)}</div><div class="meta">${timeAgo(n.created_at)}</div></div>`).join('')
        : UI.emptyState('暂无通知');
      Api.user.readAll().catch(() => {});
    } catch (e) { modal.box.querySelector('.modal-body').innerHTML = `<p class="confirm-msg">${esc(e.message)}</p>`; }
  }

  function editProfile(container) {
    const u = Store.getUser();
    const modal = UI.modal({
      title: '编辑资料', width: '480px',
      bodyHtml: `
        <div class="field"><label>昵称</label><input class="input" id="nk" value="${esc(u.nickname || '')}" /></div>
        <div class="field"><label>简介</label><input class="input" id="bio" value="${esc(u.bio || '')}" /></div>`,
      actions: [
        { text: '取消', cls: 'ghost', onClick: (c) => c() },
        { text: '保存', cls: 'primary', onClick: (c) => UI.withLoading(c.box.querySelector('.btn.primary'), async () => {
            try {
              await Api.user.profile({
                nickname: modal.box.querySelector('#nk').value.trim(),
                bio: modal.box.querySelector('#bio').value.trim(),
              });
              // 重新拉取最新资料
              const nu = await Api.auth.me();
              Store.setUser(nu);
              App.renderTopbarUser();
              toast('已保存', 'ok');
              c(); renderCenter(container);
            } catch (e) { toast(e.message, 'danger'); }
          }).catch((e) => toast(e.message, 'danger')) },
      ],
    });
  }

  Pages.me = {
    onShow() {
      const c = document.getElementById('page-me');
      if (Store.isLogin()) renderCenter(c);
      else { step = 1; renderLogin(c); }
    },
  };
})(window);
