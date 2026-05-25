import type { SupplierOrderStatus } from '../../types';

export const ORDER_STATUS_LABELS: Record<SupplierOrderStatus, string> = {
  BEKLIYOR:      'BEKLİYOR',
  ONAYLANDI:     'ONAYLANDI',
  REDDEDILDI:    'REDDEDİLDİ',
  YOLDA:         'YOLDA',
  TESLIM_ALINDI: 'TESLİM ALINDI',
};
