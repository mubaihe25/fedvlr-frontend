# FedVLR-Frontend

`FedVLR-Frontend` 是 FedVLR 的前端展示与交互仓库，当前定位是“安全推荐系统演示平台”。它面向评委顺序理解：项目导览 -> 系统机制 -> 攻防工作台。

前端优先读取 `FedVLR-API` 的只读 showcase artifacts。只有 `/showcase/scenarios` 这类入口 API 真正不可用时，才切换到本地演示数据；单个 artifact 缺失时不再用 mock 假造效果，而是在对应指标位显示“暂无 / 不适用”。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind
- motion
- recharts
- lucide-react

## 导航结构

主侧边栏保留 3 个评委主路径：

- 项目导览
- 系统机制
- 攻防工作台

攻防工作台顶部固定 5 个 Tab：

- 实验编排
- 运行监控
- 单次分析
- 横向对比
- 历史实验

开发者相关能力不再作为孤立入口展示，训练配置、运行监控、单次分析、横向对比、历史实验统一纳入攻防工作台。

## 旧页面合并关系

- `Home` -> 项目导览
- `Architecture` / `DataFusion` / `ClientPersonalization` -> 系统机制
- `AttackDefenseRange` -> 攻防工作台
- 原训练配置 / 运行监控 / 单次分析 / 历史实验 / 横向对比 -> 攻防工作台 Tabs
- 原结果与证据、交付报告的可用内容并入单次分析、横向对比、历史实验和编排摘要，不作为一级导航

旧页面未删除；当前通过导航和路由组织弱化，避免评委主线被后台式多页面打散。

## 页面与模块

- `src/pages/Home.tsx`：项目导览页，用一句话定位、三步说明和拓扑图帮助快速理解项目。
- `src/pages/SystemMechanism.tsx`：系统机制页，包含五层系统架构图：数据层、客户端层、服务端层、安全层、展示层。
- `src/pages/AttackDefenseRange.tsx`：攻防工作台，承载实验编排、运行监控、单次分析、横向对比、历史实验。
- `src/components/sandbox/RecommendationComparisonBoard.tsx`：三列推荐对照，默认 5 条，支持展开 15 条、展开 50 条和收起。
- `src/services/showcase.ts`：showcase API 读取、真实场景优先选择、artifact 正规化、API 失败时演示数据兜底、本地图片 URL 处理。
- `src/hooks/useShowcaseBundle.ts`：showcase bundle 状态管理，初始显示 API 加载态，不在 API 返回前先显示演示数据。

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

默认真实场景优先级：

1. `amazon_beauty_poc_v25_backend_smoke`
2. `mmfedrap_ku_attack_defense_demo`
3. `model_security_capability_matrix`
4. `security_matrix_krum_demo`

如果 API 场景列表可用，页面不使用演示数据补齐缺失指标；缺失字段显示“暂无 / 不适用”。推荐图片优先使用 `local_image_url`，失败再使用 `image_url`，再失败显示占位图；不要渲染 D 盘、UNC 或其他本地绝对路径。

## 当前已实现能力

- API 优先的 showcase artifact 读取和真实场景默认选择。
- 系统机制页五层架构图。
- 攻防工作台五个 Tab 的正式流程：实验剧本、运行监控、单次分析、指标对比、artifact 场景库。
- 运行监控页展示联邦拓扑飞线、客户端本地训练、更新/梯度上传、服务端聚合、恶意更新、防御过滤环、终端日志和实验摘要曲线。
- 单次分析页展示 V2.5 结果：target rank `170 -> 3`、排名提升、Top50 未命中、MIA AUC、交互候选还原 hit@50、安全聚合残差。
- 推荐列表默认 5 条，支持展开 15/50 条；目标商品出现时高亮，未出现时在目标轨迹中说明最终推荐未曝光。
- 横向对比接入场景摘要和模型能力矩阵，不展示推荐列表。
- 历史实验接入 `/showcase/scenarios` 场景库，点击场景切换当前工作台分析对象。

## 当前边界

- `smoke`、`proxy`、`demo_only`、`unavailable`、`not_available`、warnings 必须按边界说明展示，不要写成完整实现。
- Amazon 的 `image_features` 如为 URL-hash placeholder，必须说明不是实际视觉 embedding。
- 安全聚合模拟不是生产级安全聚合协议。
- 差分隐私风格加噪不是 formal DP；没有正式 privacy accountant 时不要写成 formal DP。
- `unsupported` / `future_adapter` 是模型适配边界，不是失败结论。
- FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态主展示模型；FedAvg Amazon 的 target rank `170 -> 3` 不能泛化到所有模型。

## 指标口径

- 页面展示优先使用 `Recall@50` 和 `NDCG@50`。
- 历史和对比摘要优先使用 tail mean。
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
