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
- `src/components/compare`：历史实验横向对比组件，包含对比篮、对象栏、指标矩阵、参数差异、四方向模板和推荐商品列表。
- `src/components/sandbox/FederatedTopology.tsx`：联邦拓扑、动态飞线、服务器呼吸光、客户端浮动和 hover 数据浮层。
- `src/components/sandbox/RecommendationComparisonBoard.tsx`：按真实结果显示两列或三列推荐对照，默认 5 条，支持按需请求 15 / 50 条；展示 rank、变化状态、目标商品标记、鲁棒聚合器和图片兜底。
- `src/components/sandbox/RecommendationProductCard.tsx`：单次分析与横向推荐列表共用的商品卡片、图片兜底和变化状态展示。
- `src/lib/workbenchCompare.ts`：把 `/workbench/jobs/{id}` 与 `/workbench/jobs/{id}/result` 的新旧字段归一化为四方向对比类型，并负责选择兼容性和候选集合 Jaccard。
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
- 鲁棒聚合防御：单次实验从 Krum / Median / TrimmedMean / Bulyan 中最多选择一种，用于削弱恶意模型更新；空选表示普通 FedAvg 聚合。

观测：

- 推荐观测：Recall@50、NDCG@50、推荐列表变化和目标排序。
- 隐私观测：MIA AUC、交互还原 hit@10 / hit@20 / hit@50。
- 防御观测：恢复率、异常更新过滤和安全聚合残差。

证据：

- 两列/三列推荐对比（仅在真实存在独立 defended recommendations 时显示第三列）
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

方向选择是工作台联动源头：选择推荐操纵、成员推断、更新泄露或聚合防御后，会同步更新当前参数、默认场景、聚合可见性、运行监控日志、单次分析重点和横向对比解释。高级参数不再提供执行模式选择；“校验配置”和“开始实验”固定提交 `execution_mode=full_train`。不支持的方向、模型和数据集组合必须由 `/workbench/validate` 或 invalid `/workbench/jobs` 返回失败原因，不允许降级到其他执行路径。只有拿到真实 `job_id` 才切换到运行监控。

高级参数抽屉使用 `/workbench/options` 的 canonical 数据：数据集只显示 Amazon Beauty 和 KU，模型只显示 8 个可启动模型。`parameter_descriptors` 统一提供中文标签、范围、步长、默认值和选项文案；四个方向复用同一套训练参数、鲁棒聚合和更新扰动控件。推荐操纵的目标商品使用暗色可搜索 combobox，主标题统一为 `简洁中文商品名 · item_id`（4–14 个汉字、描述商品类型、不虚构品牌/规格/功效），英文 `raw_title` 仅作为副标题或 tooltip，下拉搜索同时支持中文短名 / 英文原名 / `item_id`。中文短名解析走 `lib/targetItemZhNames.ts` 的 `resolveTargetItemZhName`（`short_name_zh` → `display_name_zh` → 离线映射 → `商品 {item_id}`），不要在 JSX 中散落判断；不显示本地路径。

推荐操纵不再展示 TopK 选择，payload 固定 `top_k=50`，只保留“导出 Top50 推荐列表”和“导出审计结果”。推荐专属的恶意比例、注入比例、每客户端注入上限、目标损失权重、攻击强度、目标排名统计口径和目标商品不会出现在其他方向。通用批大小、随机种子、客户端采样比例和梯度裁剪范围由 descriptor 驱动。

聚合可见性有互斥逻辑：

- 明文更新聚合：服务端可观察单客户端更新，单次实验可从 Krum / Median / TrimmedMean / Bulyan 中选择一种。
- 安全聚合模拟：服务端只看到聚合结果，不适合同时做逐客户端鲁棒筛选。

选择安全聚合模拟时，鲁棒聚合算法置灰；选择鲁棒聚合算法时，安全聚合模拟置灰。Krum 显示容错数、多候选开关、距离度量和防御预处理裁剪上限；坐标中位数显示启用状态、防御预处理裁剪上限和异常值策略；截尾均值与 Bulyan 各保持两项专属参数。动态客户端数量约束继续由共享 descriptor 驱动。防御预处理裁剪与更新扰动层的扰动前梯度裁剪是独立字段。差分隐私风格加噪关闭时隐藏参数，开启后显示噪声乘数、扰动前梯度裁剪、记录用 δ 和独立扰动随机种子，不展示 ε。

