import type { AssetStatus } from '../../types';

const colorMap: Record<AssetStatus, string> = {
  AVAILABLE:   'text-green border-green',
  IN_USE:      'text-blue border-blue',
  MAINTENANCE: 'text-yellow border-yellow',
  RETIRED:     'text-red border-red',
};

const labelMap: Record<AssetStatus, string> = {
  AVAILABLE:   'MÜSAIT',
  IN_USE:      'KULLANIMDA',
  MAINTENANCE: 'BAKIM',
  RETIRED:     'HURDA',
};

export default function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <span className={`status-badge ${colorMap[status]}`}>
      {labelMap[status]}
    </span>
  );
}
