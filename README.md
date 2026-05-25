# FedVLR-Frontend

`FedVLR-Frontend` 是 FedVLR 的前端展示与交互仓库，当前定位是“安全推荐系统演示平台”。它面向评审顺序理解，优先读取 `FedVLR-API` 的只读 showcase artifacts，并在 API 不可用或单个 artifact 缺失时回退到本地 mock，保证页面不白屏。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind
- motion
- recharts
- lucide-react

## 导航结构

主侧边栏保留 4 个评委主路径：

- 项目导览
- 系统机制
- 攻防实验
- 结果与证据

开发相关入口弱化到“开发者模式”分组：训练配置、运行监控、单次分析、历史实验、横向对比。

## 旧页面合并关系

- `Home` 改为“项目导览”。
- `Architecture` / `DataFusion` / `ClientPersonalization` 的讲解被合并到“系统机制”。
- `AttackDefenseRange` 改为“攻防实验”。
- `ExperimentResults` / `History` / `Comparison` / `Model Matrix` 被合并到“结果与证据”。
- `Training Console` / `Monitoring` / `Configuration` 放入“开发者模式”。
- `DeliveryReport` 不再作为一级导航，作为“结果与证据”的交付摘要与详情入口保留。

旧页面没有删除；当前先通过路由和导航组织隐藏或弱化。

## 页面与模块

- `src/pages/Home.tsx`：项目导览页。用一句话定位、三步说明、简洁联邦拓扑图和三个主按钮帮助评委快速理解项目。
- `src/pages/SystemMechanism.tsx`：系统机制页。按数据接入、多模态融合、本地训练、服务端聚合、双层融合机制解释正常系统。
- `src/pages/AttackDefenseRange.tsx`：攻防实验页。按“选择实验剧本、观察攻防过程、查看推荐与指标变化”组织核心演示。
- `src/pages/ResultsEvidence.tsx`：结果与证据页。集中展示关键结果、模型能力矩阵、KU 与 Amazon 两条实验线、支持状态和边界说明。
- `src/components/sandbox`：沙盘视觉组件，包括联邦拓扑飞线、攻防剧本控制、target rank 动画和三列推荐对照。
- `src/components/showcase`：showcase 场景、指标、能力矩阵、V2.5 摘要等复用展示组件。
- `src/services/showcase.ts`：showcase API 读取、artifact 正规化、mock fallback 和本地图片 URL 处理。
- `src/types/showcase.ts`：showcase artifact 类型定义，字段允许缺失。
- `src/lib/showcaseFormat.ts`：中文 label map、指标格式化、边界说明和 artifact 摘要。

## Showcase API

前端优先读取 `FedVLR-API`：

- `/showcase/scenarios`
- `/showcase/scenarios/{scenario_id}/report`
- `/showcase/scenarios/{scenario_id}/dataset`
- `/showcase/scenarios/{scenario_id}/metrics`
- `/showcase/scenarios/{scenario_id}/recommendations`
- `/showcase/scenarios/{scenario_id}/security`
- `/showcase/scenarios/{scenario_id}/privacy`
- `/showcase/images/{dataset}/{item_id}`

Showcase 页面通过 `useShowcaseBundle` 和 `src/services/showcase.ts` 读取 API。API 整体不可用或部分 artifact endpoint 不可用时，允许回退到 `src/mock/showcase.ts`，并在页面中显示 `API artifact`、`API + fallback` 或 `mock fallback` 来源。

## 当前已实现能力

- API 优先的 showcase artifact 读取和 mock fallback。
- KU / MMFedRAP 多模态主展示结果。
- Amazon Beauty 商品推荐展示，推荐卡优先使用 `local_image_url`，再回退到 `image_url`，最后显示占位图。
- target promotion V2.5 摘要：未屏蔽排序可展示 `170 -> 3`，同时明确 masked Top50 hit 为 0 时不能写成攻击成功。
- MIA、interaction reconstruction、Krum / Median / TrimmedMean、DP-style Noise、SecAgg demo 等 artifact 摘要展示。
- model_security_capability_matrix 展示，状态中文化为已支持、部分支持、暂不支持、后续适配。
- 首页和攻防实验页的 SVG / CSS / motion 动态飞线，不引入 three.js。

## 当前边界

- `smoke`、`proxy`、`demo_only`、`unavailable`、`not_available`、warnings 必须按边界说明展示，不要写成完整实现。
- Amazon 的 `image_features` 如为 URL-hash placeholder，必须说明不是实际视觉 embedding。
- `secure_aggregation_sim` 只能写成安全聚合模拟，不是生产级安全聚合协议。
- `dp_noise` 只能写成差分隐私风格加噪，不是 formal DP；当前没有正式 privacy accountant。
- `unsupported` / `future_adapter` 是模型适配边界，不是失败结论。

## 指标口径

- 页面展示优先使用 `Recall@50` 和 `NDCG@50`。
- 历史和对比摘要优先使用 tail mean。
- 不要把主要展示口径回退成单轮最大值。
- target_hit_rate=0 或 masked Top50 hit 为 0 时必须显示为“最终曝光未命中”，不写成攻击成功。

## 环境配置

本地联调可创建 `.env.local`：

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
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
