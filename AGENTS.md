# FedVLR-Frontend 协作说明

## 仓库职责边界

`FedVLR-Frontend` 只负责前端展示、交互、showcase artifact 读取和演示数据兜底。当前主定位是“安全推荐系统演示平台”，面向评审顺序理解和端到端联调验收。

不要在本仓库任务中修改 `FedVLR` 算法仓库或 `FedVLR-API`，除非用户明确扩大范围。不要运行训练，不要删除 outputs，不要提交 Git，除非用户明确要求。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind
- motion
- recharts
- lucide-react

## 重点目录

- `src/pages`：页面级功能。主路径为项目导览、系统机制、攻防工作台。
- `src/components/sandbox`：数字沙盘视觉组件，包括联邦拓扑、动态飞线、运行监控、target rank 轨迹和推荐三列对照。
- `src/components/showcase`：showcase 复用组件，包括场景选择器、指标卡、模型能力矩阵、V2.5 摘要等。
- `src/services/showcase.ts`：showcase artifact 读取、V3 report/panel 接入、真实场景优先选择、字段正规化、recommendations limit 查询、图片 URL 过滤和 API 失败兜底。
- `src/hooks/useShowcaseBundle.ts`：showcase bundle 状态管理；初始为 API 加载态，不要在 API 响应前先显示演示数据。
- `src/lib/securityTaxonomy.ts`：前端攻防语义模型，统一攻击、防御、观测、证据分类。
- `src/lib/experimentPlaybooks.ts`：实验剧本数据模型，统一驱动实验编排三栏、攻防路径图、当前参数、推荐场景和执行区文案。
- `src/lib/scenarioNarratives.ts`：场景叙事工具，负责中文场景名、V3 panel 证据、攻防类型、证据标签、用途和 target rank 口径。
- `src/lib/showcaseFormat.ts`：中文 label map、指标格式化和边界说明。
- `src/mock`：离线演示数据，只能在 API 入口失败时兜底。

## 导航与页面约束

主侧边栏保持 3 个入口：

- 项目导览
- 系统机制
- 攻防工作台

不要恢复“结果与证据”一级导航，也不要恢复左下角孤立的“开发者模式”卡片。训练配置、运行监控、单次分析、历史实验、横向对比应纳入攻防工作台顶部 Tab。

攻防工作台固定 5 个 Tab：

- 实验编排
- 运行监控
- 单次分析
- 横向对比
- 历史实验

旧页面合并关系：

- `Home` -> 项目导览
- `Architecture` / `DataFusion` / `ClientPersonalization` -> 系统机制
- `AttackDefenseRange` -> 攻防工作台
- 原 `Training Console` / `Monitoring` / `Analysis` / `Comparison` / `History` -> 攻防工作台 Tabs
- 原 `ExperimentResults` / `ResultsEvidence` / `DeliveryReport` 的有用内容并入单次分析、横向对比、历史实验和编排摘要，不作为一级导航

旧页面可以保留，但不要把评审主路径重新拆成后台管理式多页面。

## 攻防语义约束

主 UI 必须基于中文攻防语义展示，不直接显示后端 key。

攻击模块：

- 成员推断攻击：判断某条用户-商品记录是否参与训练。
- 客户端更新泄露：从客户端上传更新中推断候选交互。
- 目标商品投毒：恶意客户端注入目标商品正反馈，推动目标商品排序。

防御模块：

- 差分隐私风格加噪：给更新加入噪声，降低泄露风险；不能写成 formal DP。
- 安全聚合模拟：隐藏单个客户端更新，只暴露聚合结果；不能写成生产级协议。
- 鲁棒聚合防御：单次实验从 Krum / Median / TrimmedMean / Bulyan 中最多选择一种，削弱恶意模型更新；空选表示普通 FedAvg 聚合。

观测模块：

- 推荐观测：Recall@50、NDCG@50、推荐列表变化、目标排序。
- 隐私观测：MIA AUC、交互还原 hit@10 / hit@20 / hit@50。
- 防御观测：恢复率、异常更新过滤、安全聚合残差。

证据输出：

- 三列推荐对比
- 目标商品轨迹
- 成员推断结果
- 交互候选还原
- 防御摘要
- 历史 artifact

## 工作台约束

实验编排应采用“攻防实验总控台”：

