import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_ORDERS,
  INITIAL_STORES,
} from '../mock/initialData';
import {
  AppUser,
  BatchOrderHistoryItem,
  Order,
  OrderStatus,
  ReconciliationBatch,
  ReconciliationStatus,
  Store,
} from '../types';
import { calculateShippingFeeByWeight } from '../utils/feeCalculator';
import {
  calculateReconciliationTotals,
  canTransitionOrder,
  canTransitionReconciliation,
  estimateCarrierCost,
  isEligibleForReconciliation,
  nextReconciliationId,
} from '../utils/moneyRules';
import {
  loadUsersFromStorage,
  saveUsersToStorage,
  loadLoggedInUserIdsFromStorage,
  saveLoggedInUserIdsToStorage,
  loadCurrentUserIdFromStorage,
  saveCurrentUserIdToStorage,
  loadAuthStateFromStorage,
  saveAuthStateToStorage,
  authenticateUser,
  addUser as addUserToStorage,
  updateUser as updateUserInStorage,
  deleteUser as deleteUserInStorage,
  getUserByStoreId,
  toggleUserLock as toggleUserLockInStorage,
  changeUserPassword as changeUserPasswordInStorage,
  ensureStoreUser,
  syncStoresWithUsers,
} from '../users/userService';

export type NavigationPage =
  | 'dashboard'
  | 'stores'
  | 'store_create'
  | 'store_detail'
  | 'orders'
  | 'order_create'
  | 'orders_batch'
  | 'delivery_fee_report'
  | 'profit_report'
  | 'cash_flow'
  | 'user_accounts';

// Kết quả của các thao tác liên quan đến tiền: thành công hoặc lỗi kèm lý do để giao diện báo cho người dùng
export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

interface AppContextType {
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;
  selectedStoreIdForDetail: string | null;
  setSelectedStoreIdForDetail: (id: string | null) => void;

  // Stores
  stores: Store[];
  filteredStores: Store[];
  addStore: (store: Omit<Store, 'id' | 'createdAt'>, customPassword?: string) => string;
  updateStore: (id: string, updates: Partial<Store>) => void;
  toggleStoreStatus: (id: string) => void;
  deleteStore: (id: string) => ActionResult;

  // Orders
  orders: Order[];
  filteredOrders: Order[];
  addOrder: (orderData: Partial<Order>) => ActionResult<{ trackingNumber: string }>;
  updateOrderStatus: (trackingNumber: string, status: OrderStatus) => ActionResult;
  incrementPrintCount: (trackingNumber: string) => void;

  // Batch Orders
  batchOrders: BatchOrderHistoryItem[];
  addBatchOrder: (batch: BatchOrderHistoryItem, createdOrders?: Order[]) => void;
  deleteBatchOrder: (id: string) => void;

  // Cash Flow & Reconciliation
  reconciliations: ReconciliationBatch[];
  filteredReconciliations: ReconciliationBatch[];
  createReconciliation: (batchData: Omit<ReconciliationBatch, 'id' | 'createdAt'>) => ActionResult<{ id: string }>;
  updateReconciliationStatus: (id: string, status: ReconciliationStatus) => ActionResult;
  deleteReconciliation: (id: string) => ActionResult;

  // Users & Permissions & Auth
  users: AppUser[];
  currentUser: AppUser | undefined;
  isAuthenticated: boolean;
  loggedInUserIds: string[];
  loggedInUsers: AppUser[];
  login: (phoneOrEmail: string, password?: string) => { success: boolean; error?: string; user?: AppUser; needsPasswordSetup?: boolean };
  addAccountSession: (phoneOrEmail: string, password?: string) => { success: boolean; error?: string; user?: AppUser; needsPasswordSetup?: boolean };
  completeFirstTimeSetup: (userId: string, newPassword: string) => { success: boolean; error?: string };
  resetUserPassword: (userId: string) => ActionResult;
  removeAccountSession: (userId: string) => void;
  logout: () => void;
  setCurrentUserId: (id: string) => void;
  addUser: (userData: Omit<AppUser, 'id' | 'createdAt'>) => string;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;

