// 目标商品选择器的中文短名集中映射 + 缩略图 URL 归一化。
//
// 用途：工作台「推荐操纵 → 目标商品」下拉与当前选中卡片主标题。
// 不要在 JSX 中散落判断；如需新增候选请改本文件。
//
// 命名规范：
//   - resolveTargetItemZhName / formatTargetItemDisplayName 都**绝不**在名称中
//     嵌入 item_id；item_id 由最终 UI 格式化层追加一次，避免「商品 3 · 3」重复。
//   - 中文短名必须描述商品类型，4–14 个汉字、不虚构品牌 / 规格 / 功效。
//   - 不调用任何在线翻译接口；离线映射是当前候选商品的真实 raw_title 对应。
//
// 显示优先级（resolveTargetItemZhName）：
//   1. 后端 options 提供的 short_name_zh（必须含中文字符才算真中文）
//   2. 后端 options 提供的 display_name_zh（同上）
//   3. 本表离线集中映射（覆盖后端规则未命中的 item；与真实 raw_title 一一对应）
//   4. 「未命名商品」（无编号、无 item_id）

// 离线中文短名：基于真实 raw_title 一一对应，不按 item_id 猜测。
// 范围：当前 /workbench/options 实际返回的全部候选 0–59（get_target_item_options limit=60）。
// 来源：FedVLR/datasets/AMAZON_BEAUTY_POC/item_image_manifest.json + item_metadata.json。
// 命名约束：4–14 个汉字、描述商品类型、不虚构品牌 / 规格 / 功效。
const OFFLINE_TARGET_ITEM_ZH_NAMES: Record<string, string> = {
  '0': '琥珀玻璃喷雾瓶',
  '1': '白麝香沐浴露',
  '2': 'Bioré 卸妆啫喱',
  '3': '女士香水',
  '4': '液体唇釉',
  '5': '自然睫毛套装',
  '6': '维 C 亮肤精华液',
  '7': '闪粉凝胶甲油套装',
  '8': '阿甘护肤油',
  '9': '红毯美甲工具套装',
  '10': '润色保湿霜',
  '11': '天然芦荟胶',
  '12': '可水洗卸妆棉',
  '13': '电动磨脚器',
  '14': '双面指甲锉',
  '15': '咖啡海盐身体磨砂膏',
  '16': '干发毛巾帽',
  '17': '闪粉凝胶甲油套装',
  '18': '可水洗卸妆棉',
  '19': '温变光疗胶',
  '20': '琥珀玻璃喷雾瓶',
  '21': '睫毛卷翘器与睫毛膏套装',
  '22': 'UV LED 美甲灯',
  '23': '长柄沐浴刷',
  '24': '韩系防晒霜',
  '25': '儿童古龙水',
  '26': '抗老护肤油',
  '27': '香草身体磨砂膏',
  '28': '螺旋发圈',
  '29': '玻尿酸保湿精华',
  '30': '猫眼凝胶甲油套装',
  '31': '植物精油皂',
  '32': '防滑发夹',
  '33': '男士磨砂洁面乳',
  '34': '补水面膜片',
  '35': '闪粉光疗延长胶',
  '36': '胶原保湿湿巾',
  '37': '凝胶甲油套装',
  '38': '芦荟身体乳',
  '39': '闪粉眼影笔',
  '40': '定型喷雾蜡',
  '41': '可分装香水瓶',
  '42': '护色发膜',
  '43': '清洁泥膜',
  '44': '去角质磨砂膏',
  '45': 'A 醇焕亮精华',
  '46': '家用角蛋白护理套装',
  '47': '黄瓜保湿面霜',
  '48': '碎发整理棒',
  '49': '温和卸妆洁面棉',
  '50': '变色凝胶甲油套装',
  '51': '4D 纤维睫毛膏',
  '52': '磁吸睫毛与眼线笔套装',
  '53': '运动发带',
  '54': '光疗甲托夹',
  '55': '天然丝瓜络沐浴片',
  '56': '大麻保湿乳',
  '57': '闪粉液体眼影',
  '58': '隐形毛孔妆前打底套装',
  '59': '口罩内支撑架',
};

export const OFFLINE_TARGET_ITEM_ZH_NAME_KEYS = Object.keys(OFFLINE_TARGET_ITEM_ZH_NAMES);

const CHINESE_CHAR_RE = /[㐀-鿿]/;

// 后端 *_zh 字段有时仍可能"非空但全是英文"（命中失败回退），必须用真中文判定。
export const containsChinese = (value?: string | null): boolean => {
  if (!value) return false;
  return CHINESE_CHAR_RE.test(value);
};

// 仅返回"商品名称"，**绝不**在内部追加 item_id。
// 调用方拿到结果后必须经过 formatTargetItemDisplayName 才允许拼到 UI。
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
  return '未分类商品';
};

// 统一主标题格式化：item_id 只在此处追加一次。
// - name 已由 resolveTargetItemZhName 提供（不含 item_id）；
// - 空 / undefined name 一律回退为「未命名商品」；
// - 无 itemId 时只返回 name，不追加 ` · `。
export const formatTargetItemDisplayName = (
  name: string | null | undefined,
  itemId: string | number | null | undefined,
): string => {
  const trimmedName = (name && name.trim()) || '未命名商品';
  const normalizedId = String(itemId ?? '').trim();
  return normalizedId ? `${trimmedName} · ${normalizedId}` : trimmedName;
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