- 推荐操纵
- 成员推断
- 更新泄露
- 聚合防御

左侧是真按钮式实验方向选择；中间用短关键词、图标和发光连线展示攻防流程；右侧是基础参数 / 高级参数分段抽屉。桌面三栏保持左侧约 260-300px、中间自适应、右侧约 360-420px，右侧高级参数内部滚动，不要撑宽页面。基础参数用于快速确认当前配置摘要，高级参数是可编辑表单控件，修改后必须同步基础摘要、流程图关键词和底部配置摘要。剧本字段必须统一来自 `src/lib/experimentPlaybooks.ts`，不要在页面里再维护第二套普通/专家参数。

方向选择必须驱动完整工作流：自动更新当前参数和推荐场景，运行监控日志随方向变化，单次分析优先展示当前方向证据，横向对比说明当前在比什么，历史实验点击后读取对应 job 并进入单次分析。高级参数不展示执行模式；“校验配置”和“开始实验”固定提交 `execution_mode=full_train`。不支持组合必须显示 `/workbench/validate` 或 invalid `/workbench/jobs` 返回的失败原因，不允许静默降级。底部执行区只允许“校验配置”和“开始实验”两个主按钮；只有拿到真实 `job_id` 才切换到运行监控。

高级参数必须由 `/workbench/options` 的 canonical options 驱动：数据集只显示 Amazon Beauty 和 KU；模型只显示 8 个可启动模型。`parameter_descriptors` 是中文标签、范围、步长、默认值、选项文案和动态上限的唯一来源。四个方向必须复用同一套通用训练、鲁棒聚合和更新扰动组件，不得复制四套参数定义。目标商品选择器应使用 `short_name_zh` / `display_name_zh` 做主显示，英文 `raw_title` 作为辅助文本。

聚合可见性必须体现互斥：

- 明文更新聚合：服务端可观察单客户端更新，单次实验可从 Krum / Median / TrimmedMean / Bulyan 中选择一种。
- 安全聚合模拟：服务端只看到聚合结果，不适合同时做逐客户端鲁棒筛选。

选择安全聚合模拟时，Krum / Median / TrimmedMean / Bulyan 置灰并显示原因。选择鲁棒聚合算法时，安全聚合模拟置灰并显示原因。聚合防御方向的基础攻击只允许 `none` 或 `malicious_update`，默认 `none`；界面分别显示“无攻击”和“恶意模型更新”，无攻击时不显示攻击参数且不注入恶意客户端更新。差分隐私风格加噪作为更新扰动层单独展示。

工作台 TopK 固定为 50，不显示 TopK 选择器，不提交 `preserve_topk`；只保留“导出 Top50 推荐列表”和“导出审计结果”。推荐操纵专属攻击字段不得出现在其他三个方向。Krum 固定显示 `krum_f`、`multi_krum_enabled`、`distance_metric`、`gradient_clip_norm` 四项；坐标中位数显示启用状态、`gradient_clip_norm`、`outlier_strategy` 三项；TrimmedMean/Bulyan 各显示两项专属参数。Krum `f`、Bulyan `f` 和截尾均值最少保留客户端数必须按本轮采样客户端数动态限制。`gradient_clip_norm` 是防御预处理裁剪，更新扰动层使用独立的 `max_grad_norm`，两者不得互相覆盖。更新扰动层关闭时隐藏参数，开启后使用独立扰动随机种子，并明确没有正式隐私会计器、不展示 ε。

运行监控要表达本地训练、更新/梯度上传、服务端聚合、恶意更新、防御过滤、终端日志、状态摘要和曲线来源。有 `job_id` 时每 1-2 秒轮询 `/workbench/jobs/{job_id}` 和 `/workbench/jobs/{job_id}/logs?tail=100`，展示 job_id、direction、dataset、model、source、status、stage、progress、started_at、finished_at、result_dir、artifact_dir 和真实 `run.log` 内容；新任务的 source 为 `full_train`。completed/failed 后停止轮询。没有 `job_id` 时继续读取 V3 运行时间线和训练曲线；`summary_curve` 显示“摘要曲线”，`real_points` 显示“真实记录点”。若没有真实曲线，必须标注“实验摘要曲线”，不要伪造完整训练全过程。

单次分析必须按当前 workbench job 的 direction 动态选择分析模板，**不再同时展示所有攻防模块**：

