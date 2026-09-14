# Tech Stack

更新日期：2026-09-14

| 组件 | 选择 | 原因 | 最简单替代 / 放弃条件 |
|---|---|---|---|
| 公开页面 | React 19 + Vite 8 | 延续现有项目，不增加前端框架 | 如果白板不再需要交互，可改为静态展示 |
| 公共数据 | Supabase Postgres + RLS | 复用现有数据库，使用表级授权隔离公开投影 | 如果投稿量长期接近零，可改为静态 JSON |
| 写入网关 | Supabase Edge Function | 服务端持有密钥，集中完成校验、限流和投稿写入 | 如果未来已有统一后端，可迁移到该后端 API |
| 反滥用 | Edge Function 内建启发式检查与配额 | 不依赖第三方 CAPTCHA；用蜜罐、填写时长、限流、去重、审核队列上限控制最坏损失 | 垃圾投稿明显增加时再接入独立 CAPTCHA |
| 内容同步 | 60 秒轮询 | 降低 Realtime 消息放大和授权开销 | 只有确有秒级互动需求时恢复“仅已发布内容”的 Realtime |
| 图片 | MVP 不支持 | 避免 Base64、对象存储审核和生命周期成本 | 恢复时必须使用隔离 bucket、类型/大小限制和审核后公开 |
| 审核工具 | Supabase Table Editor | 单人运营阶段零额外后台代码 | 审核量稳定增长后再建设最小管理页 |

## 配置边界

浏览器变量见 `.env.example`，只允许公开值。Edge Function 的 server-only 变量见 `supabase/functions/.env.example`，真实值不得提交。

## 验证命令

```bash
npm run build
npm run test:rls
```

`test:rls` 需要临时提供 Supabase URL、anon key 和 service-role key；脚本只创建带 `rls-test-` 前缀的临时卡片并在结束时清理。不要将这些值写入仓库或命令历史。
