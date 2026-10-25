# 小小实验室 · Cloudflare / GitHub Actions

12个月、365天家庭跨学科探究，4–16岁分龄引导，四步可视化操作与成人准备提醒。涵盖物理、化学、数学、生物、历史、地理与生活常识；历史为证据探究，模型不等同于真实世界实验。

公开自定义域名：https://labs.996fb.cn 。域名由所有者在 Cloudflare 配置，本次代码不修改 DNS 或绑定。

**当前分支为家庭账户候选版，尚未激活生产：新增邮箱验证码登录、家长/儿童隔离、D1 云进度及管理员解锁。部署策略保持关闭，数据库 UUID 为阻断占位符；现网仍以原已部署版本为准。邮箱域名、私有首次管理员邮箱、邮件投递服务和新增资源须另行确认。手机与微信登录未实现。**

详细启用、私有配置和恢复要求见 [`docs/account-operations.md`](docs/account-operations.md)。不能把代码或 CI 成功当作生产上线/合规认证。

## 目录与检查

- `dist/`：5 个应用资源；完整课程与图示受 Worker 鉴权保护，不可直接公开。
- `worker/`、`migrations/`：同源账户 API、访问控制及 D1 数据表迁移。
- `wrangler.jsonc`：Worker-first Assets + 单个待批准 D1 绑定，无 R2/KV 或新增 DNS 路由。
- `.github/workflows/cloudflare.yml`：检查及条件式发布。
- `.github/deployment-policy.json`：目标核验和经过所有者批准的发布开关。
- `scripts/deploy-guard.mjs`：发布前校验仓库、分支、账户、Worker与资源范围。
- `package-lock.json`：完整锁文件，Wrangler固定 `4.151.3`。

使用 Node.js 24：

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run check:syntax
npm test
npx --no-install playwright install --with-deps chromium
npm run test:browser
npm run deploy:dry-run
```

`dist/` 已是界面输出，Wrangler 将服务端 Worker 与课程数据打包。`deploy:dry-run` 只验证打包，不正式发布。浏览器测试运行真实 Worker + 本地合成 D1/邮件替身，测试服务不部署。

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
- 在无登录浏览器验证首页、年龄切换、全年月份地图、步骤与材料、安全确认、图示放大、记录与刷新保留，再分享。
- 变更域名会产生新的浏览器来源；Sites、workers.dev 与 labs.996fb.cn 的本地记录互不共享，不会因绑定自定义域名自动迁移。
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

## 全年版内容与验收边界

- 365个主活动对应12个课程月，月长度31/28/31/30/31/30/31/31/30/31/30/31；不是绑定公历的连续打卡任务。每日延伸可选，不宣称730个独立实验。
- 原有1—30日保留原ID及标题，localStorage键little-lab-v2与day:age映射不变。同域名浏览器旧记录保留；不同域名是不同存储来源，不能自动搬移。
- 新活动包含问题、解决尝试、学习所得、下一步改进、结论边界，以及来源与核查范围。内容审查不等于实地试做、真人专家认证或法律合规认证。
- 原30日保留专门装置示意；新增活动使用按活动材料、步骤、记录字段组织的操作关系图。图形家族复用，不宣称5840幅独立手绘图。
- CI测试365个ID、七类覆盖、标题/完整步骤精确重复、分龄字段、每条来源URL格式、5840个图示渲染组合、日期计算和部署边界。程序检测不证明科学事实正确；事实和安全审查另行执行。
- 全年图谱默认当前课程月，提供月份、学科、标题/材料联合筛选。记录和进度仍只在浏览器本地；不上传儿童资料。
- 发布应在功能分支完成整组文件、清单和测试，通过PR检查后一次性合并，避免部分静态文件进入main触发不完整部署。

### 后续内容更新不能重编号

首次全年版发布会固定 `scripts/activity-identities.json` 中365个ID与contentKey的对应关系。浏览器记录使用这些ID，因此改正文不能把第N天换成另一个主题；不能通过重新排序数组给活动重编号。后续展示顺序若需调整，应另行设计独立排序字段和兼容迁移。

`scripts/integrate-annual.mjs` 仅在首次构建时交织学科并分配ID；全年元数据存在时默认拒绝重建。`--refresh-reviewed` 仅接受同一组contentKey的已审查修正，保留全部ID，不允许增删或更换身份。全年版之后的新活动、第二年计划须另行设计追加ID与迁移，不复用旧编号。身份注册表更改必须专门审查，不能为了通过测试直接刷新。

### Dots看板
`/#dots` 展示 2026-10-23 采集的 Dots 云端执行容器可见信息，属于发布时固定快照，不是实时监控，也不是模型推理服务器或 Cloudflare Workers 的硬件配置。仅展示系统、可见资源和软件版本允许列表；型号中的“80-Core”不代表分配80核，内核内存统计不是已验证硬限额，虚拟磁盘已用/剩余统计不公开为真实占用。

### 全年来源核查记录
- [物理与化学](docs/annual-science-evidence.md)
- [数学与历史](docs/annual-math-history-evidence.md)
- [生物与地理](docs/annual-nature-life-evidence.md)
- [生活常识](docs/annual-everyday-evidence.md)

所有资料核查均不等于现实家庭试做或真人专家审签。持续维护须保留活动ID、证据范围和旧记录字段语义；不要通过重排编号覆盖既有成长记录。
