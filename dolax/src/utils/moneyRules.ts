import type { Order, OrderStatus, ReconciliationStatus, Store } from '../types';

/* ------------------------------------------------------------------ *
 * 1. Cước thực tế trả đối tác vận chuyển
 * ------------------------------------------------------------------ *
 * Hệ thống chưa có bảng cước của đối tác (J&T, Viettel Post...), nên chưa thể biết
 * cước thật khi tạo đơn. Thay vì rải các con số cố định (16.000đ, 16.500đ, 85%...)
 * ở nhiều nơi, mọi ước tính đi qua DUY NHẤT hàm này và đơn được gắn cờ
 * `costIsEstimated` để báo cáo lợi nhuận nói rõ số liệu nào là ước tính.
 * Khi có cước thật từ đối tác, chỉ cần ghi đè `actualShippingCost` và tắt cờ.
 */
export const ESTIMATED_CARRIER_COST_RATIO = 0.85;

export const estimateCarrierCost = (serviceFee: number): number =>
  Math.round((serviceFee || 0) * ESTIMATED_CARRIER_COST_RATIO);

/* ------------------------------------------------------------------ *
 * 2. Đối soát COD
 * ------------------------------------------------------------------ */

/** Đơn đủ điều kiện đưa vào phiếu đối soát của một cửa hàng */
export const isEligibleForReconciliation = (o: Order, storeId: string): boolean =>
  o.storeId === storeId && o.status === 'delivered' && !o.reconciliationId;

/**
 * Phí bảo hiểm của MỘT đơn: tính trên giá trị hàng hóa khai báo (orderValue),
 * theo tỉ lệ % cấu hình riêng của cửa hàng, và chỉ khi cửa hàng bật tính phí bảo hiểm.
 * (Trước đây tính cứng 0,108% trên số tiền COD cho mọi cửa hàng.)
 */
export const calculateInsuranceFee = (order: Order, store?: Pick<Store, 'enableInsuranceFee' | 'insuranceRate'>): number => {
  if (!store?.enableInsuranceFee) return 0;
  const rate = Number(store.insuranceRate) || 0;
  // `||` là chủ ý: orderValue = 0 nghĩa là chưa khai báo giá trị, khi đó dùng tiền hàng.
  const insuredValue = order.orderValue || order.itemPrice || 0;
  return Math.round((insuredValue * rate) / 100);
};

export interface ReconciliationTotals {
  orderCount: number;
  totalCod: number;
  totalServiceFee: number;
  totalInsuranceFee: number;
  otherFee: number;
  /** COD - phí dịch vụ - phí bảo hiểm - phí khác. ÂM nghĩa là cửa hàng còn nợ Dolax. */
  netPayout: number;
}

export const calculateReconciliationTotals = (
  orders: Order[],
  store?: Pick<Store, 'enableInsuranceFee' | 'insuranceRate'>,
  otherFee = 0,
): ReconciliationTotals => {
  const totalCod = orders.reduce((s, o) => s + (o.codAmount || 0), 0);
  const totalServiceFee = orders.reduce((s, o) => s + (o.serviceFee || 0), 0);
  const totalInsuranceFee = orders.reduce((s, o) => s + calculateInsuranceFee(o, store), 0);
  return {
    orderCount: orders.length,
    totalCod,
    totalServiceFee,
    totalInsuranceFee,
    otherFee,
    // Không được ép về 0 bằng Math.max: số âm là công nợ thật và phải hiển thị.
    netPayout: totalCod - totalServiceFee - totalInsuranceFee - otherFee,
  };
};

/** Mã phiếu dạng DS-YYYY-MM-NNN, số thứ tự tiếp theo trong CÙNG tháng (không phụ thuộc số lượng phiếu đã xóa) */
export const nextReconciliationId = (existingIds: string[], date: Date = new Date()): string => {
  const prefix = `DS-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-`;
  let max = 0;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) {
      const n = parseInt(id.slice(prefix.length), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
};

/* ------------------------------------------------------------------ *
 * 3. Chuyển trạng thái hợp lệ
 * ------------------------------------------------------------------ */
const RECONCILIATION_TRANSITIONS: Record<ReconciliationStatus, ReconciliationStatus[]> = {
  pending: ['reconciled', 'disputed'],
  reconciled: ['transferred', 'disputed', 'pending'],
  disputed: ['pending', 'reconciled'],
  transferred: [], // đã chi trả tiền thật: không được quay lại
};

export const canTransitionReconciliation = (from: ReconciliationStatus, to: ReconciliationStatus): boolean =>
  RECONCILIATION_TRANSITIONS[from]?.includes(to) ?? false;

/**
 * Đơn đã hủy hoặc đã đối soát là trạng thái cuối. Riêng 'reconciled' chỉ được đặt
 * bởi quy trình tạo phiếu đối soát, không đặt thủ công được.
 */
export const canTransitionOrder = (from: OrderStatus, to: OrderStatus): boolean => {
  if (from === to) return true;
  if (from === 'cancelled' || from === 'reconciled') return false;
  if (to === 'reconciled') return false;
  return true;
};

/* ------------------------------------------------------------------ *
 * 4. Đọc số từ Excel
 * ------------------------------------------------------------------ */

/**
 * Đọc số tiền VNĐ từ ô Excel. Chấp nhận 1500000, "1.500.000", "1,500,000", "1.500.000đ".
 * Trả về undefined nếu ô trống/không phải số (để nơi gọi báo lỗi thay vì tự điền giá trị).
 */
export const parseVndAmount = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? Math.round(value) : undefined;
  const digits = String(value).trim().replace(/[^\d]/g, '');
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Đọc khối lượng và trả về KILOGRAM. Cột Excel thường là gram ("khối lượng (gram)"),
 * nên `unit` cho biết đơn vị của cột. Chấp nhận "0,5" và "0.5".
 */
export const parseWeightKg = (value: unknown, unit: 'g' | 'kg'): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  let n: number;
  if (typeof value === 'number') {
    n = value;
  } else {
    const s = String(value).trim().replace(',', '.').replace(/[^\d.]/g, '');
    n = s ? Number(s) : NaN;
  }
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const kg = unit === 'g' ? n / 1000 : n;
  return Math.round(kg * 1000) / 1000;
};

/** Giới hạn file nhập Excel để tránh treo trình duyệt */
export const MAX_IMPORT_ROWS = 1000;
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
