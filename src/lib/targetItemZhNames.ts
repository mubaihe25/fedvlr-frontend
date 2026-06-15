// 目标商品选择器的中文短名集中映射 + 缩略图 URL 归一化。
//
// 用途：工作台「推荐操纵 → 目标商品」下拉与当前选中卡片主标题。
// 不要在 JSX 中散落判断；如需新增候选请改本文件。
//
// 显示优先级（resolveTargetItemZhName）：
//   1. 后端 options 提供的 short_name_zh（必须含中文字符才算真中文）
//   2. 后端 options 提供的 display_name_zh（同上）
//   3. 本表离线集中映射（覆盖后端规则未命中的 item）
//   4. 「商品 {item_id}」
//
// 短名要求：4–14 个汉字、描述商品类型即可、不添加虚构品牌 / 规格 / 功效。
//
// 选择器范围：当前 target_items 候选仅来自 AMAZON_BEAUTY_POC（侧车 target_items.json
// 的 10 个 item_id）。如有新增再补充。

// 离线中文短名（统一覆盖全部 10 个候选）。
const OFFLINE_TARGET_ITEM_ZH_NAMES: Record<string, string> = {
  '0': '琥珀玻璃喷雾瓶',
  '1': '白麝香沐浴露',
  '2': 'Bioré 卸妆啫喱',
  '5': '甲油护理套装',
  '6': '维 C 亮肤精华液',
  '7': '无痕遮瑕粉底液',
  '8': '焕活面霜',
  '9': '红毯美甲工具套装',
  '10': '深层清洁洗面奶',
  '12': '保湿身体乳',
};

export const OFFLINE_TARGET_ITEM_ZH_NAME_KEYS = Object.keys(OFFLINE_TARGET_ITEM_ZH_NAMES);

const CHINESE_CHAR_RE = /[㐀-鿿]/;

// 后端 *_zh 字段有时仍可能"非空但全是英文"（命中失败回退），必须用真中文判定。
export const containsChinese = (value?: string | null): boolean => {
  if (!value) return false;
  return CHINESE_CHAR_RE.test(value);
};

export const resolveTargetItemZhName = (
  itemId: string | number | null | undefined,
  options?: { short_name_zh?: string | null; display_name_zh?: string | null },
): string => {
  const shortNameZh = options?.short_name_zh;
  if (containsChinese(shortNameZh)) return shortNameZh!.trim();
  const displayNameZh = options?.display_name_zh;
  if (containsChinese(displayNameZh)) return displayNameZh!.trim();
  const normalizedId = String(itemId ?? '').trim();
  if (normalizedId && OFFLINE_TARGET_ITEM_ZH_NAMES[normalizedId]) {
    return OFFLINE_TARGET_ITEM_ZH_NAMES[normalizedId];
  }
  return normalizedId ? `商品 ${normalizedId}` : '目标商品';
};

// 与 FedVLR-API / FedVLR generator / Amazon dataset 后端约定一致；
// 选择器只对 AMAZON 候选出现，但保留 KU 作为兜底以防 datasetId 推断错。
const FALLBACK_SHOWCASE_DATASET = 'AMAZON_BEAUTY_POC';

const isHttpUrl = (value: string): boolean =>
  value.startsWith('http://') || value.startsWith('https://');

const isLocalAbsolutePath = (value: string): boolean => {
  // Windows 盘符 / UNC / POSIX 绝对路径：直接拒绝，禁止任何形式直接落到 src/srcset。
  if (/^[a-zA-Z]:[\\/]/.test(value)) return true;
  if (value.startsWith('\\\\')) return true;
  if (value.startsWith('/')) return true;
  return false;
};

// 归一化缩略图 URL：
//   1) 已是 /api/showcase/images/... 或 http(s):// 原样保留
//   2) 旧形式 /showcase/images/... → 升级到 /api/showcase/images/...
//   3) 字段缺失 + 有 datasetId + itemId → /api/showcase/images/{datasetId}/{itemId}?size=thumb
//   4) 本地绝对路径 / UNC / 不安全 URL → null
export const resolveTargetItemThumbnailUrl = (params: {
  datasetId?: string | null;
  itemId?: string | number | null | undefined;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  localImageUrl?: string | null;
}): string | null => {
  const candidates = [params.thumbnailUrl, params.localImageUrl, params.imageUrl];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (isLocalAbsolutePath(trimmed)) continue;
    if (isHttpUrl(trimmed)) return trimmed;
    if (trimmed.startsWith('/api/showcase/images/')) return trimmed;
    if (trimmed.startsWith('/showcase/images/')) {
      return `/api${trimmed}`;
    }
    // 未知形态（既非 http 也非 /api/ 也非 /showcase/）一律丢弃，避免任何可疑来源。
  }
  const itemId = params.itemId;
  if (itemId === null || itemId === undefined || itemId === '') return null;
  const datasetId = (params.datasetId && params.datasetId.trim()) || FALLBACK_SHOWCASE_DATASET;
  return `/api/showcase/images/${encodeURIComponent(datasetId)}/${encodeURIComponent(String(itemId))}?size=thumb`;
};
