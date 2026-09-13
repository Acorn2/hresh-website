# 阿里云部署说明

本文用于将当前 Hresh 个人网站部署到阿里云 ECS。当前项目是 Vite + React 的纯前端静态站点，生产环境只需要提供 `dist/` 中的文件，不需要运行 Node.js 常驻进程。

## 1. 当前项目的部署事实

- 构建命令：`npm run build`
- 构建产物：项目根目录下的 `dist/`
- 主站入口：`dist/index.html`
- 产品工作台入口：`dist/whiteboard.html`
- `public/` 下的图片、音频、字体、模型和其他静态资源会原样复制到 `dist/`
- 已移除的私人页面和历史实验页面保存在本地 `archive/`，不会进入构建产物，也不应提交回仓库。
- 首页通过 `/whiteboard.html` 加载产品工作台 iframe，因此 `whiteboard.html` 必须和 `index.html` 一起部署
- 当前白板默认使用浏览器 `localStorage`，访客之间不会共享数据；部署站点本身不需要数据库
- 当前页面引用了 Google Fonts；如果服务器或访客网络无法访问 Google Fonts，页面仍可显示，但会回退到系统字体

推荐架构：

```text
浏览器 → 阿里云 ECS（Nginx） → dist/ 静态文件
                         └── 可选：HTTPS 证书
```

## 2. 准备阿里云资源

### 2.1 ECS

建议准备一台 Linux ECS，系统可选 Ubuntu 22.04/24.04 或 Alibaba Cloud Linux。这个站点是静态站点，低流量场景不需要较高配置。

需要记录：

- ECS 公网 IPv4
- SSH 登录用户名和方式
- 服务器系统版本
- 计划绑定的域名，例如 `www.example.com`

### 2.2 安全组

在 ECS 安全组中放行：

- `22/TCP`：仅用于 SSH，建议把来源限制为自己的固定 IP；如果暂时无法限制，部署后应尽快收紧
- `80/TCP`：HTTP，用于访问网站和申请/续期证书
- `443/TCP`：HTTPS，正式访问网站

不要为了部署开放不必要的端口。Nginx 只需要监听 `80` 和 `443`。

### 2.3 域名解析

在域名 DNS 控制台添加：

| 类型 | 主机记录 | 记录值 |
| --- | --- | --- |
| A | `@` | ECS 公网 IPv4 |
| A | `www` | ECS 公网 IPv4 |

如果只使用一个域名，另一个记录可以不配，但 Nginx 的 `server_name` 应与实际访问域名一致。DNS 生效时间取决于 TTL 和本地缓存，部署时可以先直接用公网 IP 验证。

## 3. 第一次部署：在服务器构建

以下以 Ubuntu/Debian 为例。Alibaba Cloud Linux 的包管理器通常使用 `dnf` 或 `yum`，将对应命令替换即可。

### 3.1 安装基础工具和 Node.js

```bash
sudo apt update
sudo apt install -y git nginx
```

Node.js 建议使用当前项目要求的兼容版本。先查看本地开发环境版本：

```bash
node --version
npm --version
```

服务器上安装相同的大版本后，再继续部署。若服务器尚未安装 Node.js，可以使用 NodeSource、nvm 或系统软件源安装；不要在项目中提交 Node.js 安装脚本或服务器密钥。

### 3.2 获取项目代码

将项目放到服务器目录，例如：

```bash
sudo mkdir -p /var/www
sudo chown "$USER":"$USER" /var/www
cd /var/www
git clone <仓库地址> hresh-website
cd /var/www/hresh-website
```

如果仓库是私有仓库，建议使用服务器专用的只读 Deploy Key 或在本地构建后上传 `dist/`，不要把个人 GitHub Token 写进命令、脚本或仓库。

### 3.3 安装依赖并构建

```bash
cd /var/www/hresh-website
npm ci
npm run build
```

构建成功后，确认关键文件存在：

```bash
test -f dist/index.html
test -f dist/whiteboard.html
```

