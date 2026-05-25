# FedVLR-Frontend 协作说明

## 仓库职责边界

`FedVLR-Frontend` 只负责前端展示、交互、showcase artifact 读取和 mock fallback。当前主定位是“安全推荐系统演示平台”，面向评审顺序理解和端到端联调验收。

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
- `src/services`：API 调用、实验配置映射、历史结果读取、showcase artifact 读取和 mock fallback。
- `src/mock`：离线展示兜底数据。
- `src/types`：前端类型定义。
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

旧页面合并关系：

- `Home` -> 项目导览
- `Architecture` / `DataFusion` / `ClientPersonalization` -> 系统机制
- `AttackDefenseRange` -> 攻防工作台
- 原 `Training Console` / `Monitoring` / `Analysis` / `Comparison` / `History` -> 攻防工作台 Tabs
- 原 `ExperimentResults` / `ResultsEvidence` / `DeliveryReport` 的有用内容并入单次分析、横向对比、历史实验和编排摘要，不作为一级导航

旧页面可以保留，但不要把评委主路径重新拆成后台管理式多页面。

## Showcase API 协议

不要破坏以下前端兼容读取逻辑：

- `/showcase/scenarios`
- `/showcase/scenarios/{scenario_id}/report`
- `/showcase/scenarios/{scenario_id}/dataset`
- `/showcase/scenarios/{scenario_id}/metrics`
- `/showcase/scenarios/{scenario_id}/recommendations`
- `/showcase/scenarios/{scenario_id}/security`
- `/showcase/scenarios/{scenario_id}/privacy`
- `/showcase/images/{dataset}/{item_id}`

Showcase 页面必须 API 优先；API 不可用或单个 artifact 缺失时允许 fallback 到 `src/mock/showcase.ts`，页面不能白屏。真实 artifact 字段允许缺失，前端应优雅展示 `暂无 / 不适用`。

推荐图片优先使用 `local_image_url`，失败再 fallback 到 `image_url`，再失败显示占位图。不要渲染 D 盘路径、UNC 路径或其他本地绝对路径。

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
- 主 UI 不要直接显示后端 key；需要通过中文 label map 或局部中文文案解释。
- 推荐列表默认展示 5 条，适合同一次实验 baseline / attack / defense 对照；跨模型横向对比应使用指标矩阵或摘要图，不堆推荐列表。
- 修改页面结构、导航结构、核心模块职责、数据流、API 字段、启动方式、验证命令或开发约束时，同步检查并更新 `README.md` 和本文件。

## 验证要求

修改前端代码后运行：

```powershell
npm run lint
npm run build
```

完成修改后汇报文件改动、验证结果和 `git status`。不要提交 `dist` 或本地构建产物。
