# 小小实验室 · Cloudflare / GitHub Actions

30天家庭科学实验，4–16岁分龄引导，四步可视化操作与成人准备提醒。

**本仓库是浏览器本地记录版。没有邮箱/手机号登录、云数据库、儿童个人账户隔离或跨设备同步。所有者已授权main自动部署；是否实际公开上线，以GitHub Actions发布结果为准，不能把仓库上传成功当作上线成功。**

## 目录与检查

- `dist/`：实际公开资源，5个文件；应用无第三方运行时依赖。
- `wrangler.jsonc`：Cloudflare Workers Static Assets 配置，无 D1/R2/KV、DNS路由或服务端逻辑。
- `.github/workflows/cloudflare.yml`：检查及条件式发布。
- `.github/deployment-policy.json`：目标核验和经过所有者批准的发布开关。
- `scripts/deploy-guard.mjs`：发布前校验仓库、分支、账户、Worker与资源范围。
- `package-lock.json`：完整锁文件，Wrangler固定 `4.151.3`。

使用 Node.js 24：

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run check:syntax
npm test
npm run deploy:dry-run
```

这是无构建步骤的网站，`dist/` 已是输出。`deploy:dry-run` 只验证打包，不正式发布。

## 工作流的边界

| 触发 | 检查 | 发布 |
|---|---|---|
| 向 main 提交的 PR（含fork） | 运行；不引用Cloudflare密钥 | 永不发布 |
| main push | 运行 | 通过所有检查及启用条件后才发布 |
| 手动选择main运行 | 运行 | 同样需要全部启用条件 |
| 手动选择其他分支运行 | 运行 | 不发布 |

全局 `GITHUB_TOKEN` 仅 `contents: read`，checkout不持久化凭据；不使用 `pull_request_target` 或 `workflow_run`。外部 Actions 已固定到核验过的完整提交SHA。依赖使用 `npm ci --ignore-scripts`，不共享依赖缓存。Cloudflare令牌仅传入最后一个发布步骤，不传给安装与测试。

发布作业使用 `cloudflare-production` 环境及串行并发组，不强制中止正在进行的发布。串行化不代表排队顺序严格FIFO。并发检查可以取消旧检查。

## 已批准的自动部署与最小配置

所有者已于2026-10-23确认账户、Worker名 `little-lab-30-q7r8`，并明确授权：main通过检查后自动公开部署，以及执行首次发布。所有者已报告完成空白Worker和Environment凭据配置；其实际可用性以发布结果为准。

已确认Account ID记录在公开的 `.github/deployment-policy.json` 中，用于防止发错账户；它不是认证密钥。API Token绝不能写入源码、聊天或日志。

- **必需的源码开关：** `.github/deployment-policy.json` 的 `enabled=true` 才能部署。检查作业输出此布尔值，发布前还会再次核验策略。
- **可选的仓库停用开关：** `CLOUDFLARE_DEPLOY_ENABLED` 不需要创建；未设置或字符串 `true` 允许继续。明确设置为字符串 `false` 会停止后续发布，其他非空值也会阻止发布。已有的 `false` 不会被默认值覆盖。
- **Environment：** `cloudflare-production`，其中Actions Variable `ACCOUNT_ID` 必须等于策略中的已批准账户；Actions Secret `CLOUDFLARE_API_TOKEN` 仅传给最后的发布步骤。账户缺失或不一致时守卫会停止，不会自动选取另一个账户。
- 仅main的push或手动main运行可以发布；PR和其他分支永不发布。必须先通过检查，随后部署同一个提交。环境审批和分支保护若已配置，仍然生效。
- 使用长期保存的CI令牌意味着今后main更新可能自动公开发布。保护main、限制仓库写入者，严格审查工作流和锁文件；仅写上Environment名称不会自动建立审批保护规则。

部署令牌应限定为已确认账户中的**这一个已存在Worker**，角色为 **Editor**。这个角色能部署已有Worker，不能创建或删除Worker；不要授予D1、KV、R2、DNS、其他Worker或管理员权限。不要把旧版 `Workers Scripts / Edit` 产品级权限当作单Worker范围。如果界面缺少指定Worker的Editor选项，先核对，不静默扩大权限。

首次目标Worker由所有者新建为空白Worker；若日后遇到不属于本项目的同名Worker，不覆盖。API令牌到期、缺失或权限不足时，应检查实际失败原因，不通过更换账户或扩大权限绕过。

## 如何确认上线、暂停或回滚

- 以发布步骤成功结果和Cloudflare返回的真实版本/网址为准；不要自行拼接网址来声称上线。
- 在无登录浏览器验证首页、年龄切换、30天地图、步骤与材料、安全确认、图示放大、记录与刷新保留，再分享。
- 变更域名会产生新的浏览器来源；现有Sites本地记录不会自动迁移。
- 暂停后续发布：把可选仓库变量 `CLOUDFLARE_DEPLOY_ENABLED` 改为 `false`，或把源代码策略 `enabled` 改为 `false`。此操作不取消已经开始的部署，也不下线已公开的网站。
- 内容回滚优先通过审查过的revert PR合并main，再按正常流程发布。不在这个工作流里自动删除Worker或数据库。

## 后续维护

只改 `dist/` 中所需文件。若静态内容变化，运行 `npm run manifest:update` 更新当前资产哈希，然后一起审核资源和清单差异。`source-manifest.json` 的 `sourceCommit` 仅记录最初Sites来源提交，不表示最新GitHub提交。

更新Actions或Wrangler时另开PR，核验官方发布、更新完整SHA或锁文件、执行测试，再合并。不启用自动合并。

这套CI/CD可以让代码变更和发布更可追溯，但并不自动保证网站内容、安全、供应链或儿童隐私万无一失。用户账户和云端记录需要另行设计、授权、开发与验证；当前工作流不会创建D1。

## 官方依据与核验

- [Cloudflare：GitHub Actions部署](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare：Worker级角色与资源范围](https://developers.cloudflare.com/workers/authorization/workers/)
- [Cloudflare：API token权限](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
- [GitHub：部署Environment和并发](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)
- [GitHub：安全使用Actions](https://docs.github.com/en/actions/reference/security/secure-use)
- [已核验的Actions提交](ACTION-PINS.md)
- [本地核验范围与限制](VERIFICATION.md)
