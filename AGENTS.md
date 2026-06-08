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
- 鲁棒聚合防御：Krum / Median / TrimmedMean / Bulyan，削弱异常客户端更新。

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

左侧是真按钮式实验方向选择；中间用短关键词、图标和发光连线展示攻防流程；右侧是基础参数 / 高级参数分段抽屉。基础参数用于快速确认当前配置摘要，高级参数是可编辑表单控件，修改后必须同步基础摘要、流程图关键词和下一步建议。剧本字段必须统一来自 `src/lib/experimentPlaybooks.ts`，不要在页面里再维护第二套普通/专家参数。

方向选择必须驱动完整工作流：自动更新当前参数和推荐场景，运行监控日志随方向变化，单次分析优先展示当前方向证据，横向对比说明当前在比什么，历史实验点击后切换场景并进入单次分析。底部执行区只允许“校验配置”和“开始实验”两个主按钮，并用小状态标注“新训练任务待接入”。“开始实验”只能提示训练任务接口待接入并切换到已完成 artifact 演示流程，不要假装启动真实训练。

聚合可见性必须体现互斥：

- 明文更新聚合：服务端可观察单客户端更新，可使用 Krum / Median / TrimmedMean / Bulyan。
- 安全聚合模拟：服务端只看到聚合结果，不适合同时做逐客户端鲁棒筛选。

选择安全聚合模拟时，Krum / Median / TrimmedMean / Bulyan 置灰并显示原因。选择鲁棒聚合算法时，安全聚合模拟置灰并显示原因。差分隐私风格加噪作为更新扰动层单独展示。

运行监控要表达本地训练、更新/梯度上传、服务端聚合、恶意更新、防御过滤、终端日志、状态摘要和曲线来源。优先读取 V3 运行时间线和训练曲线；`summary_curve` 显示“摘要曲线”，`real_points` 显示“真实记录点”。若没有真实曲线，必须标注“实验摘要曲线”，不要伪造完整训练全过程。

单次分析必须先给一句话实验结论，再展示目标商品轨迹、推荐三列、成员推断和客户端更新泄露。优先读取 V3 推荐操纵、成员推断、更新泄露和聚合防御 panel；缺失 panel 显示“未导出 / 暂无证据”，不要用 mock 补齐。候选还原不是完整用户历史恢复；不要把 DLG/IG 写成已完整还原真实图片。

推荐三列默认请求 5 条，支持展开 15 条、展开 50 条和收起；展开动作应按需请求 recommendations endpoint，不要一次渲染全量推荐。推荐项应显示图片、标题、类目、rank、变化状态和是否目标商品。目标商品不在 Top50 时不要插入列表，只在目标轨迹中说明。

横向对比只展示指标矩阵和摘要图，不展示推荐商品列表。当前模式包括攻击效果、防御效果、隐私风险、模型/数据集能力。

历史实验展示 `/showcase/scenarios` 实验档案库，展示实验名称、模型、数据集、攻击/防御类型、证据和用途；支持筛选并点击场景切换当前工作台场景。

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

推荐图片优先使用 `thumbnail_url`，其次 `local_image_url`，再 fallback 到 `image_url`，再失败显示占位图。不要渲染 D 盘路径、UNC 路径或其他本地绝对路径。

## 口径和边界

- `smoke`、`proxy`、`demo_only`、`unavailable`、`not_available`、warnings 必须按边界说明展示，不要改写成完整实现。
- `target_hit_rate=0` 或 masked Top50 hit 为 0 时，必须显示为“最终曝光未命中”，不要写成攻击成功。
- Amazon 场景中的 `image_features` 若为 URL-hash placeholder，必须明确说明不是实际视觉 embedding。
- `secure_aggregation_sim` 只能写成安全聚合模拟，不是生产级协议。
- `dp_noise` 只能写成差分隐私风格加噪；没有正式 privacy accountant 时，不要写成 formal DP。
- 不要把 homomorphic encryption、secure aggregation、differential privacy 写成当前训练链路已正式实现。
- `unsupported` / `future_adapter` 是模型适配边界，不是失败结论。
- FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态主展示模型；FedAvg Amazon 的 target rank `170 -> 3` 不能泛化到所有模型。

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
