# FedVLR-Frontend

`FedVLR-Frontend` is the frontend application for the FedVLR competition demo: “面向多模态推荐场景的联邦隐私攻防一体化靶场平台”.

It presents the multimodal federated recommendation workflow, experiment configuration, launch monitoring, historical results, result analysis, and attack-defense comparison.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind
- motion
- recharts
- lucide-react

## Pages

- Home: project positioning, multimodal recommendation pipeline, attack-defense loop, and representative metrics.
- Architecture: frontend/API/training-core structure and attack-defense insertion points.
- Data Fusion: showcase dataset profile, modality fields, feature-method notes, and the existing fusion-view explanation.
- Client Personalization: client-side router and G1-G4 personalized view weighting.
- Attack Defense Range: API-backed showcase scenarios, metrics, recommendations, target-rank manipulation, defense trace, and boundary notes.
- Experiment Results: API-backed showcase artifact summary plus the existing Analysis, History, and Comparison views.
- Delivery Report: report-style summary generated from the current showcase artifact and its limitations.
- Training Console: experiment configuration and launch controls.
- Monitoring: validate-only/dry-run/async launch status display.
- Analysis: single experiment result analysis.
- History: historical experiment list, details, CSV download, and config reuse.
- Comparison: multi-experiment comparison and showcase comparison fallback.

## API and Mock Boundary

The frontend prefers real data from `FedVLR-API`:

- `/capabilities`
- `/experiment-schema`
- `/experiments/launch`
- `/experiments/launch/{launch_id}`
- `/experiments/summaries`
- `/experiments/{experiment_key}/summary`
- `/experiments/{experiment_key}/result`
- `/experiments/{experiment_key}/csv`
- `/showcase/scenarios`
- `/showcase/scenarios/{scenario_id}/report`
- `/showcase/scenarios/{scenario_id}/dataset`
- `/showcase/scenarios/{scenario_id}/metrics`
- `/showcase/scenarios/{scenario_id}/recommendations`
- `/showcase/scenarios/{scenario_id}/security`
- `/showcase/scenarios/{scenario_id}/privacy`

Showcase pages use `src/services/showcase.ts` and `src/types/showcase.ts` to read the API first, then fall back to `src/mock/showcase.ts` if the API or an artifact endpoint is unavailable. The selector on showcase pages exposes the scenario source (`API artifact`, `mock fallback`, or mixed endpoint fallback), dataset/model metadata, tags, warnings, and flags such as `smoke`, `proxy`, `demo_only`, and `unavailable`.

Mock data under `src/mock` is a fallback for offline demos and UI continuity. Mock-only text, placeholder options, `proxy`, `demo`, or `smoke` artifacts must not be treated as real implemented capabilities.

In particular, differential privacy, homomorphic encryption, and secure aggregation are not formally implemented in the current FedVLR training chain. If mentioned, they should be described only as future extensions or planning placeholders.

For Amazon showcase artifacts, `image_features` may be a URL-hash placeholder. The frontend must label that as a placeholder and not as a real visual embedding.

## Metric Convention

The current display convention prioritizes:

- `Recall@50`
- `NDCG@50`
- tail mean over late training rounds

Historical and comparison summaries should not silently fall back to a single best-round metric when tail mean data is available.

## Environment

Create a local `.env.local` if needed:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

In Vite dev mode, local API targets are routed through `/api` proxy according to `vite.config.ts`.

## Commands

```powershell
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Do not commit `node_modules`, `dist`, `.env.local`, logs, or local build artifacts.
