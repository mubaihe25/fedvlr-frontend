# FedVLR-Frontend 协作说明

## 仓库职责边界

`FedVLR-Frontend` 只负责前端展示、交互、showcase artifact 读取和 mock fallback。当前主定位是“数字化联邦推荐攻防沙盘”，面向评审演示和端到端联调验收。

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

- `src/pages`：页面级功能。主路径为系统总览、攻防沙盘、实验结果、交付报告、开发者控制台。
- `src/components/sandbox`：数字沙盘视觉组件，包括联邦拓扑、动态飞线、风琴控制翼、target rank 动画、实时审计曲线和推荐三列对照。
- `src/components/showcase`：showcase 复用组件，包括场景选择器、指标卡、模型能力矩阵、V2.5 摘要等。
- `src/services`：API 调用、实验配置映射、历史结果读取、showcase artifact 读取和 mock fallback。
- `src/mock`：离线展示兜底数据。
- `src/types`：前端类型定义。
- `src/lib/showcaseFormat.ts`：中文 label map、指标格式化和边界说明。

## 导航与页面约束

主侧边栏保持 5 个评审入口：

- 系统总览
- 攻防沙盘
- 实验结果
- 交付报告
- 开发者控制台

训练配置、运行监控、历史实验、横向对比、单次分析放入“开发者控制台”分组。旧页面可以保留，但不要把评委主路径重新拆成后台管理式的 8 个以上导航入口。

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
- `target_hit_rate=0` 或 masked Top50 hit 为 0 时，不要写成攻击成功。
- Amazon 场景中的 `image_features` 若为 URL-hash placeholder，必须明确说明不是实际视觉 embedding。
- `secure_aggregation_sim` 只能写成安全聚合模拟，不是生产级协议。
- `dp_noise` 只能写成差分隐私风格加噪；没有正式 privacy accountant 时，不要写成 formal DP。
- 不要把 homomorphic encryption、secure aggregation、differential privacy 写成当前训练链路已正式实现。
- `unsupported` / `future_adapter` 是模型适配边界，不是失败结论。
- FedAvg + Amazon 是攻防强验证底座；MMFedRAP + KU 是多模态主展示模型；FedAvg Amazon 的 target rank 170 -> 3 不能泛化到所有模型。

## 指标口径

- 页面展示优先使用 `Recall@50`、`NDCG@50`。
- 历史和对比摘要优先使用 tail mean。
- 不要把主要展示口径回退成单轮最大值。
- 如果用 artifact 摘要生成轻量 sparkline，必须标注“展示曲线 / artifact 摘要”，不要伪造训练全过程。

## 视觉约束

- 保持深色科技风，优先使用 slate-950 / black gradient、毛玻璃容器、渐变描边和柔和辉光。
- 攻防沙盘必须保留清晰的联邦拓扑、动态飞线、攻击红色流、防御绿色消散或拦截效果、实时指标曲线和三列推荐对照。
- 不新增 three.js 等重依赖。SVG、CSS animation、motion 足够完成第一阶段视觉骨架。
- 不要为了视觉效果堆过多卡片；主体验应集中在拓扑演练和攻防对照。

## 开发约束

- 不要随意修改 API payload 协议。
- 不要新增重型依赖，除非任务明确要求并说明必要性。
- 不要提交 `dist`、`node_modules`、`.env.local`、日志或本地构建产物。
- mock 可以作为展示兜底，但不能让 mock 口径误导为真实已实现能力。
- 修改页面结构、导航结构、核心模块职责、数据流、API 字段、启动方式、验证命令或开发约束时，同步检查并更新 `README.md` 和本文件。

## 验证要求

修改前端代码后运行：

```powershell
npm run lint
npm run build
```

完成修改后汇报文件改动、验证结果和 `git status`。不要提交 `dist` 或本地构建产物。
