import { query } from './db.js';

const CDN_BASE = 'https://talesrunner.b-cdn.net/TalesRunner/itemimage';
const IMAGE_PARTS = ['head', 'foot', 'body', 'face'];
const MAX_LIMIT = 60;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function positiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}

function imageCandidates(itemNum) {
  return IMAGE_PARTS.map((part) => (
    `/api/items/image/${part}/${itemNum}.png`
  ));
}

function parseImagePath(req) {
  if (req.params?.part && req.params?.id != null) {
    const part = String(req.params.part).toLowerCase();
    const itemNum = Number(String(req.params.id).replace(/\.png$/i, ''));
    if (!IMAGE_PARTS.includes(part) || !Number.isSafeInteger(itemNum)) return null;
    return { part, itemNum };
  }

  const match = String(req.url ?? '').match(
    /(?:^|\/)(head|foot|body|face)\/(?:all_\1_)?(\d+)\.png(?:\?|$)/i,
  );
  if (!match) return null;
  return { part: match[1].toLowerCase(), itemNum: Number(match[2]) };
}

/**
 * Serve a CDN icon through the same origin as the app.
 * This keeps the browser CSP/CORP rules simple and gives us a clean 404
 * for item IDs that are only present in the private/custom game resources.
 */
export async function publicGetItemImage(req, res) {
  const image = parseImagePath(req);
  if (!image || !Number.isSafeInteger(image.itemNum)) {
    return res.status(404).end();
  }

  try {
    const upstream = await fetch(
      `${CDN_BASE}/${image.part}/all_${image.part}_${image.itemNum}.png`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!upstream.ok) return res.status(404).end();

    const body = Buffer.from(await upstream.arrayBuffer());
    // Vite's dev response is a Node ServerResponse, not Express' response
    // object, so use `end()` rather than Express-only `send()`. Check the
    // body too: Bunny may return a successful HTML error page for a missing
    // asset in some configurations.
    if (body.length < PNG_SIGNATURE.length || !body.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      return res.status(404).end();
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.statusCode = 200;
    res.end(body);
    return res;
  } catch (error) {
    console.warn('[items/image]', error.message);
    return res.status(404).end();
  }
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
      // The public CDN contains the legacy item range. Put custom 900xxx/
      // 970xxx definitions after it so the first page is useful immediately.
      `${source} ORDER BY CASE WHEN itemNum >= 900000 THEN 1 ELSE 0 END ASC, itemNum DESC LIMIT ? OFFSET ?`,
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