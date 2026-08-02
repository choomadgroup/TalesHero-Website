import { useState, useEffect, useCallback } from 'react';

export interface RedeemItem {
  num:      number;
  name:     string;
  delivery: 'Giftbox' | 'Warehouse';
}

export interface RedeemCode {
  fdRedeemId:          number;
  fdCode:              string;
  fdRewardCash:        number;
  fdRewardTR:          number;
  fdRewardMAU:         number;
  fdRewardItemNum:     number | null;
  fdRewardItemName:    string | null;
  fdDeliveryTarget:    string | null;
  fdRewardItems:       string | null;   // JSON array of RedeemItem (new multi-item)
  fdNote:              string | null;
  fdIsActive:          number;
  fdClaimCount:        number;
  fdCreatedByNickname: string;
  fdCreatedAt:         string;
  fdExpiredAt:         string;
}

export interface RedeemFormData {
  code:         string;
  cash_amount:  number;
  tr_amount:    number;
  mau_amount:   number;
  items:        RedeemItem[];
  note:         string;
  expires_days: number;
}

export interface ItemResult {
  fdItemNum:  number;
  fdItemName: string;
}

/** Parse fdRewardItems JSON, fall back to legacy single-item columns */
export function parseRedeemItems(c: RedeemCode): RedeemItem[] {
  if (c.fdRewardItems) {
    try { return JSON.parse(c.fdRewardItems) as RedeemItem[]; } catch { /* fall through */ }
  }
  if (c.fdRewardItemNum) {
    return [{
      num:      c.fdRewardItemNum,
      name:     c.fdRewardItemName ?? `Item #${c.fdRewardItemNum}`,
      delivery: (c.fdDeliveryTarget as 'Giftbox' | 'Warehouse') ?? 'Giftbox',
    }];
  }
  return [];
}

export function useAdminRedeem() {
  const [codes,   setCodes]   = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/redeem', { credentials: 'include' });
      if (r.ok) setCodes(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (data: RedeemFormData): Promise<RedeemCode> => {
    const r = await fetch('/api/admin/redeem', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(data),
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.message ?? 'Gagal membuat kode');
    setCodes(prev => [body, ...prev]);
    return body;
  };

  const toggle = async (id: number): Promise<void> => {
    const r = await fetch(`/api/admin/redeem/${id}`, {
      method: 'PATCH', credentials: 'include',
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.message ?? 'Gagal mengubah status');
    setCodes(prev => prev.map(c =>
      c.fdRedeemId === id ? { ...c, fdIsActive: body.fdIsActive } : c,
    ));
  };

  const deleteCode = async (id: number): Promise<void> => {
    const r = await fetch(`/api/admin/redeem/${id}`, {
      method: 'DELETE', credentials: 'include',
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.message ?? 'Gagal menghapus kode');
    setCodes(prev => prev.filter(c => c.fdRedeemId !== id));
  };

  return { codes, loading, refresh, create, toggle, deleteCode };
}

export async function searchItems(q: string): Promise<ItemResult[]> {
  if (!q || q.trim().length < 2) return [];
  const r = await fetch(`/api/admin/redeem/search-item?q=${encodeURIComponent(q.trim())}`, {
    credentials: 'include',
  });
  if (!r.ok) return [];
  return r.json();
}
