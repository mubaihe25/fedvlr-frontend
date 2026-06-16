// 横向对比「商品列表对比」专用：英文商品名称解析 + 图片 URL 归一化。
//
// 规则（与单次分析、实验编排目标商品中文化**完全不同**）：
// 1. 名称优先级 raw_title → title → item_title → product_name → `商品 {item_id}`
//    禁止调用 resolveTargetItemZhName / OFFLINE_TARGET_ITEM_ZH_NAMES，
//    禁止回退为「未分类商品」「未命名商品」。
// 2. 图片：直接用后端写入的 thumbnail_url / local_image_url / image_url；
//    但后端写入的相对路径可能是 `/showcase/images/...`（无 /api 前缀），
//    必须升格到 `/api/showcase/images/...` 才能走 Vite proxy。
//    字段全空时按真实 datasetId + item_id 兜底：
//      `/api/showcase/images/{datasetId}/{itemId}?size=thumb`。
//    拒绝 Windows 绝对路径与 UNC，拒绝 rank / index 误用为 item_id。
//    失败后由 <ImageOff /> 占位，不再循环请求。
// 3. 不影响单次分析（RecommendationComparisonBoard）、实验编排目标商品
//    （targetItemZhNames.ts）的图片逻辑；本文件只被 CompareRecommendationLists
//    使用，命名空间独立。

import type {ShowcaseRecommendationItem} from '../types/showcase';

const RAW_TITLE_KEYS = ['raw_title', 'rawTitle'] as const;
const ITEM_TITLE_KEYS = ['item_title', 'itemTitle'] as const;
const PRODUCT_NAME_KEYS = ['product_name', 'productName'] as const;
const THUMBNAIL_KEYS = ['thumbnail_url', 'thumbnailUrl'] as const;
const LOCAL_IMAGE_KEYS = ['local_image_url', 'localImageUrl'] as const;
const IMAGE_URL_KEYS = ['image_url', 'imageUrl'] as const;

const readString = (record: unknown, keys: readonly string[]): string | null => {
  if (!record || typeof record !== 'object') return null;
  const obj = record as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

// 拒绝 D:\ 盘符、UNC、网络盘；避免任何本地绝对路径落到 <img src>。
export const isBlockedUrl = (value?: string | null): boolean => {
  if (!value) return true;
  return /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\');
};

// 后端写入的缩略图相对路径可能是 `/showcase/images/...`（缺 /api 前缀），
// Vite 代理只对 `/api/...` 转发，缺前缀会被当成 dev-server 资源 → 404。
// 这里把 `/showcase/images/...` 升格为 `/api/showcase/images/...`。
export const normalizeShowcaseImageUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isBlockedUrl(trimmed)) return null;
  if (trimmed.startsWith('/api/showcase/images/')) return trimmed;
  if (trimmed.startsWith('/showcase/images/')) return `/api${trimmed}`;
  // 允许 http(s) 原样保留；其他未知形态（既非 /api 也非 http 也非 /showcase）丢弃。
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return null;
};

// 横向对比商品名称解析：严格按 raw_title → title → item_title → product_name →
// `商品 {item_id}`；永不返回「未分类商品」「未命名商品」。
export const resolveCompareItemTitle = (item: {
  itemId?: string | number | null;
  title?: string | null;
  raw?: Record<string, unknown> | null;
}): string => {
  const raw = item.raw ?? null;
  const rawTitle = readString(raw, RAW_TITLE_KEYS);
  if (rawTitle) return rawTitle;
  if (item.title && item.title.trim()) return item.title.trim();
  const itemTitle = readString(raw, ITEM_TITLE_KEYS);
  if (itemTitle) return itemTitle;
  const productName = readString(raw, PRODUCT_NAME_KEYS);
  if (productName) return productName;
  const itemId = item.itemId;
  if (itemId === null || itemId === undefined || String(itemId).trim() === '') return '商品';
  return `商品 ${itemId}`;
};

// 给 RecommendationProductCard 准备一个"图片 URL 已归一化"的 item：
//   - 三个 URL 字段都被升格为 /api/showcase/images/... 或 http(s) 或 null
//   - 不读 rank / index，保证 item_id 真实
//   - 仍保留 raw / title / rank / score 等其他字段，单次分析 / 实验编排不受影响
export const withNormalizedCompareItemImages = <T extends ShowcaseRecommendationItem>(item: T): T => {
  const raw = (item.raw ?? null) as Record<string, unknown> | null;
  const thumb = readString(raw, THUMBNAIL_KEYS) ?? item.thumbnailUrl ?? null;
  const local = readString(raw, LOCAL_IMAGE_KEYS) ?? item.localImageUrl ?? null;
  const image = readString(raw, IMAGE_URL_KEYS) ?? item.imageUrl ?? null;
  return {
    ...item,
    thumbnailUrl: normalizeShowcaseImageUrl(thumb),
    localImageUrl: normalizeShowcaseImageUrl(local),
    imageUrl: normalizeShowcaseImageUrl(image),
  };
};
