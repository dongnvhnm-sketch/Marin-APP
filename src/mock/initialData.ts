import { Order, ReconciliationBatch, Store } from '../types';
export { INITIAL_USERS, createDefaultPermissions } from '../users/userData';

// Toàn bộ dữ liệu cửa hàng cũ đã được xóa sạch
export const INITIAL_STORES: Store[] = [];

// Toàn bộ dữ liệu đơn hàng cũ đã được xóa sạch
export const INITIAL_ORDERS: Order[] = [];

// Toàn bộ dữ liệu đối soát cũ đã được xóa sạch
export const INITIAL_RECONCILIATIONS: ReconciliationBatch[] = [];

