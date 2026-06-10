# FedVLR-Frontend

`FedVLR-Frontend` 是 FedVLR 的前端展示与交互仓库。当前定位是“安全推荐系统演示平台”，主路径为：项目导览 -> 系统机制 -> 攻防工作台。

前端优先读取 `FedVLR-API` 的只读 showcase artifacts。只有 `/showcase/scenarios` 等入口 API 真不可用时才切换到本地演示数据；单个 artifact 字段缺失时显示“暂无 / 不适用”，不使用演示数据补造效果。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind
- motion
- recharts
- lucide-react

## 导航结构

主侧边栏保留 3 个入口：

- 项目导览
- 系统机制
- 攻防工作台

攻防工作台固定 5 个 Tab：

- 实验编排
- 运行监控
- 单次分析
- 横向对比
- 历史实验

开发者相关能力不再作为孤立入口，训练配置、运行监控、单次分析、横向对比、历史实验统一纳入攻防工作台。

## 页面与模块

- `src/pages/Home.tsx`：项目导览页，用项目定位、三步流程、三个入口按钮和动态联邦拓扑图帮助快速理解项目。
- `src/pages/SystemMechanism.tsx`：系统机制页，用五层架构图说明数据层、客户端层、服务端层、安全层和展示层。
- `src/pages/AttackDefenseRange.tsx`：攻防工作台，承载实验编排、运行监控、单次分析、横向对比和实验档案库。
- `src/components/sandbox/FederatedTopology.tsx`：联邦拓扑、动态飞线、服务器呼吸光、客户端浮动和 hover 数据浮层。
- `src/components/sandbox/RecommendationComparisonBoard.tsx`：三列推荐对照，默认 5 条，支持按需请求 15 / 50 条；展示 rank、变化状态、目标商品标记和图片兜底。
- `src/lib/securityTaxonomy.ts`：前端攻防语义模型，把模块统一分为攻击、防御、观测、证据。
- `src/lib/experimentPlaybooks.ts`：实验剧本数据模型，统一驱动实验编排三栏、攻防路径图、当前参数、推荐场景和执行区文案。
- `src/lib/scenarioNarratives.ts`：场景叙事工具，用真实场景、V3 panels 和 report 推断中文场景名、攻防类型、用途、证据标签和 target rank 口径。
- `src/services/showcase.ts`：showcase API 读取、V3 report/panel 接入、真实场景优先选择、结果正规化、recommendations limit 查询和 API 失败兜底。

## 攻防语义模型

主 UI 以中文语义展示，不直接暴露后端 key。

攻击：

- 成员推断攻击：判断某条用户-商品记录是否参与训练。
- 客户端更新泄露：从客户端上传更新中推断候选交互。
- 目标商品投毒：恶意客户端注入目标商品正反馈，推动目标商品排序。

防御：

- 差分隐私风格加噪：更新扰动层，不写成 formal DP。
- 安全聚合模拟：隐藏单个客户端更新，只暴露聚合结果；当前不是生产级协议。
- 鲁棒聚合防御：Krum / Median / TrimmedMean / Bulyan，用于削弱异常客户端更新。

观测：

- 推荐观测：Recall@50、NDCG@50、推荐列表变化和目标排序。
- 隐私观测：MIA AUC、交互还原 hit@10 / hit@20 / hit@50。
- 防御观测：恢复率、异常更新过滤和安全聚合残差。

证据：

- 三列推荐对比
- 目标商品轨迹
- 成员推断结果
- 交互候选还原
- 防御摘要
- 历史 artifact

## 攻防工作台

实验编排采用“攻防实验总控台”：

- 推荐操纵
- 成员推断
- 更新泄露
- 聚合防御

左侧是真按钮式实验方向选择；中间用短关键词、图标和发光连线展示攻防流程；右侧是基础参数 / 高级参数分段抽屉。桌面三栏固定为左侧约 260-300px、中间自适应、右侧约 360-420px，右侧高级参数内部滚动，不撑宽页面。基础参数用于快速确认当前配置摘要，高级参数是可编辑表单控件，修改后要同步基础摘要、流程图关键词和底部配置摘要。剧本字段统一来自 `src/lib/experimentPlaybooks.ts`，不要在页面里再维护第二套普通/专家参数。