- **分析对象优先级**：进入单次分析 Tab 时，按以下顺序选择分析对象。
  1. 当前 workbench job 刚启动且 `metrics_summary` 已返回结果；
  2. 用户从历史实验点击选中的 job；
  3. 自动读取 `/workbench/jobs` 中 `started_at` 最新（按 `started_at` 降序，**不是 job_id 字符串**）、`status` 为 `completed` 或 `partial` 且存在 result 的最近可分析 job；
  4. 若没有任何可分析 job，只显示一个简洁空状态。
- **不跨 job 拼接证据**：当前 job 未导出的方向、模块或字段一律隐藏，不回退到本地演示数据、showcase V3 artifact 或其他 job 的指标补造。禁止把当前 job result 与 showcase 旧 artifact 字段拼成一份结果。历史列表的选择也按 `started_at` 降序排序，不是 job_id 字符串。
- **目标商品来源**：workbench job result 中的 `target_item_id` / `target_item_title` / `target_item_info`（以及同名 image 字段）**优先于** V3 showcase artifact。workbench job 不存在或 job 未导出目标字段时才回退 V3 / `targetRankSummary`。job 只导出 `itemId` 时显示 `商品 {itemId}` + 占位图，**禁止**回退 V3 旧 fixture（例如"Empty Amber Glass Spray Bottles"棕色玻璃瓶）。getTargetProduct 签名变更为 `(report, workbenchTarget?)`，调用方决定是否传 workbench 上下文。当 `thumbnailUrl` / `localImageUrl` / `imageUrl` 全空但 `datasetId` + `itemId` 都存在时，目标商品图片同样走 `/api/showcase/images/{datasetId}/{itemId}?size=thumb` 兜底；404 显示占位图。
- **推荐列表图片兜底**：推荐项的 `thumbnailUrl` / `localImageUrl` / `imageUrl` 全为空但有 `dataset` + `itemId` 时，前端用 `/api/showcase/images/{datasetId}/{itemId}?size=thumb` 兜底拼缩略图，vite 代理转发到 `FedVLR-API`；后端 404 时落到通用占位图，不影响列表渲染。`RecommendationComparisonBoard` 新增 `dataset` prop，由 `AttackDefenseRange.renderRecommendationComparison` 从 `activeJobMetrics.dataset ?? workbenchJob?.dataset ?? config.dataset` 透传，并在 `normalizeShowcaseDataset` 内归一化为后端 ID。
- **数据集 ID 形态**：`/api/showcase/images/...` 路径的 `{datasetId}` 必须是后端注册过的 ID（`AMAZON_BEAUTY_POC` / `KU` 等），不接受 `Amazon Beauty` / `KU 多模态数据集` 等展示名。`scenarioNarratives.normalizeShowcaseDataset` 做最小映射（Amazon 展示名 → `AMAZON_BEAUTY_POC`、KU 展示名 → `KU`、已是 ID 的原样返回）。所有调用图片兜底的位置（推荐列表、workbench 目标商品）都必须经过这个 helper。
- **每方向固定模块保留**：成员推断 / 更新泄露 / 聚合防御 即使没有方向专用字段也整块保留固定模块（隐私风险指标 / 审计配置 / 样本与分数证据；命中指标 / 泄露配置 / 候选还原；防御配置 / 异常客户端 / 前后性能与恢复）。某模块无真实字段时，模块内显示一次 `本次实验未导出该项分析证据。`，不再为每个指标分别显示"暂无 / 不适用"。推荐操纵方向各模块同样按该规则处理。`recommendation_manipulation` 的"本次推荐列表规模"模块在 metrics 未导出 `baseline_top50` / `attack_top50`、且 V3 `recommendationComparison` 也不含真实条目时改为单条占位 `本次实验未导出推荐列表规模统计。`，**不再**显示三个 0。
- **顶部"本次实验摘要"**：紧凑显示真实存在字段：实验方向、数据集、模型、开始时间、完成状态、结果来源；`Loss` / `Recall@50` / `NDCG@50` / 训练轮数等训练质量指标只在当前 job result 实际导出这些字段时显示，缺失时隐藏（不写"暂无 / 不适用"占位卡片）。
- **方向模块映射**（仅渲染当前 direction 应当出现的模块；旧 direction 切换时通过 `key={direction}` 强制重挂以彻底卸载旧数据）：
  - `recommendation_manipulation` 推荐操纵：目标商品轨迹、攻击前后目标排序、rank gain、最终 Top50 是否命中、推荐列表规模、正常/攻击后/防御后三列、Jaccard/变化用户/目标操纵指数；**防御摘要**仅在当前 job 实际启用防御并导出防御结果时显示；**隐藏**成员推断、客户端更新泄露模块。
  - `membership_inference` 成员推断：MIA AUC/Accuracy/Precision/Recall/F1、成员与非成员得分差、证据来源、标签来源、MIA 模型、阈值策略、样本数量/比例、判别分数分布/ROC；**隐藏**目标商品轨迹、推荐列表规模、三列推荐对比、客户端更新泄露。
  - `update_leakage` 更新泄露：Hit@10/Hit@20/Hit@50、候选还原商品列表（仅真实图片 URL）、候选排名及相似度/距离、输入来源、泄露目标模态、相似度方法、审计客户端数量；**隐藏**目标商品轨迹、推荐列表规模、三列、成员推断。
  - `aggregation_defense` 聚合防御：基础攻击类型、鲁棒聚合算法、恶意客户端比例、异常更新数量、选中/拒绝/保留客户端数量、防御前后 Recall@50/NDCG@50、防御恢复率、过滤结果/客户端审计明细、防御参数摘要；**隐藏**目标商品轨迹、推荐列表规模、三列、成员推断、客户端更新泄露；`base_attack=none` 时不显示恶意客户端或攻击效果相关卡片。