若 `npm ci` 报 lockfile 或 Node.js 版本错误，先统一服务器 Node.js 版本，不要直接删除 `package-lock.json`。

## 4. 配置 Nginx

创建站点配置：

```bash
sudo nano /etc/nginx/sites-available/hresh-website
```

写入以下内容，并将域名替换成真实域名：

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name example.com www.example.com;

    root /var/www/hresh-website/dist;
    index index.html;

    # 保证首页、白板入口和静态资源都能直接访问。
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存；带 hash 的 Vite 资源可以长缓存。
    location ~* \.(?:css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|wasm|glb|mp3|json)$ {
      try_files $uri =404;
      expires 7d;
      add_header Cache-Control "public, max-age=604800";
    }

    # 基础安全响应头；当前白板使用 Supabase，需放行 REST 和 Realtime WebSocket。
    # 这组严格策略适用于首页、白板和当前构建的应用页面。
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; frame-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self'; connect-src 'self' https://nfadcwmzchtbmizyllbd.supabase.co wss://nfadcwmzchtbmizyllbd.supabase.co" always;

    # 不让 Nginx 返回隐藏文件；必要时可按需放开特定文件。
    location ~ /\. {
        deny all;
    }
}
```

启用配置并检查：

```bash
sudo ln -s /etc/nginx/sites-available/hresh-website /etc/nginx/sites-enabled/hresh-website
sudo nginx -t
sudo systemctl reload nginx
```

如果系统启用了默认站点，访问 IP 时仍显示 Nginx 欢迎页，可以停用默认站点后重新检查：

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

只有确认默认站点路径确实是 `/etc/nginx/sites-enabled/default` 时才执行删除；不要使用通配符批量删除 Nginx 配置。

## 5. 部署后的验收

先在服务器本机检查响应：

```bash
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/whiteboard.html
```

然后在浏览器检查以下路径：

1. `http://你的域名/` 能打开首页。
2. 首页的“产品工作台”能正常加载，不出现 iframe 空白。
3. `http://你的域名/whiteboard.html` 可以直接打开。
4. 作品集图片、头像、音频、字体和 3D 模型没有 404。
5. 移动端和桌面端各刷新一次，确认没有资源路径大小写问题。
6. 浏览器开发者工具的 Console 和 Network 中没有阻断页面使用的错误。

如果首页能打开但白板空白，优先检查：

- `dist/whiteboard.html` 是否存在；
- Nginx 是否把 `/whiteboard.html` 错误回退成了首页；
- 浏览器 Network 中 `/src/whiteboard/main.jsx` 是否仍被请求。生产环境不应直接请求 `/src/`，应请求 `/assets/` 下的构建文件。

## 6. 配置 HTTPS

正式上线建议使用 HTTPS。证书可以使用阿里云证书服务申请/下载，也可以在服务器上使用 Certbot 申请 Let’s Encrypt 证书。无论使用哪种方式，流程都是：

1. 确认域名 A 记录已经指向 ECS。
2. 确认安全组放行 `80` 和 `443`。
3. 为实际使用的域名申请证书，例如 `example.com` 和 `www.example.com`。
4. 将证书配置到 Nginx 的 `443` server 中。
5. 将 `80` 的请求重定向到 HTTPS。
6. 用浏览器和 `curl -I https://你的域名/` 验证。

证书私钥只能保留在服务器证书目录，不能提交到 Git、上传到 `public/` 或写入文档。

