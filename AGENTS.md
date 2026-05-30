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
- `src/components/sandbox`：数字沙盘视觉组件，包括联邦拓扑、动态飞线、运行监控、target rank 轨迹和推荐三列对照；联邦拓扑应保持服务器呼吸光、客户端浮动、方向清晰的正常/攻击/防御飞线和 hover 数据浮层。
- `src/components/showcase`：showcase 复用组件，包括场景选择器、指标卡、模型能力矩阵、V2.5 摘要等。
- `src/services/showcase.ts`：showcase artifact 读取、真实场景优先选择、字段正规化、recommendations limit 查询、图片 URL 过滤和 API 失败兜底。
- `src/hooks/useShowcaseBundle.ts`：showcase bundle 状态管理；初始为 API 加载态，不要在 API 响应前先显示演示数据。
- `src/mock`：离线演示数据，只能在 API 入口失败时兜底。
- `src/lib/showcaseFormat.ts`：中文 label map、指标格式化和边界说明。

## 导航与页面约束

主侧边栏保持 3 个评委入口：

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

默认真实场景优先级：

1. `amazon_beauty_poc_v25_backend_smoke`
2. `mmfedrap_ku_attack_defense_demo`
3. `model_security_capability_matrix`
4. `security_matrix_krum_demo`

`/showcase/scenarios` 可用时，不要用演示数据补齐单个 artifact 缺口；缺失指标显示“暂无 / 不适用”。只有 API 入口真正不可用时，才允许 fallback 到 `src/mock/showcase.ts`。页面不能白屏。

推荐图片优先使用 `thumbnail_url`，其次 `local_image_url`，再 fallback 到 `image_url`，再失败显示占位图。不要渲染 D 盘路径、UNC 路径或其他本地绝对路径。

## 口径和边界

- `smoke`、`proxy`、`demo_only`、`unavailable`、`not_available`、warnings 必须按边界说明展示，不要改写成完整实现。
- `target_hit_rate=0` 或 masked Top50 hit 为 0 时，必须显示为“最终曝光未命中”，不要写成攻击成功。
- Amazon 场景中的 `image_features` 若为 URL-hash placeholder，必须明确说明不是实际视觉 embedding。
- 安全聚合模拟不是生产级协议。
- 差分隐私风格加噪不是 formal DP；没有正式 privacy accountant 时，不要写成 formal DP。
- 不要把 homomorphic encryption、secure aggregation、differential privacy 写成当前训练链路已正式实现。
- `unsupported` / `future_adapter` 是模型适配边界，不是失败结论。
- FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态主展示模型；FedAvg Amazon 的 target rank `170 -> 3` 不能泛化到所有模型。

## 工作台约束

- 实验编排应提供“普通模式 + 专家模式”：普通模式围绕成员推断、客户端更新泄露、目标商品投毒、差分隐私风格加噪、安全聚合模拟、鲁棒聚合防御组织剧本；专家模式保留数据集、模型、轮数、采样、恶意比例、目标商品、攻击强度、防御算法、TopK/artifact 导出。
- 运行监控要表达本地训练、更新/梯度上传、服务端聚合、恶意更新、防御过滤、终端日志、状态摘要和实验摘要曲线。
- 单次分析顶部先给一句话实验结论，再展示目标商品轨迹、推荐三列、成员推断和客户端更新泄露；必须继续说明候选还原不是完整用户历史恢复。
- 推荐三列默认请求 5 条，支持展开 15 条、展开 50 条和收起；展开动作应按需请求 recommendations endpoint，不要一次渲染全量推荐。
- 横向对比只展示指标矩阵和模型能力矩阵，不堆推荐列表。
- 历史实验展示 `/showcase/scenarios` 实验档案库，展示实验名称、模型、数据集、攻击/防御类型、推荐列表、隐私审计、图片和可展示状态；支持轻量筛选并点击场景切换当前工作台场景。

## 指标口径

- 页面展示优先使用 `Recall@50`、`NDCG@50`。
- 历史和对比摘要优先使用 tail mean。
- 如果用 artifact 摘要生成轻量 sparkline，必须标注“实验摘要曲线”或“artifact 摘要”，不要伪造训练全过程。

## 视觉约束

- 保持简约暗色科技风：slate-950 到 slate-900，柔和蓝紫渐变光，通透容器。
- 左侧导航不要纯黑，保持半透明蓝黑渐变和可读的非激活文字。
- 少放小卡片，多用流程图、拓扑图、监控曲线和对照区。
- 颜色语义统一：蓝=正常，红=攻击，绿=防御，紫=多模态。
- 不新增 three.js 等重依赖。SVG、CSS animation、motion 足够完成当前阶段。

## 开发约束

- 不要随意修改 API payload 协议。
- 不要新增重型依赖，除非任务明确要求并说明必要性。
- 不要提交 `dist`、`node_modules`、`.env.local`、日志或本地构建产物。
- 主 UI 不要直接显示后端 key；需要通过中文 label map 或局部中文文案解释。
- 修改页面结构、导航结构、核心模块职责、数据流、API 字段、启动方式、验证命令或开发约束时，同步检查并更新 `README.md` 和本文件。

## 验证要求

修改前端代码后运行：

```powershell
npm run lint
npm run build
```

完成修改后汇报文件改动、验证结果和 `git status`。不要提交 `dist` 或本地构建产物。