- **缺失数据处理**：方向下的固定模块必须整块保留；模块或字段无真实数据时显示一次"本次实验未导出该项分析证据。"，**不用 mock / V3 / 其他 job 数据补造**。任务已完成但完全无任何方向证据时，仅显示一次"该实验未导出可用于单次分析的方向证据"。失败任务单独走"未完成，无法进入单次分析"分支，展示失败阶段与真实错误摘要，不渲染为分析结果。
- **实现约束**：构建清晰的 direction 分支或 config mapping（例如 `analysisSectionsByDirection`）；不要继续依赖散落的跨条件 if/else。保留现有的真实字段归一化逻辑（如 `displayRankBefore` 等），不要对页面进行广泛重写。`EmptyModuleBlock` 等占位 UI 放在 file-local 组件里，不引入新的跨页组件。

推荐三列默认请求 5 条，支持展开 15 条、展开 50 条和收起；展开动作应按需请求 recommendations endpoint，不要一次渲染全量推荐。推荐项应显示图片、标题、类目、rank、变化状态和是否目标商品。目标商品不在 Top50 时不要插入列表，只在目标轨迹中说明。

横向对比只展示指标矩阵和摘要图，不展示推荐商品列表。当前模式包括攻击效果、防御效果、隐私风险、模型/数据集能力。模型/数据集能力模式优先读取 V3 `model_support_panel` 的 `smoke_verified_models`、`partial_smoke_verified_models`、`validate_only_models`、`adapter_required_models`、`failed_smoke_models` 和 `model_smoke_evidence`，展示成中文分组和状态统计，不直接显示后端字段名或本地结果路径。

历史实验只展示 `/workbench/jobs?limit=12&page=...` 真实 job 档案库，不再展示或混入 `/showcase/scenarios` artifact 档案。一行一个 job，展示 `experiment_name`、方向、数据集/模型、source、status、秒级 `started_at` 和关键指标预览；支持方向、数据集、模型、开始日期、source、status 筛选和分页。点击 job 后切换到单次分析，并优先读取该 job result。历史卡片不要显示随机 job_id、长标识串或 result/artifact 路径。

## Showcase API 协议

不要破坏以下前端兼容读取逻辑：

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

`/v3/report` 优先于旧版 `/report`。单个 V3 panel 缺失时只显示“未导出 / 暂无证据”，不要回退到 mock 补造该 panel。`/showcase/scenarios` 可用时，不要用演示数据补齐单个 artifact 缺口；缺失指标显示“未导出”或“暂无 / 不适用”。只有 API 入口真正不可用时，才允许 fallback 到 `src/mock/showcase.ts`。页面不能白屏。

