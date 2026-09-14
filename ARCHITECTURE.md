# Architecture

更新日期：2026-09-14

## 产品边界

线上白板是“站长策展的访客互动墙”，不是匿名实时协作平台。本地模式保留自由编辑和涂鸦，线上模式的公共状态只能由审核流程改变。

## 取：用户如何获得结果

### 公开浏览

1. 页面直接读取 `wb_public_cards`，不创建匿名账号。
2. 页面读取 `wb_vote_counts` 聚合结果，不读取投票身份。
3. 首次加载后每 60 秒刷新，单次最多读取 200 张卡片。
4. 代码内置的品牌与产品种子卡始终可用；数据库故障不会把未审核本地内容冒充为公开内容。

### 管理员审核

1. 管理员在 Supabase Table Editor 查看 `wb_submissions` 中的 `pending` 行。
2. 将 `status` 改为 `published` 时，数据库触发器把安全卡片数据复制到 `wb_public_cards`。
3. 改为 `rejected` 不公开；已发布内容改为 `archived` 时自动从公开表撤回。

## 存：数据分层

- `wb_submissions`：私有原始投稿和审核状态，公开客户端没有读写授权。
- `wb_public_cards`：审核后的公开投影，客户端只有读取授权。
- `wb_public_votes`：服务端生成的投票身份哈希和选择，删除卡片时级联删除。
- `wb_vote_counts`：只暴露按卡片与选项聚合后的数量。
- `wb_rate_limits`：Edge Function 使用的固定时间窗计数器，公开客户端不可见。
- 旧 `wb_cards`、`wb_strokes`、`wb_votes`：迁移后保留用于回退，但撤销公开权限并移出 Realtime publication。

## 进：数据如何进入

```text
访客表单
  → whiteboard-write Edge Function
      → Origin 检查
      → 隐藏蜜罐与填写时长检查
      → 字段白名单与长度检查
      → IP / 设备 / 全站小时与每日限流
      → 同一来源 24 小时重复内容检查
      → 待审核队列上限检查
  → wb_submissions.pending
  → 管理员审核
  → wb_public_cards
```

投票走同一函数，使用 IP 与设备组合哈希、每卡唯一约束和独立频率限制。浏览器只保存自己的当前选择，用于界面标记，不把服务端哈希公开。

## 安全边界

- `SUPABASE_SERVICE_ROLE_KEY` 和哈希盐只能存在于 Edge Function 环境。
- 浏览器仅持有 Supabase publishable/anon key，不持有任何服务端密钥。
- `WHITEBOARD_WRITE_ENABLED` 默认关闭，必须在部署和权限验证后显式开启。
- `WHITEBOARD_ALLOWED_ORIGINS` 必须使用完整、精确的生产域名；不支持通配符。
- 图片、HTML 和任意模板数据不进入投稿接口；服务端从白名单字段重建卡片。
- 当前不使用第三方 CAPTCHA。蜜罐和填写时长属于低成本启发式检测，可被定制脚本伪造，不能替代审核、限流和熔断。

## 配额与生命周期

- 投稿：单 IP 2 次/10 分钟、5 次/天；单设备 2 次/10 分钟、3 次/天；全站 20 次/小时、50 次/天。
- 自动熔断：待审核内容达到 100 条时停止接收新投稿，管理员处理后自动恢复。
- 投票：单 IP 30 次/小时；全站 1000 次/天。
- 待审核建议保留 7 天，拒绝/归档内容建议保留 30 天。
- 限流计数建议保留 2 天。

定时清理 SQL 已写在 `supabase/setup.sql` 末尾，但不会自动创建 Cron，避免未经确认删除数据。

## 回退

- 立即止血：将 Edge Function 的 `WHITEBOARD_WRITE_ENABLED` 改为 `false`，公开读取仍可用。
- 前端回退：将 `VITE_WHITEBOARD_MODE` 改为 `local`，网站恢复为单浏览器白板，不访问云端写接口。
- 数据回退：旧表没有被删除；重新授权前必须重新评估匿名写入风险。
