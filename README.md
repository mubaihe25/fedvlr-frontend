# FedVLR-Frontend

`FedVLR-Frontend` 是 FedVLR 的前端展示与交互仓库，当前定位是“数字化联邦推荐攻防沙盘”。它面向评审演示和联调验收，优先展示 FedVLR-API 的只读 showcase artifacts，并在 API 不可用或单个 artifact 缺失时回退到本地 mock，保证页面不白屏。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind
- motion
- recharts
- lucide-react

## 导航结构

主侧边栏收束为 5 个评审主入口：

- 系统总览
- 攻防沙盘
- 实验结果
- 交付报告
- 开发者控制台

训练配置、运行监控、历史实验、横向对比、单次分析仍保留在代码中，但入口收纳到“开发者控制台”，避免评审主路径被后台管理功能打散。

## 页面与模块

- `src/pages/Home.tsx`：系统总览第一屏，展示“联邦安全推荐数字沙盘”主视觉、中央服务器、客户端节点、商品/文本/交互数据流和动态飞线。
- `src/pages/AttackDefenseRange.tsx`：核心攻防沙盘，包含左侧风琴式控制翼、中间联邦拓扑演练大屏、目标 rank 推进动画、右侧实时审计曲线，以及底部三列推荐商品对照。
- `src/pages/ExperimentResults.tsx`：真实 artifact 摘要、Amazon V2.5 smoke 摘要、模型安全能力矩阵，以及原有 Analysis / History / Comparison 视图入口。
- `src/pages/DeliveryReport.tsx`：评委结尾页，归纳已实现能力、可展示实验、当前边界、后续增强和适用场景。
- `src/components/sandbox`：沙盘视觉组件，包括联邦拓扑飞线、风琴控制面板、目标 rank 舞台、实时审计 sparkline 和三列推荐对照。
- `src/components/showcase`：showcase 场景选择、指标卡、能力矩阵、V2.5 摘要等复用展示组件。
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

Showcase 页面通过 `useShowcaseBundle` 和 `src/services/showcase.ts` 读取 API。API 整体不可用或部分 artifact endpoint 不可用时，允许回退到 `src/mock/showcase.ts`，并在场景选择器中显示 `API artifact`、`API + fallback` 或 `mock fallback` 来源。

## 当前已实现能力

- API 优先的 showcase artifact 读取和 mock fallback。
- KU / MMFedRAP 多模态主展示结果。
- Amazon Beauty 商品推荐展示，推荐卡优先使用 `local_image_url`，再回退到 `image_url`，最后显示占位图。
- target promotion V2.5 摘要：未屏蔽排序可展示 `170 -> 3`，同时明确 masked Top50 hit 为 0 时不能写成攻击成功。
- MIA、interaction reconstruction、Krum / Median / TrimmedMean、DP-style Noise、SecAgg demo 等 artifact 摘要展示。
- model_security_capability_matrix 展示，状态中文化为已支持、部分支持、暂不支持、后续适配。
- 首页和攻防沙盘的 SVG / CSS / motion 动态飞线，不引入 three.js。

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
- 右侧实时曲线若由 artifact 摘要生成，必须标注为“展示曲线 / artifact 摘要”，不能伪造成完整训练全过程。

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