方向选择是工作台联动源头：选择推荐操纵、成员推断、更新泄露或聚合防御后，会同步更新当前参数、默认场景、聚合可见性、运行监控日志、单次分析重点和横向对比解释。高级参数包含执行模式：`复用已导出证据` 默认不训练，`运行轻量训练` 请求受限 smoke，`运行 probe smoke` 只做轻量探测 / 结果回填；用户选择 `real_smoke` 时不允许静默降级，不支持的组合必须由 `/workbench/validate` 或 invalid `/workbench/jobs` 返回失败原因。底部执行区只展示当前配置摘要和“校验配置”“开始实验”两个主按钮。“开始实验”调用受限 smoke job 接口，只有拿到真实 `job_id` 才切换到运行监控；如果后端返回 `source=existing_artifact`，必须写成复用已导出证据，不要写成刚训练完成。

高级参数抽屉使用 `/workbench/options` 的 canonical 数据：数据集只显示 Amazon Beauty 和 KU，模型只显示 8 个可启动模型。8 个模型都可进入配置，不再因当前场景被下拉禁用；真实 smoke、仅复用证据、probe 或配置校验边界由 `model_dataset_execution` 和 `/workbench/validate` 返回。推荐操纵的目标商品使用暗色可搜索 combobox，优先展示 `short_name_zh`，英文 `raw_title` 作为小字，不显示本地路径。

聚合可见性有互斥逻辑：

- 明文更新聚合：服务端可观察单客户端更新，可使用 Krum / Median / TrimmedMean / Bulyan。
- 安全聚合模拟：服务端只看到聚合结果，不适合同时做逐客户端鲁棒筛选。

选择安全聚合模拟时，鲁棒聚合算法置灰；选择鲁棒聚合算法时，安全聚合模拟置灰。差分隐私风格加噪作为更新扰动层单独展示。

单次分析固定故事线：

1. 一句话结论。
2. 目标商品轨迹。
3. 三列推荐对比。
4. 成员推断攻击。
5. 客户端更新泄露。
6. 防御摘要。

横向对比默认先显示“选择对比问题”的空状态，选择后提供四种模式：

- 攻击效果对比
- 防御效果对比
- 隐私风险对比
- 模型/数据集能力对比

运行监控有 `job_id` 时每 1-2 秒轮询 job 状态和 `run.log`，展示 job_id、direction、dataset、model、execution_mode、source、status、stage、progress、时间戳、result/artifact 目录和方向专属指标；completed/failed 后停止轮询。没有 job 时才读取 V3 运行时间线和训练曲线；`curve_source=summary_curve` 显示“摘要曲线”，`curve_source=real_points` 显示“真实记录点”，不要把摘要曲线写成完整训练过程。

单次分析优先级是当前 workbench job result、当前 showcase V3 artifact、未导出。缺失 job result 或 V3 panel 时显示“未导出”，不使用本地演示数据补齐。

横向对比只展示指标矩阵和摘要条形图，不展示推荐商品列表。模型/数据集能力模式优先读取 V3 `model_support_panel`，并按“攻防强验证底座”“多模态主展示模型”“已通过 smoke 验证”“部分支持”“仅配置校验”“待适配”分组展示模型扩充成果。该区域只显示模型名、数据集、中文状态、TopK / metrics 是否验证和结果是否已导出，不展示本地结果路径。

历史实验顶部展示 `/workbench/jobs` 真实 job 档案，一行一个 job，12 条/页，支持方向、数据集、模型、日期、source 和 status 筛选；点击 job 后进入单次分析并优先读取该 job result。showcase scenarios 仍保留为下方 artifact 档案参考。

点击历史实验卡片会切换当前场景并进入单次分析，顶部显示当前切换提示。

## Showcase API

前端兼容读取：

- `/showcase/scenarios`
- `/showcase/scenarios/{scenario_id}/report`
- `/showcase/scenarios/{scenario_id}/dataset`
- `/showcase/scenarios/{scenario_id}/metrics`
- `/showcase/scenarios/{scenario_id}/recommendations?limit=5|15|50&column=baseline|attack|defense|all`
- `/showcase/scenarios/{scenario_id}/security`
- `/showcase/scenarios/{scenario_id}/privacy`
- `/showcase/images/{dataset}/{item_id}?size=thumb|full`
- `/showcase/scenarios/{scenario_id}/v3/report`
- `/showcase/scenarios/{scenario_id}/v3/profile`
- `/showcase/scenarios/{scenario_id}/v3/runtime`
- `/showcase/scenarios/{scenario_id}/v3/curves`
- `/showcase/scenarios/{scenario_id}/v3/target-manipulation`
- `/showcase/scenarios/{scenario_id}/v3/membership`
- `/showcase/scenarios/{scenario_id}/v3/update-leakage`
- `/showcase/scenarios/{scenario_id}/v3/aggregation-defense`
- `/showcase/scenarios/{scenario_id}/v3/privacy-defense`
- `/showcase/scenarios/{scenario_id}/v3/model-support`
- `/showcase/scenarios/{scenario_id}/v3/frontend-summary`