典型的 HTTP 跳转配置如下，证书配置由证书服务或 Certbot 生成后再合并：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}
```

配置完成后：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. 后续更新和回滚

### 7.1 服务器构建并发布

先备份当前可用产物，再拉取代码和构建：

```bash
cd /var/www/hresh-website
tar -czf /var/www/hresh-website-dist-$(date +%Y%m%d-%H%M%S).tar.gz dist
git pull --ff-only
npm ci
npm run build
sudo nginx -t
sudo systemctl reload nginx
```

`git pull --ff-only` 不会自动制造合并提交；如果工作区有未提交改动或远端发生分叉，应先停下处理，不要在服务器上强制覆盖代码。

### 7.2 本地构建后上传

也可以在本地完成验证后，只上传构建产物。建议使用带时间戳的临时目录，确认完整后再切换 Nginx 的 `root`：

```bash
npm ci
npm run build
rsync -avz --delete dist/ <用户名>@<服务器IP>:/var/www/releases/hresh-website-<版本号>/
```

然后将 Nginx 的 `root` 改为对应 release 目录，检查并 reload：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

不要在用户未确认前执行 `rsync --delete` 指向当前线上目录；它会删除目标目录中本地没有的文件。更稳妥的做法是保留最近几个 release，出现问题时把 `root` 切回上一版。

## 8. 当前白板的可选 Supabase 模式

代码中的 `src/whiteboard/data.js` 会从 Vite 环境变量读取配置，默认仍是本地模式：

```js
MODE: import.meta.env.VITE_WHITEBOARD_MODE || 'local'
SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || ''
SUPABASE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
```

如果要启用共享白板，在项目根目录创建 `.env.local`：

```env
VITE_WHITEBOARD_MODE=supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

旧版控制台如果只有 anon key，可以改用 `VITE_SUPABASE_ANON_KEY`。`.env.local` 已被 Git 忽略，不要把真实值写进源码、`public/` 或文档。

需要完成：

- 创建 Supabase 项目；
- 建立 `wb_cards`、`wb_strokes`、`wb_votes`、`wb_admins` 表及 RLS 策略；
- 配置匿名登录；
- 在本地 `.env.local` 和服务器构建环境中配置 Supabase URL 与 publishable/anon key；
- 验证匿名访客、管理员、投票、实时同步和断网回退。

Supabase `anon key` 可以按其设计用于前端，但 service-role key、数据库密码和其他服务端密钥绝不能放入前端代码或 `public/`。在未完成 RLS 审核前，不要切换到共享模式。

## 9. 常见问题

### 页面 403 或 404

检查目录权限和 Nginx root：

```bash
namei -l /var/www/hresh-website/dist/index.html
sudo nginx -T | sed -n '/server_name example.com/,/^[[:space:]]*}/p'
```

### 页面打开但图片 404

本项目使用以 `/` 开头的绝对资源路径。应从域名根路径部署，不要把站点直接挂在 `/hresh/` 子目录下，除非同时修改 Vite 的 `base` 和代码中的资源路径。

### 直接访问 `/whiteboard.html` 被返回首页

确认 `dist/whiteboard.html` 存在，并让 Nginx 先尝试 `$uri`，再进行 `/index.html` fallback。不要把所有请求无条件 rewrite 到首页。

### 修改后浏览器仍显示旧页面

先确认服务器上的 `dist/` 时间和文件内容，再检查浏览器缓存、CDN 缓存和 Nginx 的 `Cache-Control`。HTML 不建议设置很长的缓存时间；带 hash 的 JS/CSS 可以长缓存。

### HTTPS 证书申请失败

检查 DNS 是否已生效、域名是否解析到当前 ECS、`80` 端口是否放行，以及 Nginx 是否能直接响应 ACME 验证请求。

## 10. 部署前清单

- [ ] ECS 公网 IP 已确认
- [ ] 安全组已放行 `22`、`80`、`443`
- [ ] 域名 A 记录已指向 ECS
- [ ] 服务器 Node.js 版本与本地兼容
- [ ] `npm ci` 成功
- [ ] `npm run build` 成功
- [ ] `dist/index.html` 和 `dist/whiteboard.html` 存在
- [ ] Nginx `root` 指向 `dist/`
- [ ] `nginx -t` 通过
- [ ] 首页、白板和作品集静态资源已检查
- [ ] HTTPS 已配置并验证
- [ ] 已保留上一版产物，能够回滚
- [ ] 未把密码、Token、证书私钥或 service-role key 放入仓库
