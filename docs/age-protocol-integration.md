# 四龄独立方案候选：接口与验收范围

本候选基于主线 `98e4873f45ad40f2682e50b3f9a5449bfeb00ba6`，不包含密码登录候选，不改认证、D1迁移或生产开关。

## 当前范围

仅既有主题1“纸桥为什么变结实”加入四个独立方案。365个ID和contentKey不变，其他364个主题仍显示“原有分龄引导”，不会计为新协议覆盖。全部改动尚未发布。结构、科学/年龄适宜性、安全、图文/界面、最终回归是不同证据，不能相互代替。

`npm run test:curriculum:partial` 只检查已加入方案的结构、身份和精确重复，允许覆盖不完整；`npm run test:curriculum:complete` 要求365×4，并在CI检查作业中阻止不完整候选发布。结构检查不证明真正分龄或科学正确，`productionReady` 明确为false。规格、事实、质量、回归、用户反馈五项最终联合审核及完整桌面/手机回归还必须由负责人核对，不能通过填写不同字符串冒充通过。

后续批次进展见各 `age-protocol-batch*-verification.md`。普通回归与完整发布门禁是两个独立CI作业：不完整WIP仍可执行真实浏览器测试，部署必须两者通过且再检查同一内容。完整门禁要求规格(specification)、事实(facts)、质量(quality)、回归(regression)、用户反馈(user-feedback)五项命名证据，分别绑定当前data.json、发布源码指纹及独立报告SHA256；普通round1–5不能替代五种审核。源码指纹覆盖客户端、后端、图renderer、门禁、测试、CI与发布配置，排除证据本身避免自引用。单主题限定范围审核不填写为全年通过。

材料可合理复用，不要求为了数组不同而添置无用物品。同材料列表在结构审计中显式报告；集成时必须有出现在精确独立审核报告里的实质龄差理由。动作、知识、图示的精确复制仍拒绝；字符串差异也不自动证明科学或教育差异。

## 课程数据

原活动追加 `ageProtocols`，恰好四个键：4-6、7-9、10-12、13-16。

每个协议包含：
- `version`：1–999整数。改变记录字段含义/实际操作语义时须增加版本，不能在同版下重用旧答案。
- `materials`、`safety`：具体材料数量和本方案成人安全要求。
- `steps`：恰好4个 `{title,action,actor,caption,adultNote}`；actor是adult/child/together。
- `knowledge`：`concepts`数组，以及explanation、limits、observation、nextQuestion。
- `guide`：goal、observe、support、control、time、recordFields（1–8个）。原活动的ageGuides不会被改写。
- `sources`：至少一条 `{title,url,claim,scope}`；HTTPS出处与适用范围。`sourceNote`说明改编和未实测边界。
- `diagrams`：恰好4个 `{sceneKey,description,elements}`；元素是受限rect/circle/line/arrow/text原语，不接受原始SVG、外链或事件属性。画布640×360，装置区x24–616/y65–300；同龄材料、动作与图示必须一致。

`dist/diagrams.js` 导出校验与纯解析器 `resolveAgeProtocol`。客户端 `current()` 将同一个所选年龄协议投影到材料、成人准备、四步、放大图、知识、来源及问题；原来的承重问题不会被误用于无加载或变跨度方案。准备指纹包含版本与本龄材料/安全/步骤，变化需重新确认。部分或畸形协议不静默退回原文。

## 保留已有记录

原 `records`、`steps`、`viewedSteps`、`completed`、`legacyRecords` 和day:age键保持原义，没有自动数据迁移。新版使用单独的 `protocolProgress['day:age:vN']={records,step,viewedSteps,completed}`。孩子/年龄/活动/版本均隔离；旧浏览位或旧完成标记不代表新版已经看过/做过。

页面在“记录发现”只读呈现原方案记录、原字段标签和历史完成状态；更早协议版本可查看原始字段数据。导出同时包含这些数据。成长图汇总历史足迹，不将历史答案换成新标签。未改变现有开放关卡；服务端解锁计算认可原完成历史，新协议完成也可推进，导入仍不直接解锁。

后端复用原记录值限制，校验新命名空间、0–3步骤、0–15浏览位、boolean完成值、每记录≤32字段、协议进度≤1460项及总状态1MiB。旧客户端省略protocolProgress时保留云端已有值；冲突用revision CAS拒绝；导入差异不覆盖。当前版本已知时拒绝改写其他历史版本；未来版本积累达到上限时须另设计归档，不可删除旧记录来腾出空间。

## 测试边界

Node测试覆盖解析器、场景原语、安全转义、覆盖门禁、身份、旧记录保留、版本/年龄隔离、服务端锁定/导入/冲突/大小边界。

浏览器套件默认保留真实课程响应，认证、导航、反复操作、冲突及安全门禁测试按新版day1更新；专门的旧版游标测试使用尚未迁移的day2。新增age-protocols.spec验证四龄全流程以及旧day1记录可读而新版输入为空。测试发现阶段不等于浏览器通过。

本机浏览器启动已知受环境限制；未用关闭sandbox绕过。静态SVG栅格图可独立核对装置图，但不证明CSS、手机交互、历史导航或真实浏览器正确。只有受支持环境完成真实浏览器回归后，才能关闭这项验收。
