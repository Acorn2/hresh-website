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
- `supabase/setup.sql`: 受控互动墙数据库结构、RLS、限流函数和旧白板迁移。
- `supabase/functions/whiteboard-write/`: 投稿与投票的唯一远端写入入口。
- `public/`: 当前首页、产品工作台、作品集和 Skills 使用的静态资源。

## Controlled Visitor Wall

线上 Supabase 模式采用“投稿审核后发布”，不是匿名实时共享画布：

- 公开页面只读取审核后的卡片和聚合票数。
- 留言、名片和贴纸只经过 Edge Function 进入待审核区，不依赖第三方验证码。
- Edge Function 使用蜜罐、填写时长、IP/设备/全站限流、重复检测和待审核队列上限控制滥用。
- 访客图片与远端共享涂鸦默认关闭；涂鸦仅保存在当前浏览器。
- 写入开关默认关闭，数据库权限测试通过后再开启。

部署顺序：

1. 在 Supabase SQL Editor 执行 `supabase/setup.sql`。旧访客卡只迁入待审核区，旧表不会删除。
2. 为 Edge Function 配置 `WHITEBOARD_HASH_SALT`、`WHITEBOARD_ALLOWED_ORIGINS`，保持 `WHITEBOARD_WRITE_ENABLED=false`。
3. 部署 `supabase/functions/whiteboard-write`。
4. 根据 `.env.example` 配置前端公开变量，并设置 `VITE_WHITEBOARD_MODE=supabase`。
5. 使用 `npm run test:rls` 验证匿名客户端只有读取权限。
6. 完成一次测试投稿、审核发布、限流和投票后，再将 `WHITEBOARD_WRITE_ENABLED` 改为 `true`。

管理员在 `wb_submissions` 表中筛选 `pending`：将 `status` 改为 `published` 即发布，改为 `rejected` 即拒绝；已发布内容改为 `archived` 会自动撤回。详细数据流、配额和回退方式见 `ARCHITECTURE.md`。

当前方案不使用 CAPTCHA。蜜罐和填写时长只能拦截低成本脚本，不能证明访问者一定是真人；安全底线由审核前不公开、严格写入配额、最多 100 条待审核内容和可随时关闭的写入开关共同保证。

## Updating The Homepage

产品信息集中维护在 `src/components/homeData.js`。公开链接仅在确认可访问后再补充，避免把未上线产品误导为公开服务。

## 致谢与二次开发说明

本网站的视觉设计语言、部分页面结构与交互思路参考了 [Esther Design System](https://github.com/esthersjw/esther-design-system)，并在此基础上结合 Hresh 赫什的品牌、产品内容和白板功能进行了二次开发。网站中的 Hresh 品牌、头像、产品资料和新增业务代码不代表原作者制作、授权、合作或背书。

上游项目采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 发布。对参考或改编上游内容的分发，应保留来源署名、许可证链接并说明修改；该许可证包含非商业限制。当前网站包含 App Store 产品和其他产品展示，若网站用于商业推广或产生商业收益，应先取得原作者对相关使用范围的明确许可。