`/showcase/scenarios` 返回 `has_v3`、`available_panels`、`supported_directions`、`has_runtime`、`has_curves`、`has_target_manipulation`、`has_membership`、`has_update_leakage`、`has_aggregation_defense`、`has_privacy_defense`、`has_model_support`、`has_images` 时，主 UI 必须转成中文标签，例如“V3 证据”“有运行时间线”“有曲线”“有推荐操纵”“有成员推断”“有更新泄露”“有聚合防御”“有图片”，不要直接显示字段名。

推荐图片优先使用 `thumbnail_url`，其次 `local_image_url`，再 fallback 到 `image_url`；当三者都为空但有 `dataset` + `itemId` 时，调用 `/api/showcase/images/{datasetId}/{itemId}?size=thumb` 兜底（vite 代理转发 `FedVLR-API`，404 落到占位图），最后再失败显示占位图。`{datasetId}` 必须是后端 ID（`AMAZON_BEAUTY_POC` / `KU` 等），不要传展示名。workbench 目标商品图片走相同规则。不要渲染 D 盘路径、UNC 路径或其他本地绝对路径。

## 口径和边界

- `smoke`、`proxy`、`demo_only`、`unavailable`、`not_available`、warnings 必须按边界说明展示，不要改写成完整实现。
- `target_hit_rate=0` 或 masked Top50 hit 为 0 时，必须显示为“最终曝光未命中”，不要写成攻击成功。
- Amazon 场景中的 `image_features` 若为 URL-hash placeholder，必须明确说明不是实际视觉 embedding。
- `secure_aggregation_sim` 只能写成安全聚合模拟，不是生产级协议。
- `dp_noise` 只能写成差分隐私风格加噪；没有正式 privacy accountant 时，不要写成 formal DP。
- 不要把 homomorphic encryption、secure aggregation、differential privacy 写成当前训练链路已正式实现。
- `unsupported` / `future_adapter` 是模型适配边界，不是失败结论。
- FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态主展示模型；FedAvg Amazon 的 target rank `170 -> 3` 不能泛化到所有模型。
- `smoke_verified_models` 只能写成“已通过小规模链路验证”；`partial_smoke_verified_models` 写成“部分支持，已通过基础 smoke”；`validate_only_models` 写成“仅完成配置校验”；`adapter_required_models` 写成“需要适配器”。1 epoch smoke 只验证链路和导出，不代表最终性能；FCF / MMFCF 是 partial，MGCN / MMGCN 相关模型是 adapter-required，不要写成已支持。

## 指标口径

- 页面展示优先使用 `Recall@50`、`NDCG@50`。
- 历史和对比摘要优先使用 tail mean。
- 不要把主要展示口径回退成单轮最大值。
- 如果用 artifact 摘要生成轻量 sparkline，必须标注“实验摘要曲线”或“artifact 摘要”，不要伪造训练全过程。

## 视觉约束

- 保持简约暗色科技风：slate-950 到 slate-900，柔和蓝紫渐变光，通透容器。
- 左侧导航不要纯黑，保持半透明蓝黑渐变和可读的非激活文字。
- 少放小卡片，多用流程图、拓扑图、监控曲线和对照区。
- 颜色语义统一：蓝=正常，红=攻击，绿=防御，紫=多模态。
- 动效保留但不要过度；联邦拓扑、动态飞线、攻击流、防御过滤、target rank 轨迹和推荐三列对照是核心视觉骨架。
- 不新增 three.js 等重依赖。SVG、CSS animation、motion 足够完成当前阶段。

## 开发约束

- 不要随意修改 API payload 协议。
- 不要新增重型依赖，除非任务明确要求并说明必要性。
- 不要提交 `dist`、`node_modules`、`.env.local`、日志或本地构建产物。
- mock 可以作为展示兜底，但不能让 mock 口径误导为真实已实现能力。
- 主 UI 不要直接显示后端 key；需要通过中文 label map、`securityTaxonomy` 或 `scenarioNarratives` 解释。
- 修改页面结构、导航结构、核心模块职责、数据流、API 字段、启动方式、验证命令或开发约束时，同步检查并更新 `README.md` 和本文件。

## 验证要求

修改前端代码后运行：

```powershell
npm run lint
npm run build
```

完成修改后汇报文件改动、验证结果和 `git status`。不要提交 `dist` 或本地构建产物。

## Workbench API 联动补充