  // Store User Helpers
  getUserForStore: (storeId: string, storeUsername?: string) => AppUser | undefined;
  updateStoreUser: (storeId: string, updates: Partial<AppUser>) => void;
  createStoreUserAccount: (store: Store, customPassword?: string) => AppUser;
  toggleUserLock: (userId: string) => void;
  changeUserPassword: (userId: string, newPass: string) => void;
  syncAllStoreAccounts: () => void;

  // Helpers
  formatVND: (amount: number) => string;
  canViewRevenue: boolean;
  canViewOrders: boolean;
  canViewShippingStatus: boolean;
  dateRange: '7days' | '15days' | 'custom';
  setDateRange: (range: '7days' | '15days' | 'custom') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Tự động xóa sạch dữ liệu cửa hàng, đơn hàng cũ và đối soát cũ đã lưu trong localStorage
const DOLAX_CLEANUP_VERSION = 'dolax_clean_v4_empty_reconciliations_20261030';
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('dolax_cleanup_version') !== DOLAX_CLEANUP_VERSION) {
      // Sao lưu sang khóa dolax_backup_* trước khi xóa, để đổi số phiên bản không làm mất dữ liệu vĩnh viễn
      [
        'dolax_stores',
        'uship_stores',
        'dolax_orders',
        'uship_orders',
        'dolax_batch_orders',
        'dolax_reconciliations',
        'uship_reconciliations',
      ].forEach((key) => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            localStorage.setItem(`dolax_backup_${key}`, value);
          } catch {
            // hết hạn mức lưu trữ: không xóa dữ liệu nếu không sao lưu được
            return;
          }
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem('dolax_cleanup_version', DOLAX_CLEANUP_VERSION);
    }
  } catch {
    // ignore
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [selectedStoreIdForDetail, setSelectedStoreIdForDetail] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7days' | '15days' | 'custom'>('15days');

  // Persistence in localStorage (khởi tạo dữ liệu rỗng ban đầu)
  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('dolax_stores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STORES;
      }
    }
    return INITIAL_STORES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('dolax_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_ORDERS;
      }
    }
    return INITIAL_ORDERS;
  });

  const [batchOrders, setBatchOrders] = useState<BatchOrderHistoryItem[]>(() => {
    const saved = localStorage.getItem('dolax_batch_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('dolax_batch_orders', JSON.stringify(batchOrders));
  }, [batchOrders]);

  const [reconciliations, setReconciliations] = useState<ReconciliationBatch[]>(() => {
    const saved = localStorage.getItem('dolax_reconciliations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    return loadUsersFromStorage();
  });

  const [loggedInUserIds, setLoggedInUserIds] = useState<string[]>(() => {
    return loadLoggedInUserIdsFromStorage();
  });

  // Cờ đã đăng nhập lưu trong localStorage. Trạng thái đăng nhập thực tế (isAuthenticated)
  // chỉ đúng khi cờ này bật VÀ có một tài khoản hợp lệ, đang hoạt động ứng với phiên (xem bên dưới).
  const [authFlag, setAuthFlag] = useState<boolean>(() => {
    return loadAuthStateFromStorage();
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return loadCurrentUserIdFromStorage();
  });

  useEffect(() => {
    saveAuthStateToStorage(authFlag);
  }, [authFlag]);

  useEffect(() => {
    saveLoggedInUserIdsToStorage(loggedInUserIds);
  }, [loggedInUserIds]);

  useEffect(() => {
    localStorage.setItem('dolax_stores', JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem('dolax_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('dolax_reconciliations', JSON.stringify(reconciliations));
  }, [reconciliations]);

  useEffect(() => {
    saveUsersToStorage(users);
  }, [users]);

  useEffect(() => {
    saveCurrentUserIdToStorage(currentUserId);
  }, [currentUserId]);

  // Tự động kiểm tra và đồng bộ tài khoản cho các cửa hàng chưa có tài khoản trong dolax_users
  useEffect(() => {
    if (stores.length > 0) {
      const { users: syncedUsers, hasChanges } = syncStoresWithUsers(stores, users);
      if (hasChanges) {
        setUsers(syncedUsers);
      }
    }
  }, [stores]);

  // Accounts currently logged in
  const loggedInUsers = users.filter((u) => loggedInUserIds.includes(u.id));

  // Ensure current active user is one of the logged-in accounts
  // Không được dự phòng về users[0]: đó là tài khoản quản trị viên, nên ID sai/giả sẽ
  // vô tình cấp quyền admin. Không khớp tài khoản hợp lệ nào thì coi như chưa đăng nhập.
  const isUsable = (u: AppUser) => u.permissions?.accountActive !== false;
  const currentUser: AppUser | undefined =
    users.find((u) => u.id === currentUserId && loggedInUserIds.includes(u.id) && isUsable(u)) ||
    loggedInUsers.find(isUsable);

  const isAuthenticated = authFlag && !!currentUser;

  // Full access enabled (User management & permissions removed)
  const canViewRevenue = true;
  const canViewOrders = true;
  const canViewShippingStatus = true;

  const filteredStores = stores;
  const filteredOrders = orders;
  const filteredReconciliations = reconciliations;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(amount)) + " đ";
  };

  // Store actions
  const addStore = (storeData: Omit<Store, 'id' | 'createdAt'>, customPassword?: string): string => {
    let maxNum = 1179;
    stores.forEach((s) => {
      const match = s.id.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > maxNum) maxNum = val;
      }
    });
    const newId = `CH000${maxNum + 1}`;
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newStore: Store = {
      ...storeData,
      id: newId,
      createdAt: formattedDate,
    };

    setStores((prev) => {
      const updated = [newStore, ...prev.filter((s) => s.id !== newId)];
      try {
        localStorage.setItem('dolax_stores', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Tự động khởi tạo hoặc đồng bộ tài khoản người dùng gắn liền với cửa hàng mới tạo
    setUsers((prevUsers) => {
      const { updatedUsers } = ensureStoreUser(prevUsers, newStore, customPassword);
      return updatedUsers;
    });

    return newId;
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const toggleStoreStatus = (id: string) => {
    setStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s)),
    );
  };

  const deleteStore = (id: string): ActionResult => {
    const store = stores.find((s) => s.id === id);
    if (!store) return { ok: false, error: 'Không tìm thấy cửa hàng.' };
    // Xóa cửa hàng đang có đơn/phiếu sẽ để lại dữ liệu tiền mồ côi, không truy vết được.
    const orderCount = orders.filter((o) => o.storeId === id).length;
    const batchCount = reconciliations.filter((r) => r.storeId === id).length;
    if (orderCount > 0 || batchCount > 0) {
      return {
        ok: false,
        error: `Không thể xóa cửa hàng "${store.name}" vì đã có ${orderCount} đơn hàng và ${batchCount} phiếu đối soát. Hãy chuyển cửa hàng sang trạng thái ngưng hoạt động thay vì xóa.`,
      };
    }
    setStores((prev) => prev.filter((s) => s.id !== id));
    return { ok: true };
  };

  // Order actions
  const addOrder = (orderData: Partial<Order>): ActionResult<{ trackingNumber: string }> => {
    // Không dự phòng về stores[0]: đơn gắn nhầm cửa hàng sẽ làm sai phí và đối soát của cả hai bên.
    const store = stores.find((s) => s.id === orderData.storeId);
    if (!store) {
      return { ok: false, error: 'Không tìm thấy cửa hàng của đơn hàng. Vui lòng chọn lại cửa hàng.' };
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const randomOrder = Math.floor(1000000 + Math.random() * 9000000);

    // Mã vận đơn không được trùng với đơn nào đã có
    const usedTracking = new Set(orders.map((o) => o.trackingNumber));
    let trackingNumber = '';
    do {
      trackingNumber = `#8028${Math.floor(10000000 + Math.random() * 90000000)}`;
    } while (usedTracking.has(trackingNumber));

    const weight = orderData.weightKg || 0.5;

    // Tính phí dịch vụ giao hàng chuẩn xác theo bảng cước và bước nhảy của Store
    let calculatedServiceFee: number;
    if (orderData.serviceFee !== undefined && orderData.serviceFee !== null) {
      calculatedServiceFee = orderData.serviceFee;
    } else if (store.feeBrackets && store.feeBrackets.length > 0) {
      calculatedServiceFee = calculateShippingFeeByWeight(weight, store.feeBrackets, store.defaultFee).fee;
    } else {
      calculatedServiceFee = store.defaultFee || 22000;
    }

    // Cước thực tế: dùng số được truyền vào (cước thật từ đối tác); nếu không có thì ước tính và gắn cờ
    const hasRealCost = orderData.actualShippingCost !== undefined && orderData.actualShippingCost !== null;

    const newOrder: Order = {
      trackingNumber,
      orderCode: `#91${randomOrder}`,
      storeId: store.id,
      storeName: store.name,
      customerName: orderData.customerName || 'Khách Hàng',
      customerPhone: orderData.customerPhone || '0901234567',
      customerAddress: orderData.customerAddress || 'Hà Nội',
      productName: orderData.productName || 'Hàng thời trang / tiêu dùng',
      weightKg: weight,
      itemPrice: orderData.itemPrice || 0,
      serviceFee: calculatedServiceFee,
      actualShippingCost: hasRealCost ? (orderData.actualShippingCost as number) : estimateCarrierCost(calculatedServiceFee),
      costIsEstimated: hasRealCost ? (orderData.costIsEstimated ?? false) : true,
      // COD = 0 là hợp lệ (đơn đã thanh toán trước) nên dùng ?? thay vì ||.
      // Nếu không truyền gì thì mặc định là 0, không tự bịa ra số tiền thu hộ.
      codAmount: orderData.codAmount ?? 0,
      orderValue: orderData.orderValue ?? orderData.itemPrice ?? orderData.codAmount ?? 0,
      status: orderData.status || 'sent',
      printCount: 1,
      createdAt: formattedDate,
      carrier: orderData.carrier || (store.carriers?.[0]?.name ?? 'J&T Express'),
      partialReceipt: orderData.partialReceipt ?? true,
      partialCodModified: false,
      pickupPoint: orderData.pickupPoint ?? store.pickupPoints?.[0]?.name ?? 'Kho lấy hàng chính',
      notes: orderData.notes,
    };

    setOrders((prev) => [newOrder, ...prev]);
    return { ok: true, trackingNumber };
  };

  const updateOrderStatus = (trackingNumber: string, status: OrderStatus): ActionResult => {
    const order = orders.find((o) => o.trackingNumber === trackingNumber);
    if (!order) return { ok: false, error: 'Không tìm thấy đơn hàng.' };
    if (!canTransitionOrder(order.status, status)) {
      return {
        ok: false,
        error:
          status === 'reconciled'
            ? 'Trạng thái "Đối soát" chỉ được đặt khi tạo phiếu đối soát.'
            : 'Đơn đã hủy hoặc đã đối soát nên không thể đổi trạng thái.',
      };
    }
    setOrders((prev) => prev.map((o) => (o.trackingNumber === trackingNumber ? { ...o, status } : o)));
    return { ok: true };
  };

  const incrementPrintCount = (trackingNumber: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.trackingNumber === trackingNumber ? { ...o, printCount: o.printCount + 1 } : o)),
    );
  };

  const addBatchOrder = (batch: BatchOrderHistoryItem, createdOrders?: Order[]) => {
    setBatchOrders((prev) => [batch, ...prev]);
    if (createdOrders && createdOrders.length > 0) {
      setOrders((prev) => [...createdOrders, ...prev]);
    }
  };

  const deleteBatchOrder = (id: string) => {
    setBatchOrders((prev) => prev.filter((b) => b.id !== id));
  };

  // Reconciliation actions
  const RECONCILIATION_LABEL: Record<ReconciliationStatus, string> = {
    pending: 'Chờ đối soát',
    reconciled: 'Đã chốt đối soát',
    transferred: 'Đã thanh toán',
    disputed: 'Tranh chấp',
  };
  const absVnd = (n: number) => `${Math.abs(n).toLocaleString('vi-VN')}đ`;

  const createReconciliation = (
    batchData: Omit<ReconciliationBatch, 'id' | 'createdAt'>,
  ): ActionResult<{ id: string }> => {
    const store = stores.find((s) => s.id === batchData.storeId);
    if (!store) return { ok: false, error: 'Không tìm thấy cửa hàng cần đối soát.' };

    const wanted = new Set(batchData.orderTrackingNumbers || []);
    if (wanted.size === 0) {
      return { ok: false, error: 'Không có đơn nào đủ điều kiện để đối soát (cần đơn đã giao thành công và chưa đối soát).' };
    }

    const matched = orders.filter((o) => wanted.has(o.trackingNumber));
    if (matched.length !== wanted.size) {
      return { ok: false, error: 'Một số đơn trong phiếu không còn tồn tại. Vui lòng tải lại danh sách và thử lại.' };
    }
    // Kiểm tra lại điều kiện tại thời điểm tạo, không tin hoàn toàn vào danh sách do giao diện gửi lên
    const invalid = matched.find((o) => !isEligibleForReconciliation(o, store.id));
    if (invalid) {
      return {
        ok: false,
        error: `Đơn ${invalid.trackingNumber} không đủ điều kiện đối soát (chưa giao thành công, thuộc cửa hàng khác hoặc đã nằm trong phiếu khác).`,
      };
    }

    // Tự tính lại toàn bộ số tiền từ đơn thật; bỏ qua các con số do giao diện gửi lên
    const totals = calculateReconciliationTotals(matched, store, batchData.otherFee || 0);
    const now = new Date();
    const nextId = nextReconciliationId(reconciliations.map((r) => r.id), now);
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newBatch: ReconciliationBatch = {
      ...batchData,
      ...totals,
      storeName: store.name,
      orderTrackingNumbers: matched.map((o) => o.trackingNumber),
      id: nextId,
      createdAt: formattedDate,
    };

    setOrders((prev) =>
      prev.map((o) => (wanted.has(o.trackingNumber) ? { ...o, reconciliationId: nextId, status: 'reconciled' } : o)),
    );
    setReconciliations((prev) => [newBatch, ...prev]);
    return { ok: true, id: nextId };
  };

  const updateReconciliationStatus = (id: string, status: ReconciliationStatus): ActionResult => {
    const batch = reconciliations.find((r) => r.id === id);
    if (!batch) return { ok: false, error: 'Không tìm thấy phiếu đối soát.' };
    if (batch.status === status) return { ok: true };
    if (!canTransitionReconciliation(batch.status, status)) {
      return {
        ok: false,
        error: `Không thể chuyển phiếu từ "${RECONCILIATION_LABEL[batch.status]}" sang "${RECONCILIATION_LABEL[status]}".`,
      };
    }
    if (status === 'transferred' && batch.netPayout <= 0) {
      return {
        ok: false,
        error:
          batch.netPayout < 0
            ? `Phiếu ${id} âm ${absVnd(batch.netPayout)}: cửa hàng còn nợ Dolax nên không có khoản nào để chi trả.`
            : `Phiếu ${id} có số tiền chi trả bằng 0, không cần chuyển khoản.`,
      };
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setReconciliations((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, transferredAt: status === 'transferred' ? formattedDate : r.transferredAt }
          : r,
      ),
    );
    return { ok: true };
  };

  const deleteReconciliation = (id: string): ActionResult => {
    const batch = reconciliations.find((r) => r.id === id);
    if (!batch) return { ok: false, error: 'Không tìm thấy phiếu đối soát.' };
    if (batch.status === 'transferred') {
      return { ok: false, error: 'Phiếu đã chi trả tiền nên không thể xóa.' };
    }
    // Trả các đơn về trạng thái "đã giao" để có thể đối soát lại, tránh đơn bị kẹt ở "đã đối soát"
    setOrders((prev) =>
      prev.map((o) =>
        o.reconciliationId === id ? { ...o, reconciliationId: undefined, status: 'delivered' } : o,
      ),
    );
    setReconciliations((prev) => prev.filter((r) => r.id !== id));
    return { ok: true };
  };

  // User actions
  const addUser = (userData: Omit<AppUser, 'id' | 'createdAt'>): string => {
    const { updatedUsers, newUser } = addUserToStorage(users, userData);
    setUsers(updatedUsers);
    return newUser.id;
  };

  const updateUser = (id: string, updates: Partial<AppUser>) => {
    const updated = updateUserInStorage(users, id, updates);
    setUsers(updated);
  };

  const deleteUser = (id: string) => {
    const updated = deleteUserInStorage(users, id);
    setUsers(updated);
  };

  const toggleUserLock = (userId: string) => {
    const updated = toggleUserLockInStorage(users, userId);
    setUsers(updated);
  };

  const changeUserPassword = (userId: string, newPass: string) => {
    const updated = changeUserPasswordInStorage(users, userId, newPass);
    setUsers(updated);
  };

  const getUserForStore = (storeId: string, storeUsername?: string): AppUser | undefined => {
    return getUserByStoreId(users, storeId, storeUsername);
  };

  const updateStoreUser = (storeId: string, updates: Partial<AppUser>) => {
    const targetUser = getUserByStoreId(users, storeId);
    if (targetUser) {
      updateUser(targetUser.id, updates);
    }
  };

  const createStoreUserAccount = (store: Store, customPassword?: string): AppUser => {
    const { updatedUsers, user } = ensureStoreUser(users, store, customPassword);
    setUsers(updatedUsers);
    return user;
  };

  const syncAllStoreAccounts = () => {
    const { users: synced, hasChanges } = syncStoresWithUsers(stores, users);
    if (hasChanges) {
      setUsers(synced);
    }
  };

  // Mở phiên đăng nhập cho một tài khoản đã được xác thực
  const startSession = (user: AppUser) => {
    setLoggedInUserIds((prev) => (prev.includes(user.id) ? prev : [...prev, user.id]));
    setCurrentUserId(user.id);
    setAuthFlag(true);
    saveAuthStateToStorage(true);
    saveCurrentUserIdToStorage(user.id);
  };

  const login = (
    phoneOrEmail: string,
    password?: string,
  ): { success: boolean; error?: string; user?: AppUser; needsPasswordSetup?: boolean } => {
    const res = authenticateUser(users, phoneOrEmail, password);
    if (!res.success || !res.user) {
      return res;
    }
    startSession(res.user);
    return res;
  };

  const addAccountSession = (
    phoneOrEmail: string,
    password?: string,
  ): { success: boolean; error?: string; user?: AppUser; needsPasswordSetup?: boolean } => {
    // Thêm một tài khoản vào danh sách phiên: cùng quy trình xác thực như đăng nhập
    return login(phoneOrEmail, password);
  };

  // Đặt mật khẩu lần đầu cho tài khoản chưa có mật khẩu, sau đó đăng nhập luôn
  const completeFirstTimeSetup = (
    userId: string,
    newPassword: string,
  ): { success: boolean; error?: string } => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'Không tìm thấy tài khoản.' };
    if (target.password) return { success: false, error: 'Tài khoản này đã có mật khẩu.' };
    if (target.permissions?.accountActive === false) {
      return { success: false, error: 'Tài khoản này đang bị tạm khóa.' };
    }
    const pass = newPassword.trim();
    if (pass.length < 8) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.' };
    }
    setUsers(changeUserPasswordInStorage(users, userId, pass));
    startSession({ ...target, password: pass });
    return { success: true };
  };

  // Quản trị viên đặt lại mật khẩu cho tài khoản khác.
  // Mật khẩu cũ bị XÓA (quản trị viên không biết và không đặt mật khẩu thay người dùng);
  // người dùng tự tạo mật khẩu mới ở lần đăng nhập kế tiếp qua màn hình "Đặt mật khẩu".
  // Lưu ý: kiểm tra quyền này chỉ có tác dụng ở phía trình duyệt, cần kiểm tra lại ở backend.
  const resetUserPassword = (userId: string): ActionResult => {
    if (!isAuthenticated || currentUser?.role !== 'admin') {
      return { ok: false, error: 'Chỉ quản trị viên mới được đặt lại mật khẩu.' };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { ok: false, error: 'Không tìm thấy tài khoản.' };
    if (target.id === currentUser.id) {
      return { ok: false, error: 'Không thể đặt lại mật khẩu của chính bạn tại đây.' };
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setUsers(
      updateUserInStorage(users, userId, {
        password: undefined,
        passwordResetAt: formattedDate,
        passwordResetBy: currentUser.name,
      }),
    );

    // Đăng xuất tài khoản bị đặt lại khỏi mọi phiên đang mở trên trình duyệt này
    const remaining = loggedInUserIds.filter((id) => id !== userId);
    setLoggedInUserIds(remaining);
    saveLoggedInUserIdsToStorage(remaining);
    return { ok: true };
  };

  const removeAccountSession = (userId: string) => {
    setLoggedInUserIds((prev) => {
      const remaining = prev.filter((id) => id !== userId);
      if (remaining.length === 0) {
        setAuthFlag(false);
        saveAuthStateToStorage(false);
      } else if (currentUserId === userId) {
        setCurrentUserId(remaining[0]);
        saveCurrentUserIdToStorage(remaining[0]);
      }
      return remaining;
    });
  };

  // Nút đăng xuất sẽ đăng xuất tất cả tài khoản và quay lại màn đăng nhập
  const logout = () => {
    setLoggedInUserIds([]);
    setCurrentUserId('');
    setAuthFlag(false);
    saveAuthStateToStorage(false);
    saveLoggedInUserIdsToStorage([]);
    saveCurrentUserIdToStorage('');
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        selectedStoreIdForDetail,
        setSelectedStoreIdForDetail,

        stores,
        filteredStores,
        addStore,
        updateStore,
        toggleStoreStatus,
        deleteStore,

        orders,
        filteredOrders,
        addOrder,
        updateOrderStatus,
        incrementPrintCount,

        batchOrders,
        addBatchOrder,
        deleteBatchOrder,

        reconciliations,
        filteredReconciliations,
        createReconciliation,
        updateReconciliationStatus,
        deleteReconciliation,

        users,
        currentUser,
        isAuthenticated,
        loggedInUserIds,
        loggedInUsers,
        login,
        addAccountSession,
        completeFirstTimeSetup,
        resetUserPassword,
        removeAccountSession,
        logout,
        setCurrentUserId,
        addUser,
        updateUser,
        deleteUser,

        getUserForStore,
        updateStoreUser,
        createStoreUserAccount,
        toggleUserLock,
        changeUserPassword,
        syncAllStoreAccounts,

        formatVND,
        canViewRevenue,
        canViewOrders,
        canViewShippingStatus,
        dateRange,
        setDateRange,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
