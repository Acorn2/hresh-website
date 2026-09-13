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
- `public/`: 当前首页、产品工作台、作品集和 Skills 使用的静态资源。

## Updating The Homepage

产品信息集中维护在 `src/components/homeData.js`。公开链接仅在确认可访问后再补充，避免把未上线产品误导为公开服务。

## 致谢与二次开发说明

本网站的视觉设计语言、部分页面结构与交互思路参考了 [Esther Design System](https://github.com/esthersjw/esther-design-system)，并在此基础上结合 Hresh 赫什的品牌、产品内容和白板功能进行了二次开发。网站中的 Hresh 品牌、头像、产品资料和新增业务代码不代表原作者制作、授权、合作或背书。

上游项目采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 发布。对参考或改编上游内容的分发，应保留来源署名、许可证链接并说明修改；该许可证包含非商业限制。当前网站包含 App Store 产品和其他产品展示，若网站用于商业推广或产生商业收益，应先取得原作者对相关使用范围的明确许可。
