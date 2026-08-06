import { query } from './db.js';

const CDN_BASE = 'https://talesrunner.b-cdn.net/TalesRunner/itemimage';
const IMAGE_PARTS = ['head', 'foot', 'body', 'face'];
const MAX_LIMIT = 60;

function positiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

function imageCandidates(itemNum) {
  return IMAGE_PARTS.map((part) => (
    `${CDN_BASE}/${part}/all_${part}_${itemNum}.png`
  ));
}

function normaliseItem(row, variants, realItemNum) {
  const itemNum = Number(row.itemNum);
  const variantRows = variants.filter((variant) => Number(variant.baseItemNum) === itemNum);
  const isVariant = Number(realItemNum?.get(itemNum) ?? itemNum) !== itemNum;
  const baseItemNum = Number(realItemNum?.get(itemNum) ?? itemNum);

  return {
    itemNum,
    itemName: row.itemName ?? `Item #${itemNum}`,
    description: row.description ?? '',
    type: Number(row.type ?? 0),
    position: Number(row.position ?? 0),
    itemKind: Number(row.itemKind ?? 0),
    character: Number(row.characterId ?? 0),
    canUse: Boolean(row.canUse),
    enabled: Boolean(row.enabled),
    owners: Number(row.owners ?? 0),
    ownedCount: Number(row.ownedCount ?? 0),
    variantCount: variantRows.length,
    isPackage: variantRows.length > 0,
    isVariant,
    baseItemNum,
    imageCandidates: imageCandidates(itemNum),
    variants: variantRows.map((variant) => ({
      itemNum: Number(variant.variantItemNum),
      itemName: variant.variantName ?? `Item #${variant.variantItemNum}`,
      expiresMinutes: Number(variant.expiresMinutes ?? 0),
      hasExpireTime: Boolean(variant.hasExpireTime),
    })),
  };
}

/**
 * Public item catalogue.
 *
 * mode=owned (default) lists unique items found in tblavataruser.
 * mode=all lists enabled item definitions from tblavataritemdesc.
 * kind=equipment limits results to avatar equipment (fdType=2).
 * kind=package limits results to definitions with timed/virtual variants.
 */
export async function publicGetItems(req, res) {
  try {
    const params = req.query ?? {};
    const mode = params.mode === 'all' ? 'all' : 'owned';
    const kind = ['equipment', 'package'].includes(params.kind) ? params.kind : 'all';
    const search = String(params.search ?? '').trim().slice(0, 80);
    const page = positiveInt(params.page, 1, 100000) || 1;
    const limit = positiveInt(params.limit, 24, MAX_LIMIT) || 24;
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];

    if (mode === 'owned') {
      conditions.push('au.fdItemDescNum <> 0');
    } else {
      conditions.push('ad.fdEnable = 1');
    }

    if (kind === 'equipment') {
      conditions.push('ad.fdType = 2');
    } else if (kind === 'package') {
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM tblavataritemdescex ex_filter
          WHERE ex_filter.fdSupplyItemDescNum = ad.fdItemNum
        )
      `);
    }

    if (search) {
      conditions.push('(ad.fdItemName LIKE ? OR CAST(ad.fdItemNum AS CHAR) LIKE ? OR ad.fdDesc LIKE ?)');
      const searchValue = `%${search}%`;
      values.push(searchValue, searchValue, searchValue);
    }

    const where = conditions.join(' AND ');
    const source = mode === 'owned'
      ? `
        SELECT
          au.fdItemDescNum AS itemNum,
          MAX(ad.fdItemName) AS itemName,
          MAX(ad.fdDesc) AS description,
          MAX(ad.fdType) AS type,
          MAX(ad.fdPosition) AS position,
          MAX(ad.fdItemKind) AS itemKind,
          MAX(ad.fdCharacter) AS characterId,
          MAX(ad.fdCanUse) AS canUse,
          MAX(ad.fdEnable) AS enabled,
          COUNT(DISTINCT au.fdUserNum) AS owners,
          SUM(COALESCE(au.fdCount, 0)) AS ownedCount
        FROM tblavataruser au
        INNER JOIN tblavataritemdesc ad ON ad.fdItemNum = au.fdItemDescNum
        WHERE ${where}
        GROUP BY au.fdItemDescNum
      `
      : `
        SELECT
          ad.fdItemNum AS itemNum,
          ad.fdItemName AS itemName,
          ad.fdDesc AS description,
          ad.fdType AS type,
          ad.fdPosition AS position,
          ad.fdItemKind AS itemKind,
          ad.fdCharacter AS characterId,
          ad.fdCanUse AS canUse,
          ad.fdEnable AS enabled,
          0 AS owners,
          0 AS ownedCount
        FROM tblavataritemdesc ad
        WHERE ${where}
      `;

    const countRows = await query(
      `SELECT COUNT(*) AS total FROM (${source}) AS item_source`,
      values,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const rows = await query(
      `${source} ORDER BY itemNum DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset],
    );

    if (rows.length === 0) {
      return res.json({
        items: [],
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        mode,
        kind,
      });
    }

    const itemNums = rows.map((row) => Number(row.itemNum));
    const placeholders = itemNums.map(() => '?').join(', ');
    const [variants, realRows] = await Promise.all([
      query(
        `SELECT
           ex.fdSupplyItemDescNum AS baseItemNum,
           ex.fdVirtualItemDescNum AS variantItemNum,
           ex.fdHasExpireTime AS hasExpireTime,
           ex.fdExpireMinute AS expiresMinutes,
           vd.fdItemName AS variantName
         FROM tblavataritemdescex ex
         LEFT JOIN tblavataritemdesc vd ON vd.fdItemNum = ex.fdVirtualItemDescNum
         WHERE ex.fdSupplyItemDescNum IN (${placeholders})
         ORDER BY ex.fdExpireMinute ASC, ex.fdVirtualItemDescNum ASC`,
        itemNums,
      ),
      query(
        `SELECT fdItemDescNum AS itemNum, fdRealItemDescNum AS realItemNum
         FROM tblavataritemreallist
         WHERE fdItemDescNum IN (${placeholders})`,
        itemNums,
      ),
    ]);

    const realItemNum = new Map(realRows.map((row) => [
      Number(row.itemNum),
      Number(row.realItemNum),
    ]));

    return res.json({
      items: rows.map((row) => normaliseItem(row, variants, realItemNum)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      mode,
      kind,
    });
  } catch (error) {
    console.error('[items/list]', error);
    return res.status(500).json({ message: 'Gagal memuat katalog item.' });
  }
}