单次分析按 direction 动态渲染：

- 分析对象选择优先级：当前 workbench job result > 历史实验选中 job > `/workbench/jobs` 中 `started_at` 最近且 status in {completed, partial} 的 job（按 `started_at` 降序，不是 job_id 字符串）；无任何可分析 job 时只显示一个简洁空状态。
- 不跨 job 拼接字段：当前 job 未导出的方向、模块或字段一律隐藏，不回退到本地演示数据、V3 artifact 或其他 job 的指标补造。
- **目标商品来源**：当前 workbench job result 中的 `target_item_id` / `target_item_title` / `target_item_info`（以及同名 image 字段）**优先于** V3 showcase artifact；workbench job 不存在或 job 未导出目标字段时才回退 V3 / `targetRankSummary`。当 job 只导出 `itemId` 时显示 `商品 {itemId}` + 占位图，**禁止**回退到 V3 固定目标商品。三个 image 字段全空时同样走 `/api/showcase/images/{datasetId}/{itemId}?size=thumb` 兜底，失败显示占位图。
- **推荐列表商品图片兜底**：当推荐项只有 `itemId`、没有 `thumbnailUrl` / `localImageUrl` / `imageUrl` 时，前端用 `/api/showcase/images/{datasetId}/{itemId}?size=thumb` 兜底拼缩略图，由 vite 代理转发到 `FedVLR-API`；后端 404 时落到通用占位图。
- **每方向固定模块保留**：成员推断 / 更新泄露 / 聚合防御 即使没有方向专用字段也整块保留固定模块（隐私风险指标 / 审计配置 / 样本与分数证据；命中指标 / 泄露配置 / 候选还原；防御配置 / 异常客户端 / 前后性能与恢复）。某模块无真实字段时，模块内显示一次 `本次实验未导出该项分析证据。`，不再为每个指标分别显示"暂无 / 不适用"。`recommendation_manipulation` 的"本次推荐列表规模"模块在后端 metrics 未导出 `baseline_top50` / `attack_top50`、且 V3 `recommendationComparison` 也不含真实条目时改为单条占位 `本次实验未导出推荐列表规模统计。`，不再显示三个 0。
- 顶部紧凑"本次实验摘要"只显示真实存在字段：实验方向、数据集、模型、开始时间、完成状态、结果来源；`Loss` / `Recall@50` / `NDCG@50` / 训练轮数等训练质量指标只在当前 job result 实际导出这些字段时显示，缺失时隐藏（不写"暂无 / 不适用"占位卡片）。
- 各 direction 只渲染该方向应展示的模块；旧 direction 切换时通过 `key={direction}` 强制重挂以彻底卸载旧数据。
  - `recommendation_manipulation` 推荐操纵：无防御时绑定 `baseline_recommendations` / `attack_recommendations` 两列，目标轨迹显示正常排名 → 攻击排名；有独立鲁棒防御结果时再绑定 `defended_recommendations` 第三列，轨迹显示正常排名 → 攻击排名 → 防御排名。页面分别读取 `attack_vs_baseline_jaccard` 与 `defense_vs_baseline_jaccard`，不使用最终摘要覆盖攻击阶段。未屏蔽排名明确区分单用户/多用户平均口径，并说明最终 Top50 会在屏蔽历史交互商品后重新生成。
  - `membership_inference` 成员推断：MIA AUC/Accuracy/Precision/Recall/F1、成员与非成员得分差、证据来源、标签来源、MIA 模型、阈值策略、样本数量/比例、判别分数分布/ROC；隐藏目标商品轨迹、推荐列表规模、推荐对比、客户端更新泄露。
  - `update_leakage` 更新泄露：Hit@10/Hit@20/Hit@50、候选还原商品列表（仅真实图片 URL）、候选排名及相似度/距离、输入来源、泄露目标模态、相似度方法、审计客户端数量；隐藏目标商品轨迹、推荐列表规模、推荐对比、成员推断。
  - `aggregation_defense` 聚合防御：基础攻击类型、鲁棒聚合算法、恶意客户端比例、异常更新数量、选中/拒绝/保留客户端数量、防御前后 Recall@50/NDCG@50、防御恢复率、过滤结果/客户端审计明细、防御参数摘要；隐藏目标商品轨迹、推荐列表规模、推荐对比、成员推断、客户端更新泄露；`base_attack=none` 时不显示恶意客户端或攻击效果相关卡片。
