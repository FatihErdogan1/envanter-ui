import type { SupplierOrderStatus } from '../../types';
import { ORDER_STATUS_LABELS } from './orderStatusLabels';

type ColorDef = { background: string; color: string };

const COLOR_MAP: Record<SupplierOrderStatus, ColorDef> = {
  BEKLIYOR:      { background: '#164e63', color: '#ffffff' },
  ONAYLANDI:     { background: '#14532d', color: '#ffffff' },
  REDDEDILDI:    { background: '#7f1d1d', color: '#ffffff' },
  YOLDA:         { background: '#713f12', color: '#ffffff' },
  TESLIM_ALINDI: { background: '#581c87', color: '#ffffff' },
};

export default function OrderStatusBadge({ status }: { status: SupplierOrderStatus }) {
  return (
    <span
      className="px-2 py-1 rounded text-xs font-semibold"
      style={COLOR_MAP[status]}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