- `src/services/workbench.ts` 是攻防工作台的 API service，经统一 API helper 走 `/api/workbench/...`，负责 `/workbench/options`、`/workbench/validate`、`/workbench/jobs`、`/workbench/jobs?limit=12&page=...`、job 状态、job 日志和 job result。
- “校验配置”必须调用 `/workbench/validate`；“开始实验”必须调用 `/workbench/jobs`，并显示 `queued` / `running` / `completed` / `partial` / `failed` 等真实 job 状态。
- 点击“开始实验”时立即生成 `started_at` 和 `experiment_name`，名称格式固定为 `{推荐操纵|成员推断|更新泄露|聚合防御} · YYYY-MM-DD HH:mm:ss`。历史读取优先使用 API 持久化字段；旧 job 缺失时可回退原 job 标识和 `created_at`，不得使用 `finished_at` 代替开始时间。
- 运行监控有 `job_id` 时优先轮询 `/workbench/jobs/{job_id}`、`/workbench/jobs/{job_id}/logs?tail=100` 和 terminal result；terminal 后读取 `/workbench/jobs/{job_id}/result`，没有 `job_id` 时继续使用 V3 runtime/curves 或摘要曲线。
- 失败文案应优先使用 `field_errors`、`failure_stage`、`error_summary` 和 `error_detail`；运行监控和历史卡片显示 job_id、模型、数据集、方向、实际 tensor shape、模型期望 shape 和 subprocess return code，完整错误可展开且不得重复。网络不可达时显示“后端服务未连接”，不要直接显示 `Failed to fetch`。
- 单次分析如有 job `metrics_summary`，必须优先使用其中真实的 target rank、rank gain、masked Top50 hit 和 baseline/attack Top50，不得混入 showcase 的旧排名；新任务 `source=full_train`，`partial` 必须保留部分完成边界。
- `/workbench/options` 的 `model_dataset_execution`、`common_parameters`、`fixed_parameters` 和 `parameter_descriptors` 是高级参数、模型提示、范围默认值和执行边界说明的来源；不要在页面里维护第二套参数 schema 或执行能力矩阵。能力状态必须区分 `construct_verified`、`forward_verified`、`train_verified`、`direction_verified`，构造成功不得展示为真实训练支持。
- “校验配置”和“开始实验”都依赖后端真实最小 forward preflight；preflight 失败只展示字段错误，不切换到运行监控，也不生成本地伪 job。
- 高级参数提交给 workbench 时必须保留用户填写的训练轮数、本地轮数、采样比例、学习率和防御参数；前端固定提交 `execution_mode=full_train`。
- 鲁棒聚合算法在前端是可空单选；单次实验最多选择一个，没有选中算法表示普通 FedAvg 聚合，不要恢复“无防御”按钮。聚合防御方向提交用户选择的 `base_attack=none|malicious_update`，默认 `none`。安全聚合模拟与 Krum / Median / TrimmedMean / Bulyan 继续互斥，差分隐私风格加噪是独立扰动层。
- Showcase 加载应按 scenarios 摘要字段请求 V3 panels 和旧版 endpoints；场景未声明 V3/旧证据时不要主动探测一堆 404。缺失证据显示“未导出 / 暂无证据”，不要用 mock 补单个缺口。
- 新 job 的稳定协议是 `workbench-result-v2`。通用训练字段读 `metrics_summary.training`，方向模板只读同一 job 的 `metrics_summary.direction_result`；旧 job 才使用兼容扁平字段。
- 成员推断必须展示当前 job 的 AUC/Accuracy/Precision/Recall/F1、ROC、分数分布和匿名 pair-score 元数据；更新泄露必须展示当前 job 的候选排名/分数、匿名客户端真实交互和 Hit@10/20/50，不得读取 V3 候选补齐。
- 聚合防御必须按 baseline / attacked / defended 三阶段展示 Loss、Recall@50、NDCG@50，并读取逐轮拒绝数和匿名客户端表格。`base_attack=none` 时隐藏攻击阶段、恶意客户端和过滤成功率。
- 有 `job_id` 时运行监控的曲线和日志只能来自当前 job；无真实 round 时显示缺失/等待，不得生成假曲线或固定日志。`partial` 必须展示 `missing_evidence`，failed 必须展示真实 `failure_stage`。