- 新 job 读取 `workbench-result-v2`：通用最终阶段指标来自 `training`，方向证据来自 `direction_result`。推荐操纵优先读取 `baseline_metrics` / `attack_metrics` / optional `defense_metrics`、三份阶段推荐、三段目标排名、两段 Top50 命中和两组对基线 Jaccard；无防御时 defense 字段保持缺失且页面只显示两列。成员推断绘制当前 job ROC 与分数分布；更新泄露展示真实候选排名/分数和匿名客户端证据；聚合防御展示 baseline/attacked/defended 三阶段指标、三组逐轮曲线和拒绝客户端曲线/表格。
- 缺失模块整块保留并以单条占位提示（见"每方向固定模块保留"）；任务已完成但完全无任何方向证据时，仅显示一次"该实验未导出可用于单次分析的方向证据"。
- 失败任务单独走"未完成，无法进入单次分析"分支，展示失败阶段与真实错误摘要，不渲染为分析结果。

横向对比从历史实验档案选择真实 job，不再展示旧静态矩阵：

- 只允许 `completed` 或确有 result 的 `partial` job；失败、运行中或结果缺失任务显示具体禁用原因。
- 第一项锁定 direction 与 dataset，后续必须同方向、同数据集；最少 2 项、最多 4 项。选择保存在工作台 sessionStorage，刷新后恢复。
- 推荐操纵目标商品不一致时仍允许指标级比较，但隐藏商品列表并说明原因。4 项实验时商品列表最多选择其中 3 项并排查看。
- 页面顺序固定为对比对象、2–4 条中性结论、方向指标矩阵、最多两个主图、可选推荐列表、参数差异。缺失字段统一显示“未导出”，不补 0，不从 showcase/mock/其他 job 拼接。
- 推荐操纵读取三阶段 metrics/recommendations/target rank、masked rank、Top50 命中和 Jaccard；成员推断读取 AUC/Accuracy/Precision/Recall/F1、score gap、阈值、样本与真实 ROC；更新泄露读取 Hit@K、候选规模、模态、相似度和候选 IDs；聚合防御读取三阶段推荐质量、恢复率、客户端筛选、耗时、算法参数和真实逐轮数据。

运行监控有 `job_id` 时每 1-2 秒轮询 job 状态和持续增长的 `run.log`，展示 job_id、direction、dataset、model、source、status、stage、progress、时间戳、PID、return code 和方向专属指标；新任务的 `source` 为 `full_train`。失败时显示失败阶段、中文摘要和可展开的完整后端错误，不重复渲染同一错误。completed/failed 后停止轮询。没有 job 时才读取 V3 运行时间线和训练曲线；`curve_source=summary_curve` 显示“摘要曲线”，`curve_source=real_points` 显示“真实记录点”，不要把摘要曲线写成完整训练过程。

单次分析优先级是当前 workbench job result、历史选中 job、最近可分析 job、空状态。当前 job 存在时，方向指标、推荐列表、MIA、更新泄露和聚合防御证据都不得回退 showcase V3、mock 或其他 job。

横向对比优先复用现有 `/workbench/jobs`、`/workbench/jobs/{id}` 和 `/workbench/jobs/{id}/result`，当前不需要 `POST /workbench/compare`。前端只做确定性的字段归一化与派生集合运算，不创建 comparison 记录，不返回或展示本地绝对路径。

历史实验只展示 `/workbench/jobs` 真实 job 档案，不再混入 showcase scenarios。一行一个 job，12 条/页，支持方向、数据集、模型、开始日期、source 和 status 筛选；点击 job 后进入单次分析并优先读取该 job result，也可加入固定对比篮、清空或进入横向对比。

点击“开始实验”时立即记录 `started_at` 和 `experiment_name`。名称固定为 `{实验方向中文名} · YYYY-MM-DD HH:mm:ss`，历史卡片第一行显示该名称，开始时间精确到秒；旧 job 缺少新字段时回退现有 job 标识和 `created_at`，不使用完成时间冒充开始时间。

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

`/v3/report` 优先于旧版 `/report`。单个 V3 panel 缺失时只显示“未导出 / 暂无证据”，不要回退到 mock 补造该 panel。`/showcase/scenarios` 返回 `has_v3` 或相关 panel flags 时，当前场景摘要用中文标签显示“V3 证据”等状态。

