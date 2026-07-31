import { useState, useEffect, useCallback } from 'react';

export interface RedeemCode {
  fdRedeemId:         number;
  fdCode:             string;
  fdRewardCash:       number;
  fdRewardTR:         number;
  fdRewardItemNum:    number | null;
  fdRewardItemName:   string | null;
  fdDeliveryTarget:   string | null;
  fdNote:             string | null;
  fdIsActive:         number;
  fdClaimCount:       number;
  fdCreatedByNickname: string;
  fdCreatedAt:        string;
  fdExpiredAt:        string;
}

export interface RedeemFormData {
  code:            string;
  cash_amount:     number;
  tr_amount:       number;
  item_num:        number;
  item_name:       string;
  delivery_target: 'Giftbox' | 'Warehouse';
  note:            string;
  expires_days:    number;
}

export interface ItemResult {
  fdItemNum:  number;
  fdItemName: string;
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
      method:  'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
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

  return { codes, loading, refresh, create, toggle };
}

export async function searchItems(q: string): Promise<ItemResult[]> {
  if (!q || q.trim().length < 2) return [];
  const r = await fetch(`/api/admin/redeem/search-item?q=${encodeURIComponent(q.trim())}`, {
    credentials: 'include',
  });
  if (!r.ok) return [];
  return r.json();
}
