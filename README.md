# 小小实验室 · Cloudflare / GitHub Actions

30天家庭科学实验，4–16岁分龄引导，四步可视化操作与成人准备提醒。

**本仓库是浏览器本地记录版。没有邮箱/手机号登录、云数据库、儿童个人账户隔离或跨设备同步。现阶段部署关闭，不能把仓库上传成功称为 Cloudflare 上线成功。**

## 目录与检查

- `dist/`：实际公开资源，5个文件；应用无第三方运行时依赖。
- `wrangler.jsonc`：Cloudflare Workers Static Assets 配置，无 D1/R2/KV、DNS路由或服务端逻辑。
- `.github/workflows/cloudflare.yml`：检查及条件式发布。
- `.github/deployment-policy.json`：目标核验和默认关闭开关。
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

## 第一次启用前：先确定目标，再放入凭据

仓库已选定为 `gradient30/laboratory`；**Cloudflare目标账户尚未填写，发布仍关闭。**

1. 确认 Cloudflare Account ID、Worker名 `little-lab-30-q7r8` 和公开访问范围。确认同名Worker不存在，或明确允许更新它。
2. 保护 `main`：要求PR审核与检查通过；严格审查工作流、锁文件、部署脚本、Wrangler配置和资源哈希清单。限制仓库写入人员。
3. 在GitHub建立 `cloudflare-production` Environment，限制允许部署的分支为main；若账户/仓库方案支持，配置Required reviewers。仅写上environment名称不会自动建立审批保护规则。
4. 创建有限权限Cloudflare API token。此站没有数据库或自定义域名，先限定**选定账户的 Workers Scripts / Edit（API中称Write）**；不要使用Global API Key，也不要默认授予D1、KV、R2、DNS、Workers Routes或所有账户权限。如果实际部署明确报告缺少额外只读权限，先核对具体调用再单独审查，不盲目扩大令牌。
5. 把令牌直接保存为该Environment的GitHub Actions Secret：`CLOUDFLARE_API_TOKEN`。不要发到聊天、写进源码、README或日志。Account ID不是认证密钥，可保存为该Environment的Actions Variable：`ACCOUNT_ID`；工作流将其映射为 `CLOUDFLARE_ACCOUNT_ID`。
6. 审核后在 `.github/deployment-policy.json` 填写相同的32位Account ID、确认Worker名称，并将 `enabled` 改为 `true`。以PR审核此项变更；仓库级开关此时仍应保持关闭。
7. 最后设置**仓库级**Actions Variable `CLOUDFLARE_DEPLOY_ENABLED=true`。这个变量用于job是否启动，不能只设置为Environment级变量。首次建议手动选择main运行并检查日志。

两个启用条件缺一不可：仓库变量必须为字符串 `true`，源代码策略也必须为布尔值 `true`。策略还会校验实际仓库、main引用、事件类型、提交SHA、Account ID和Worker名；缺失或不匹配时，在调用Cloudflare之前退出。

Account级Workers令牌可能能修改该账户下其他Worker；本项目的目标校验不是Cloudflare侧“单Worker令牌隔离”。因此仍需最小账户范围、保护Environment、限制仓库写入权限、合理有效期和定期轮换。

## 如何确认上线、暂停或回滚

- 以发布步骤成功结果和Cloudflare返回的真实版本/网址为准；不要自行拼接网址来声称上线。
- 在无登录浏览器验证首页、年龄切换、30天地图、步骤与材料、安全确认、图示放大、记录与刷新保留，再分享。
- 变更域名会产生新的浏览器来源；现有Sites本地记录不会自动迁移。
- 暂停后续发布：把仓库变量改为 `false`，并关闭策略。此操作不取消已经开始的部署，也不下线已公开的网站。
- 内容回滚优先通过审查过的revert PR合并main，再按正常流程发布。不在这个工作流里自动删除Worker或数据库。

## 后续维护

只改 `dist/` 中所需文件。若静态内容变化，运行 `npm run manifest:update` 更新当前资产哈希，然后一起审核资源和清单差异。`source-manifest.json` 的 `sourceCommit` 仅记录最初Sites来源提交，不表示最新GitHub提交。

更新Actions或Wrangler时另开PR，核验官方发布、更新完整SHA或锁文件、执行测试，再合并。不启用自动合并。

这套CI/CD可以让代码变更和发布更可追溯，但并不自动保证网站内容、安全、供应链或儿童隐私万无一失。用户账户和云端记录需要另行设计、授权、开发与验证；当前工作流不会创建D1。

## 官方依据与核验

- [Cloudflare：GitHub Actions部署](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare：API token权限](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
- [GitHub：部署Environment和并发](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)
- [GitHub：安全使用Actions](https://docs.github.com/en/actions/reference/security/secure-use)
- [已核验的Actions提交](ACTION-PINS.md)
- [本地核验范围与限制](VERIFICATION.md)