推荐图片优先使用 `thumbnail_url`，其次 `local_image_url`，再使用 `image_url`；当三者都为空但有 `dataset` + `itemId` 时，用 `/api/showcase/images/{datasetId}/{itemId}?size=thumb` 兜底拼缩略图（vite 代理转发到 `FedVLR-API`，404 落到通用占位图）。`{datasetId}` 必须是后端注册过的数据集 ID（`AMAZON_BEAUTY_POC` / `KU` 等），不接受 `Amazon Beauty` / `KU 多模态数据集` 等展示名；前端在 `normalizeShowcaseDataset` 内部做最小映射。workbench 目标商品走相同规则。失败显示占位图。不要渲染 D 盘路径、UNC 路径或其他本地绝对路径。

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
- 创建 job 时前端提交点击瞬间的 `started_at` 和中文 `experiment_name`；API 列表和状态响应回传这两个字段，刷新页面后名称和开始时间保持不变。
- 当前 API 会创建并启动真实全量训练 job，状态可能为 `queued`、`running`、`completed`、`partial` 或 `failed`。前端在有 `job_id` 时优先轮询 job 状态、日志和 result；没有 job 时继续读取已完成 showcase/V3 证据。
- `/workbench/validate` 和 invalid `/workbench/jobs` 的 `field_errors` 会展示为中文字段错误；API 会先执行当前方向/数据集/模型的真实最小 forward preflight，未通过时不会创建 job。网络不可达时显示“后端服务未连接”，不要直接暴露 `Failed to fetch`。
- 新建任务固定使用 `metrics_summary.source=full_train`。旧 job 的历史 source 只做兼容读取，不再作为新任务执行选项。`partial` 仍表示训练或结果导出只完成部分，不要补写成功效果。
- 工作台模型选择只展示可进入配置的 8 个模型；MGCN 系列继续作为需要适配器的边界说明，不放进启动 select。模型不在下拉里按数据集硬禁用，是否支持当前方向的全量训练由 `/workbench/validate` 返回。
- 运行监控如果有 `job_id`，优先轮询 workbench job 日志；失败状态同时展示失败阶段、中文摘要、实际 tensor shape、模型期望 shape 和 return code。没有 job 时继续使用 V3 运行时间线或摘要曲线。
- 有真实 job 时约每 1.5 秒读取 `progress_detail`，展示阶段、epoch、当前/完成客户端、百分比、elapsed、ETA 和更新时间；`progress.json` 尚未产生时只显示“正在初始化”，不得使用固定轮数或时间推算假进度。terminal 后保留真实最终进度并停止轮询。
- 运行监控读取 API 返回的真实 epoch metrics、GPU 最新采样和性能摘要。运行时性能参数（`num_workers` / `prefetch_factor` / `pin_memory` / `persistent_workers` / `amp_enabled` / `cache_item_features_on_device` / `non_blocking_transfer` / `reuse_client_model_workspace`）已收口为后端固定安全默认值（`num_workers=0, prefetch_factor=None, pin_memory=false, persistent_workers=false, amp_enabled=false, cache_item_features_on_device=true, non_blocking_transfer=true, reuse_client_model_workspace=true`），前端高级参数不再展示/编辑/提交这些字段，运行监控只保留一行只读提示「性能优化：特征驻留 GPU / 非阻塞传输 / 串行客户端工作区复用（运行时参数已由后端固定，不再作为实验变量）」。`/workbench/options` 也不再返回这 8 个参数描述符。
- `/workbench/options` 的模型能力记录区分 `construct_verified`、`forward_verified`、`train_verified` 和 `direction_verified`；前端不得把构造成功改写为已训练支持。
- 当前 job 的监控曲线只使用 v2 `training.rounds` 或聚合防御 `direction_result.rounds`；日志为空时显示等待 `run.log`，不显示固定示例日志。terminal 后停止轮询并读取 result，`partial` 展示缺失证据。
- 商品 metadata 由当前 job result 提供 item ID/title/category，并把 `/showcase/images/{datasetId}/{itemId}?size=thumb` 改写为前端 `/api/showcase/...` 请求；404 只降级到占位图。
- showcase 加载只在场景声明 V3 或 `available_panels` 时探测 V3 panel，旧版 metrics/privacy/recommendations 等端点也按 scenarios 摘要字段按需读取；缺失证据显示未导出，不用演示数据补齐。
