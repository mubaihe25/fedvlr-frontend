# FedVLR-Frontend 协作说明

## 仓库定位

`FedVLR-Frontend` 是前端展示与交互仓库，负责首页、系统架构页、训练控制台、运行监控、结果分析、历史实验、对比分析和 showcase artifact 展示。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind
- motion
- recharts
- lucide-react

## 重点目录

- `src/pages`：页面级功能，包括首页、架构页、训练台、监控、结果、历史和对比。
- `src/components`：复用组件和页面局部组件，`src/components/showcase` 放置 showcase 展示组件。
- `src/services`：API 调用、实验配置映射、历史结果读取、结果分析、showcase artifact 读取和 mock fallback。
- `src/mock`：离线展示兜底数据。
- `src/types`：前端类型定义。

## 开发约束

- 不要随意修改 API payload 协议。
- 不要新增重型依赖，除非任务明确要求并说明必要性。
- 不要提交 `dist`、`node_modules`、`.env.local`、日志或本地构建产物。
- 保持当前深色科技风格一致。
- mock 可以作为展示兜底，但不能让 mock 口径误导为真实已实现能力。
- showcase 展示页优先读取 `FedVLR-API` 的只读 artifact 接口，API 不可用或单个 artifact 缺失时允许回退到 `src/mock/showcase.ts`，页面不能白屏。
- 不要破坏 `/showcase/scenarios` 及 `/showcase/scenarios/{scenario_id}/report|dataset|metrics|recommendations|security|privacy` 的前端兼容读取逻辑；真实 artifact 字段允许缺失，前端应优雅展示 `暂无 / 不适用`。
- `smoke`、`proxy`、`demo_only`、`unavailable`、`not_available`、warnings 等字段必须按边界说明展示，不要改写成完整实现。
- Amazon 场景中的 `image_features` 若为 URL-hash placeholder，必须明确说明不是实际视觉 embedding。
- 避免把 `differential privacy`、`secure aggregation`、差分隐私、安全聚合写成已正式实现。
- 不要把后续规划能力写成当前训练链路已生效。

## Showcase Notes

- 场景选择器需要显示 API/mock/mixed 来源、dataset/model、tags、warnings 和边界 flags。
- `model_security_capability_matrix` 场景读取 `model_security_capability_matrix`、`supported_demos`、`unsupported_reasons` 和 `recommended_frontend_labels`，展示 model/dataset/capability/status/evidence/reason/recommended_demo_usage。
- 模型能力矩阵必须保留边界口径：FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态主展示模型；FedAvg Amazon target rank 170 -> 3 不能泛化到所有模型；`unsupported` / `future_adapter` 是模型适配边界，不是失败结论。
- 推荐卡片图片优先使用 `local_image_url`，失败后 fallback 到 `image_url`，再失败显示 rank 占位；不要渲染 D 盘等本地绝对路径。
- Amazon Beauty V2.5 backend smoke 只展示 artifact 证据：target-rank movement、masked TopK hit、interaction reconstruction、MIA AUC、SecAgg residual、Opacus availability。`target_hit_rate=0` 或 masked TopK hit 为 0 时不要写成攻击成功。

## 指标口径

- 页面展示优先使用 `Recall@50`、`NDCG@50`。
- 历史和对比摘要优先使用 tail mean。
- 不要把主要展示口径回退成单轮最大值。

## 验证要求

修改前端代码后运行：

```powershell
npm run lint
npm run build
```

完成修改后汇报文件改动、验证结果和 `git status`。不要提交 `dist` 或本地构建产物。
