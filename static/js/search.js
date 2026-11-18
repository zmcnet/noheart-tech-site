// ============================================================
// 全站搜索 - search.js
// 菜单栏内联搜索框，索引覆盖: ROM / 无心工具箱 / 教程文档
// 依赖: i18n.js (需在之前加载)
// ============================================================
(function () {
  'use strict';

  // 计算到站点根目录的相对前缀（兼容 file:// 与多级子目录）
  function computeSitePrefix() {
    var path = window.location.pathname || '';
    var idx = path.lastIndexOf('/');
    var dir = idx > 0 ? path.substring(0, idx) : '';
    var parts = dir.split('/').filter(Boolean);
    // file:// 协议下 pathname 形如 /C:/Users/...，去掉盘符部分
    if (parts.length > 0 && /^[a-zA-Z]:$/.test(parts[0])) {
      parts.shift();
    }
    var prefix = '';
    for (var i = 0; i < parts.length; i++) {
      prefix += '../';
    }
    return prefix;
  }

  var PREFIX = computeSitePrefix();

  function isEn() {
    return window.i18n && window.i18n.isEn ? window.i18n.isEn() : false;
  }

  // ===== 搜索索引（url 相对站点根目录） =====
  var INDEX = [
    // ---- ROM ----
    { type: 'rom', titleZh: '机型分区', titleEn: 'ROM Releases', descZh: '高品质 Android ROM，精心适配每一款设备', descEn: 'High-quality Android ROMs, carefully crafted for your device', url: 'rom/index.html', keywords: ['rom', '刷机', 'flash'] },
    { type: 'rom', titleZh: '红米Note 8 Pro', titleEn: 'Redmi Note 8 Pro', descZh: '发布日期：2019.08.29', descEn: 'Release Date: 2019.08.29', url: 'rom/index.html', keywords: ['红米', 'note', 'redmi', 'begonia'] },
    { type: 'rom', titleZh: '一加Ace 2V', titleEn: 'OnePlus Ace 2V', descZh: '发布日期：2023.03.07', descEn: 'Release Date: 2023.03.07', url: 'rom/index.html', keywords: ['一加', 'oneplus', 'ace', 'phk110'] },
    { type: 'rom', titleZh: '红米Pad SE（第一代）', titleEn: 'Redmi Pad SE (1st Gen)', descZh: '发布日期：2023.09.21', descEn: 'Release Date: 2023.09.21', url: 'rom/index.html', keywords: ['红米', '平板', 'pad', 'redmi', 'se'] },

    // ---- 无心工具箱 ----
    { type: 'tools', titleZh: '无心工具箱', titleEn: 'Wuxin Tools', descZh: '一款功能强大、简洁高效的 Android 调试与刷机工具箱', descEn: 'A powerful Android debugging and flashing toolbox', url: 'tools/index.html', keywords: ['工具箱', 'wuxin', 'adb', 'fastboot', '刷机', 'tools'] },
    { type: 'tools', titleZh: '设备仪表盘', titleEn: 'Device Dashboard', descZh: '一目了然，全面掌握设备信息', descEn: 'At a glance, full device information', url: 'tools/index.html', keywords: ['仪表盘', '设备', 'dashboard', 'cpu', '电池'] },
    { type: 'tools', titleZh: '分区管理', titleEn: 'Partition Management', descZh: '全方位掌控设备分区，安全高效', descEn: 'Full control of device partitions', url: 'tools/index.html', keywords: ['分区', 'partition', '动态分区', 'super'] },
    { type: 'tools', titleZh: '普通分区管理', titleEn: 'Normal Partition Management', descZh: '常规分区读写与管理', descEn: 'Normal partition read/write management', url: 'tools/index.html', keywords: ['分区', 'normal', '普通'] },
    { type: 'tools', titleZh: '动态分区管理', titleEn: 'Dynamic Partition Management', descZh: '动态分区一键处理', descEn: 'Dynamic partition management', url: 'tools/index.html', keywords: ['动态', 'dynamic'] },
    { type: 'tools', titleZh: '重启管理', titleEn: 'Reboot Management', descZh: '快速重启进入各种模式', descEn: 'Quick reboot to various modes', url: 'tools/index.html', keywords: ['重启', 'reboot', 'rec', 'bootloader'] },
    { type: 'tools', titleZh: '文件管理', titleEn: 'File Manager', descZh: '设备文件轻松管理', descEn: 'Easy device file management', url: 'tools/index.html', keywords: ['文件', 'file', '管理器'] },
    { type: 'tools', titleZh: '功能扩展', titleEn: 'Extensions', descZh: '安装驱动、设备管理器、命令行工具', descEn: 'Install drivers, device manager, command line', url: 'tools/index.html', keywords: ['扩展', '驱动', 'driver', '命令行', 'cmd'] },
    { type: 'tools', titleZh: '下载中心', titleEn: 'Download Center', descZh: '下载无心工具箱各版本', descEn: 'Download Wuxin Tools versions', url: 'tools/download.html', keywords: ['下载', 'download', '网盘', '123盘', '百度'] },
    { type: 'tools', titleZh: '使用文档', titleEn: 'Documentation', descZh: '快速上手无心工具箱，掌握每一项功能', descEn: 'Quick start guide for Wuxin Tools', url: 'tools/doc/index.html', keywords: ['文档', 'doc', '教程', '使用'] },
    { type: 'tools', titleZh: '更新日志', titleEn: 'Updates', descZh: '工具箱版本更新记录', descEn: 'Wuxin Tools changelog', url: 'tools/update.html', keywords: ['更新', 'update', '日志', 'changelog'] },
    { type: 'tools', titleZh: '联系我们', titleEn: 'Contact', descZh: '联系没有心科技团队', descEn: 'Contact NoHeart Tech', url: 'tools/contact.html', keywords: ['联系', 'contact', 'qq', '群'] },

    // ---- 教程文档 ----
    { type: 'docs', titleZh: '教程文档', titleEn: 'Tutorials', descZh: '无心工具箱与 Android 开发的全面指南和教程', descEn: 'Comprehensive guides for Wuxin Tools and Android', url: 'docs/index.html', keywords: ['教程', '文档', 'docs', 'tutorial'] },
    { type: 'docs', titleZh: '简介', titleEn: 'Introduction', descZh: '教程文档总览', descEn: 'Tutorial documentation overview', url: 'docs/index.html', keywords: ['简介', 'intro', '介绍'] },
    { type: 'docs', titleZh: '安装指南', titleEn: 'Installation', descZh: '环境与驱动安装', descEn: 'Environment and driver installation', url: 'docs/index.html', keywords: ['安装', 'install', '环境', '驱动'] },
    { type: 'docs', titleZh: '快速上手', titleEn: 'Quick Start', descZh: '快速开始使用', descEn: 'Get started quickly', url: 'docs/index.html', keywords: ['快速', '上手', 'quick', 'start', '入门'] },
    { type: 'docs', titleZh: '设备连接', titleEn: 'Device Connection', descZh: '连接您的 Android 设备', descEn: 'Connect your Android device', url: 'docs/index.html', keywords: ['连接', 'connect', '设备', 'usb'] },
    { type: 'docs', titleZh: 'ADB 命令', titleEn: 'ADB Commands', descZh: 'ADB 常用命令详解', descEn: 'ADB common commands', url: 'docs/index.html', keywords: ['adb', '命令', 'command'] },
    { type: 'docs', titleZh: 'Fastboot 命令', titleEn: 'Fastboot Commands', descZh: 'Fastboot 常用命令详解', descEn: 'Fastboot common commands', url: 'docs/index.html', keywords: ['fastboot', '命令', 'command'] },
    { type: 'docs', titleZh: '文件管理', titleEn: 'File Management', descZh: '设备文件管理指南', descEn: 'Device file management guide', url: 'docs/index.html', keywords: ['文件', 'file', '管理'] },
    { type: 'docs', titleZh: '分区管理', titleEn: 'Partition Management', descZh: '分区操作进阶指南', descEn: 'Advanced partition guide', url: 'docs/index.html', keywords: ['分区', 'partition'] },
    { type: 'docs', titleZh: '刷机指导', titleEn: 'Flashing Guide', descZh: '安全刷机完整流程', descEn: 'Safe flashing workflow', url: 'docs/index.html', keywords: ['刷机', 'flash', '线刷', '卡刷'] },
    { type: 'docs', titleZh: '动态分区', titleEn: 'Dynamic Partitions', descZh: '动态分区原理解析', descEn: 'Dynamic partitions explained', url: 'docs/index.html', keywords: ['动态分区', 'dynamic', 'super'] },
    { type: 'docs', titleZh: 'Payload 提取', titleEn: 'Payload Dumper', descZh: '从刷机包提取分区镜像', descEn: 'Extract images from payload', url: 'docs/index.html', keywords: ['payload', '提取', 'dumper'] },
    { type: 'docs', titleZh: '常见问题', titleEn: 'FAQ', descZh: '高频问题解答', descEn: 'Frequently asked questions', url: 'docs/index.html', keywords: ['常见问题', 'faq', '帮助'] },
    { type: 'docs', titleZh: '故障排除', titleEn: 'Troubleshooting', descZh: '常见故障与解决', descEn: 'Common issues and fixes', url: 'docs/index.html', keywords: ['故障', 'troubleshooting', '解决', 'error', '错误'] },
    { type: 'docs', titleZh: '更新日志', titleEn: 'Changelog', descZh: '文档更新记录', descEn: 'Documentation changelog', url: 'docs/index.html', keywords: ['更新', 'changelog', '日志'] }
  ];

  var TYPE_LABEL = {
    rom: { zh: 'ROM', en: 'ROM' },
    tools: { zh: '工具箱', en: 'Tools' },
    docs: { zh: '文档', en: 'Docs' }
  };

  var EMPTY_TEXT = { zh: '未找到相关结果', en: 'No results found' };

  // ===== 搜索逻辑 =====
  function search(query) {
    var tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return INDEX.filter(function (item) {
      var text = (item.titleZh + ' ' + item.titleEn + ' ' + item.descZh + ' ' + item.descEn + ' ' + item.keywords.join(' ')).toLowerCase();
      for (var i = 0; i < tokens.length; i++) {
        if (text.indexOf(tokens[i]) === -1) return false;
      }
      return true;
    }).slice(0, 10);
  }

  function renderResults(dropdown, items) {
    var en = isEn();
    if (!items.length) {
      dropdown.innerHTML = '<div class="search-empty">' + (en ? EMPTY_TEXT.en : EMPTY_TEXT.zh) + '</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var label = TYPE_LABEL[it.type] ? TYPE_LABEL[it.type][en ? 'en' : 'zh'] : '';
      var title = en ? it.titleEn : it.titleZh;
      var desc = en ? it.descEn : it.descZh;
      it._url = PREFIX + it.url;
      html += '<div class="search-result-item" data-url="' + it._url + '">' +
        '<span class="search-result-type">' + label + '</span>' +
        '<div class="search-result-info">' +
        '<div class="search-result-title">' + title + '</div>' +
        '<div class="search-result-desc">' + desc + '</div>' +
        '</div>' +
        '</div>';
    }
    dropdown.innerHTML = html;
  }

  // ===== 初始化单个搜索框 =====
  function initBox(box) {
    var input = box.querySelector('.search-input');
    var dropdown = box.querySelector('.search-dropdown');
    if (!input || !dropdown) return;

    function doSearch() {
      renderResults(dropdown, search(input.value));
      box.classList.toggle('active', input.value.length > 0);
    }

    input.addEventListener('input', doSearch);

    input.addEventListener('focus', function () {
      if (input.value) box.classList.add('active');
    });

    // 点击结果跳转（mousedown 防止 input 失焦导致下拉先关闭）
    dropdown.addEventListener('mousedown', function (e) {
      var item = e.target.closest('.search-result-item');
      if (item) {
        e.preventDefault();
        window.location.href = item.getAttribute('data-url');
      }
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        box.classList.remove('active');
        input.blur();
      }
      if (e.key === 'Enter') {
        var first = dropdown.querySelector('.search-result-item');
        if (first) {
          e.preventDefault();
          window.location.href = first.getAttribute('data-url');
        }
      }
    });

    // 点击外部关闭
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) box.classList.remove('active');
    });
  }

  // ===== 初始化 =====
  document.addEventListener('DOMContentLoaded', function () {
    var boxes = document.querySelectorAll('.search-box, .mobile-menu-search');
    for (var i = 0; i < boxes.length; i++) {
      initBox(boxes[i]);
    }
  });
})();
