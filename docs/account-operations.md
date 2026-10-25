# 家庭账户：部署与恢复边界

此分支是**待激活实现**。`.github/deployment-policy.json` 中 `enabled:false`、`runtimeApproved:false` 和全零数据库 UUID 是有意的阻断，不应为了让流水线通过而删除。现有公开站点不因本地文件变化而改变。

## 激活前逐项确认

1. 家长注册邮箱域名白名单、私有的首次管理员邮箱、逐关解锁规则及隐私告知内容。
2. 仅为此项目创建 `little-lab-family-progress` D1 数据库，绑定名 `DB`，把实际 UUID 同时固定到 Wrangler 与部署策略；不得复用其他项目数据库。新资源/权限需要项目所有者确认。
3. 保持 `assets.run_worker_first:true`；否则静态资源可能绕过登录鉴权。只经 `/api/children/:id/curriculum` 返回当前儿童获准的内容；禁止公开原始 `data.json`。
4. 每日 `03:17 UTC` 定时任务仅清理到期的验证码、会话及限流数据。它不是学习进度删除任务。
5. 在 GitHub 的 `cloudflare-production` Environment **Secrets** 中提供 `RESEND_API_KEY`、`EMAIL_FROM`、`BOOTSTRAP_ADMIN_EMAIL` 三项。不得使用 Actions Variables 代替私有配置：变量可能出现在公开运行日志。启用后的串行生产流程仅向精确 Worker 同步这些私有配置，固定 `EMAIL_PROVIDER=resend`、`REGISTRATION_ENABLED=true`，并仅在不存在时生成 32 字节随机 `AUTH_SECRET`；已有认证密钥保持不变。不得把值放入仓库、Issue、日志或聊天。首次管理员邮箱只允许其已验证的邮箱取得初始管理权，避免抢注。可注册域名仅从 D1 后台设置读取，初始为空列表，忽略旧环境域名变量；仅允许该私有管理员邮箱引导注册，管理员以后在后台设置普通注册域名。普通新用户默认开放第 1 关，完成后逐关解锁；管理员可以重新锁定或整账户解锁。
6. 当前待审配置没有邮件绑定。所有者已选择已有 Resend 服务；仍须确认其已验证发送域名、完整发件地址及最小必要发送权限。若选择 Cloudflare Email Sending，须另审精确 `EMAIL` 绑定及发送域名配置；当前守卫会拒绝未经审查的新增绑定。不得自动购买付费计划。普通 Email Routing 的已验证收件人发送不能替代向任意注册邮箱投递验证码。
7. 用实际邮箱验证验证码投递、退信/垃圾邮件情况、域名政策和管理员初始化。密钥“名称存在”不证明值正确或邮件可达。确认实际凭据有精确账户的 Worker 编辑及 D1 所需权限，已有只读探针不证明建库/写入权限。
8. 在受审 PR 中开启策略，必须先通过内容、实际 Workers/D1、桌面/手机浏览器和独立安全审查。不得把只通过静态检查称为生产验收。

`APP_ORIGIN` 为公开的 `https://labs.996fb.cn`；精确 Origin 检查意味着不应将其他域名当作等价登录入口。`keep_vars:true` 保留控制台私有运行时配置。所有测试数据使用 `.test` 地址，测试服务及 `/__test/*` 不属于生产 Worker。

## GitHub Actions 与迁移

PR 的测试不读取 Cloudflare Secrets。部署只允许受审主分支、精确仓库/账号/Worker，并且可以由源策略或仓库停用开关关闭。令牌仅注入最终部署步骤，不注入依赖安装、内容或浏览器测试。

最终步骤先在精确目标上同步上述获批私有配置（可能创建新的 Worker 配置版本），再检查运行时 Secret **名称**，获取并记录 D1 Time Travel 恢复书签，然后应用 `migrations/` 下的迁移，最后发布 Worker。失败时停止，不尝试清空数据库、恢复旧快照或导出用户数据。迁移文件一旦生产执行，不能通过修改旧文件“撤销”；后续只增加编号的新迁移。任何破坏性迁移须另审。

由于数据库迁移与 Worker 发布不是同一事务，迁移应向后兼容当前运行版本。若迁移成功但发布失败，应先诊断并重试发布/作向前修复。账户上线后，不应回滚到原有无鉴权的纯静态站点，这会重新开放受限内容。

## 恢复与持久性

D1 是云端持久存储，不是无期限、无故障保证。用户应能导出自己的数据。D1 Time Travel 当前 Free 为 7 天、Paid 为 30 天；期限与计划须在运维时核实。书签只是恢复定位信息，不是独立备份。恢复会覆盖数据库状态并影响用户写入，因此必须先停止相关写入、核实目标与影响、取得明确批准，再由专门恢复流程执行；本流水线绝不自动恢复。

额外加密备份、保留期限、存储位置、删除请求处理和恢复演练需另行制定，不能在未配置时宣称已具备。管理员的停用与归档是可恢复管理操作，不等于数据已经永久删除。

## 可复现本地验证

- `npm ci --ignore-scripts --no-audit --no-fund`
- `npm run check:syntax && npm test`
- `npm run test:browser`（需可运行的 Chromium/Chrome）
- `npm run deploy:dry-run`（仅打包检查，不联网部署）

实际 Worker 集成测试使用 Miniflare/workerd 与内存 D1，真实迁移及真实 API。测试邮件由本地出站替身捕获，禁止真实外发；不会给生产加入测试登录后门。测试环境会删除合成数据，不得指向生产数据库。

## 官方依据

- Workers 静态资源鉴权顺序：https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- D1 迁移：https://developers.cloudflare.com/d1/reference/migrations/
- D1 Time Travel：https://developers.cloudflare.com/d1/reference/time-travel/
- Cloudflare Email Sending 与 Routing 区别：https://developers.cloudflare.com/email-service/
- 发送域名配置：https://developers.cloudflare.com/email-service/get-started/send-emails/
- Worker 邮件绑定 API：https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