默认真实场景优先级：

1. `amazon_beauty_poc_security_v3`
2. `amazon_beauty_poc_v25_backend_smoke`
3. `mmfedrap_ku_attack_defense_demo`
4. `security_matrix_krum_demo`

`/v3/report` 优先于旧版 `/report`。单个 V3 panel 缺失时只显示“未导出 / 暂无证据”，不要回退到 mock 补造该 panel。`/showcase/scenarios` 返回 `has_v3` 或相关 panel flags 时，历史实验和当前场景摘要用中文标签显示“V3 证据”等状态。

推荐图片优先使用 `thumbnail_url`，其次 `local_image_url`，再使用 `image_url`，失败显示占位图。不要渲染 D 盘路径、UNC 路径或其他本地绝对路径。

## 边界与指标口径

- `smoke`、`proxy`、`demo_only`、`unavailable`、`not_available`、warnings 必须按边界说明展示，不要写成完整实现。
- `target_hit_rate=0` 或 masked Top50 hit 为 0 时，必须显示为“最终曝光未命中”，不要写成攻击成功。
- Amazon 的 `image_features` 若为 URL-hash placeholder，必须说明不是实际视觉 embedding。
- 安全聚合模拟不是生产级安全聚合协议。
- 差分隐私风格加噪不是 formal DP；没有正式 privacy accountant 时不要写成 formal DP。
- `unsupported` / `future_adapter` 是模型适配边界，不是失败结论。
- FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态主展示模型；FedAvg Amazon 的 target rank `170 -> 3` 不能泛化到所有模型。
- `smoke_verified_models` 只能写成“已通过小规模链路验证”；`partial_smoke_verified_models` 写成“部分支持，已通过基础 smoke”；`validate_only_models` 写成“仅完成配置校验”；`adapter_required_models` 写成“需要适配器”。1 epoch smoke 只验证链路和导出，不代表最终性能。
- 页面展示优先使用 `Recall@50` 和 `NDCG@50`。
- 如果用 artifact 摘要生成轻量 sparkline，必须标注“实验摘要曲线”，不要伪造完整训练过程。

## 环境配置

本地联调可创建 `.env.local`：

```text
VITE_API_PROXY_TARGET=http://localhost:8000
```

Vite dev mode 会按 `vite.config.ts` 将本地 API 请求代理到 `/api`。

## 常用命令

```powershell
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

不要提交 `node_modules`、`dist`、`.env.local`、日志或本地构建产物。

## Workbench API 联动

- `src/services/workbench.ts` 通过统一 API helper 走 `/api/workbench/...`，负责调用 `/workbench/options`、`/workbench/validate`、`/workbench/jobs`、`/workbench/jobs?limit=12&page=...`、`/workbench/jobs/{job_id}`、`/workbench/jobs/{job_id}/logs?tail=100` 和 `/workbench/jobs/{job_id}/result`。
- 攻防工作台的“校验配置”调用 `/workbench/validate`；“开始实验”调用 `/workbench/jobs` 并切换到运行监控。
- 当前 API 会创建并启动受限 smoke job，状态可能为 `queued`、`running`、`completed`、`partial` 或 `failed`。前端在有 `job_id` 时优先轮询 job 状态、日志和 result；没有 job 时继续读取已完成 showcase/V3 证据。
- `/workbench/validate` 和 invalid `/workbench/jobs` 的 `field_errors` 会展示为中文字段错误；网络不可达时显示“后端服务未连接”，不要直接暴露 `Failed to fetch`。
- `metrics_summary.source=existing_artifact` 表示复用已导出的安全证据，不要展示为本次刚训练出的完整 benchmark。`metrics_summary.source=real_smoke` 表示后端完成了真实轻量 smoke，只能写成 1 epoch 小规模链路验证。`metrics_summary.source=probe_smoke` 表示轻量 probe/result 回填，不是完整训练。`partial` 表示只有部分或 config-only evidence，不要补写成功效果。
- 工作台模型选择只展示可进入配置的 8 个模型；MGCN 系列继续作为需要适配器的边界说明，不放进启动 select。8 个模型不在下拉里按数据集硬禁用，必须通过 `/workbench/validate` 展示能否 `real_smoke`、只能复用证据或只能 probe/config。
- 运行监控如果有 `job_id`，优先轮询 workbench job 日志；没有 job 时继续使用 V3 运行时间线或摘要曲线。
- showcase 加载只在场景声明 V3 或 `available_panels` 时探测 V3 panel，旧版 metrics/privacy/recommendations 等端点也按 scenarios 摘要字段按需读取；缺失证据显示未导出，不用演示数据补齐。
