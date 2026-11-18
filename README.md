# 没有心科技 · NoHeart Tech

> 探索科技与生活的交汇点

「没有心科技」的官方站点。零依赖的纯静态前端，使用原生 HTML / CSS / JavaScript 构建，
无需任何构建工具与运行时。

在线访问：<https://www.kybll.cn>

---

## 功能特性

- **响应式布局** — 适配桌面 / 平板 / 移动端
- **深色模式** — 基于 `body.dark-mode` 的主题切换
- **多语言 (i18n)** — 内置中英文切换
- **站内搜索** — 前端全文检索
- **ROM 资源库** — 机型 ROM / 内核 / TWRP 下载导航
- **页面转场动画** — 统一的路由转场体验
- **图片保护** — 禁用右键与拖拽盗图

---

## 技术栈

| 组件 | 说明 |
|------|------|
| HTML5 | 语义化结构 |
| CSS3 | 自定义属性 + Grid/Flex 布局 |
| JavaScript | 原生 ES6+，**无框架、无打包器** |
| 第三方依赖 | **无** |

---

## 快速开始

### 方式一：直接打开

```bash
git clone <this-repo>
cd noheart-tech-site
```

双击 `index.html` 即可在浏览器中查看。

> 部分浏览器对 `file://` 协议下的 `fetch()` / XHR 有限制，
> 若遇到资源加载异常，请使用下方本地服务器方式。

### 方式二：本地服务器（推荐）

任选其一：

```bash
# Python（已内置，无需安装）
python -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080
```

然后访问 <http://localhost:8080>。

### 方式三：部署到线上

本项目为纯静态站点，可直接托管于任意静态托管服务：

```bash
# GitHub Pages
# 在仓库 Settings → Pages 中选择分支根目录即可

# Nginx
cp -r . /var/www/noheart-tech-site
```

Nginx 示例配置：

```nginx
server {
    listen 80;
    server_name www.kybll.cn;
    root /var/www/noheart-tech-site;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 构建说明

本项目**没有构建步骤**。所有资源均为手写原始文件，直接编辑即生效：

| 目录 | 用途 |
|------|------|
| `index.html` | 首页 |
| `app/` | 应用页 |
| `rom/` | ROM 资源库页面（含 `note8pro/` 机型子页） |
| `tools/` | 工具页（分区管理说明、下载、联系） |
| `docs/` | 文档页 |
| `static/css/` | 样式（按模块拆分：header/footer/dashboard/doc 等） |
| `static/js/` | 脚本（按模块拆分：config/i18n/theme/search/api 等） |
| `static/images/` | 图片资源 |
| `tools/doc/` | 工具文档（含 Markdown 使用说明） |

**修改样式**：编辑 `static/css/` 下对应模块文件，变量集中在 `static/css/style.css`。
**修改文案/语言**：编辑 `static/js/i18n.js`。
**修改站点配置**：编辑 `static/js/config.js`。

---

## 目录结构

```
noheart-tech-site/
├── index.html          # 首页
├── contact.html        # 联系页
├── favicon.ico
├── app/                # 应用页
├── rom/                # ROM 资源库
│   ├── index.html
│   ├── note8pro/       # 红米 Note8 Pro 机型页
│   │   ├── miui.html / hyperos.html / coloros.html
│   │   ├── kernel-official.html / kernel-selfbuilt.html / kernel-zhuque.html
│   │   ├── twrp-android9~12.html
│   │   └── aosp.html / originos.html / others.html
├── tools/              # 工具页
│   ├── index.html / download.html / contact.html
│   └── doc/            # 工具文档
├── docs/               # 文档页
└── static/
    ├── css/            # 样式
    ├── js/             # 脚本
    └── images/         # 图片
```

---

## 本地开发提示

仓库内的 `_test_server.py` 是一个轻量测试服务器（已被 `.gitignore` 忽略），
需要时可在本地创建使用：

```python
# _test_server.py（示例）
import http.server, socketserver, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
with socketserver.TCPServer(("", 8890), http.server.SimpleHTTPRequestHandler) as httpd:
    print("Serving at http://localhost:8890")
    httpd.serve_forever()
```

---

## 许可

© 没有心科技。保留所有权利。