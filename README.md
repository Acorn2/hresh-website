# Hresh赫什个人网站

这是 Hresh赫什的个人产品网站：用 AI 把想法做成产品。网站以桌面系统为视觉语言，集中展示独立产品、产品工作台和公开构建过程。

## Development

```bash
npm install
npm run dev
```

Create a production deployment with:

```bash
npm run build
```

## Project Structure

- `src/App.jsx`: React application entry and lifecycle boundary.
- `src/components/HomePage.jsx`: 首页、产品目录和产品工作台入口。
- `src/components/homeData.js`: 桌面入口、产品工作流和产品组合数据。
- `src/styles/site.css`: Homepage styles and animation definitions.
- `src/lib/siteController.js`: Homepage interaction controller: tabs, terminal launch, desktop windows, canvas loading, pointer interactions, and exit loop.
- `src/whiteboard/`: 本地优先的产品工作台白板。
- `public/`: 静态资源；`hresh-avatar-transparent.png` 是网站使用的透明个人 IP 头像，`hresh-avatar.png` 保留为原始母版。

## Updating The Homepage

产品信息集中维护在 `src/components/homeData.js`。公开链接仅在确认可访问后再补充，避免把未上线产品误导为公开服务。
