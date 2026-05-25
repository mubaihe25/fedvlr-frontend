# FedVLR-Frontend

`FedVLR-Frontend` 是 FedVLR 的前端展示与交互仓库，当前定位是“安全推荐系统演示平台”。它面向评委顺序理解：先看项目导览，再看系统机制，最后进入攻防工作台完成实验编排、运行监控、单次分析、横向对比和历史实验查看。

前端优先读取 `FedVLR-API` 的只读 showcase artifacts；API 不可用或单个 artifact 缺失时回退到本地 mock，保证页面不白屏。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind
- motion
- recharts
- lucide-react

## 导航结构

主侧边栏只保留 3 个评委主路径：

- 项目导览
- 系统机制
- 攻防工作台

开发者相关能力不再作为孤立入口展示，统一合并进“攻防工作台”顶部 Tab：

- 实验编排
- 运行监控
- 单次分析
- 横向对比
- 历史实验

## 旧页面合并关系

- `Home` -> 项目导览
- `Architecture` / `DataFusion` / `ClientPersonalization` -> 系统机制
- `AttackDefenseRange` -> 攻防工作台
- 原训练配置 / 运行监控 / 单次分析 / 历史实验 / 横向对比 -> 攻防工作台 Tabs
- 原结果与证据、交付报告的可用内容并入单次分析、横向对比、历史实验和编排摘要，不再作为一级导航

旧页面未删除；当前通过导航和路由组织弱化，避免评委主线被后台式多页面打散。

## 页面与模块

- `src/pages/Home.tsx`：项目导览页，用一句话定位、三步说明和简洁拓扑图帮助快速理解项目。
- `src/pages/SystemMechanism.tsx`：系统机制页，按数据接入、多模态融合、本地训练、服务端聚合和双层融合机制说明正常系统。
- `src/pages/AttackDefenseRange.tsx`：攻防工作台，承载五个正式 Tab：实验编排、运行监控、单次分析、横向对比、历史实验。
- `src/components/sandbox`：数字沙盘视觉组件，包括联邦拓扑飞线、攻防过程、target rank 轨迹和三列推荐对照。
- `src/components/showcase`：showcase 场景、指标、能力矩阵、V2.5 摘要等复用展示组件。
- `src/services/showcase.ts`：showcase API 读取、artifact 正规化、mock fallback 和本地图片 URL 处理。
- `src/types/showcase.ts`：showcase artifact 类型定义，字段允许缺失。
- `src/lib/showcaseFormat.ts`：中文 label map、指标格式化和边界说明。

## Showcase API

前端兼容读取：

- `/showcase/scenarios`
- `/showcase/scenarios/{scenario_id}/report`
- `/showcase/scenarios/{scenario_id}/dataset`
- `/showcase/scenarios/{scenario_id}/metrics`
- `/showcase/scenarios/{scenario_id}/recommendations`
- `/showcase/scenarios/{scenario_id}/security`
- `/showcase/scenarios/{scenario_id}/privacy`
- `/showcase/images/{dataset}/{item_id}`

Showcase 页面通过 `useShowcaseBundle` 和 `src/services/showcase.ts` 读取 API。API 整体不可用或部分 artifact endpoint 不可用时允许 fallback 到 `src/mock/showcase.ts`，并在页面中显示 API、混合来源或 mock fallback 来源。

## 当前已实现能力

- API 优先的 showcase artifact 读取和 mock fallback。
- 项目导览、系统机制、攻防工作台三段式评审路径。
- 攻防工作台五个 Tab：实验编排、运行监控、单次分析、横向对比、历史实验。
- 运行监控页展示联邦拓扑飞线、蓝色正常更新、红色恶意更新、绿色防御过滤，以及 loss / Recall@50 / NDCG@50 实验摘要曲线。
- 单次分析页展示正常推荐、攻击后推荐、防御后推荐三列商品对照，默认 5 条并支持展开更多。
- 推荐商品图片优先使用 `local_image_url`，失败再用 `image_url`，再失败显示占位图；不渲染 D 盘、UNC 或其他本地绝对路径。
- target promotion V2.5 可展示未屏蔽排序 `170 -> 3`，同时明确 masked Top50 hit 为 0 时是“最终曝光未命中”。
- MIA、interaction reconstruction、Krum / Median / TrimmedMean、DP-style Noise、SecAgg demo 等 artifact 摘要展示。
- 模型能力矩阵内容并入攻防工作台，不再作为单独一级 Tab。

## 当前边界

- `smoke`、`proxy`、`demo_only`、`unavailable`、`not_available`、warnings 必须按边界说明展示，不要写成完整实现。
- Amazon 的 `image_features` 如为 URL-hash placeholder，必须说明不是实际视觉 embedding。
- `secure_aggregation_sim` 只能写成安全聚合模拟，不是生产级安全聚合协议。
- `dp_noise` 只能写成差分隐私风格加噪；没有正式 privacy accountant 时，不要写成 formal DP。
- `unsupported` / `future_adapter` 是模型适配边界，不是失败结论。
- FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态主展示模型；FedAvg Amazon 的 target rank `170 -> 3` 不能泛化到所有模型。

## 指标口径

- 页面展示优先使用 `Recall@50` 和 `NDCG@50`。
- 历史和对比摘要优先使用 tail mean。
- 不要把主要展示口径回退成单轮最大值。
- `target_hit_rate=0` 或 masked Top50 hit 为 0 时，必须显示为“最终曝光未命中”，不要写成攻击成功。
- 如果用 artifact 摘要生成轻量 sparkline，必须标注“实验摘要曲线”或“artifact 摘要”，不要伪造完整训练全过程。

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
