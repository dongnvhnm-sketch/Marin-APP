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
  | 'cash_flow';

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
  deleteStore: (id: string) => void;

  // Orders
  orders: Order[];
  filteredOrders: Order[];
  addOrder: (orderData: Partial<Order>) => void;
  updateOrderStatus: (trackingNumber: string, status: OrderStatus) => void;
  incrementPrintCount: (trackingNumber: string) => void;

  // Batch Orders
  batchOrders: BatchOrderHistoryItem[];
  addBatchOrder: (batch: BatchOrderHistoryItem, createdOrders?: Order[]) => void;
  deleteBatchOrder: (id: string) => void;

  // Cash Flow & Reconciliation
  reconciliations: ReconciliationBatch[];
  filteredReconciliations: ReconciliationBatch[];
  createReconciliation: (batchData: Omit<ReconciliationBatch, 'id' | 'createdAt'>) => string;
  updateReconciliationStatus: (id: string, status: ReconciliationStatus) => void;
  deleteReconciliation: (id: string) => void;

  // Users & Permissions & Auth
  users: AppUser[];
  currentUser: AppUser;
  isAuthenticated: boolean;
  loggedInUserIds: string[];
  loggedInUsers: AppUser[];
  login: (phoneOrEmail: string, password?: string) => { success: boolean; error?: string; user?: AppUser };
  addAccountSession: (phoneOrEmail: string, password?: string) => { success: boolean; error?: string; user?: AppUser };
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
      localStorage.removeItem('dolax_stores');
      localStorage.removeItem('uship_stores');
      localStorage.removeItem('dolax_orders');
      localStorage.removeItem('uship_orders');
      localStorage.removeItem('dolax_batch_orders');
      localStorage.removeItem('dolax_reconciliations');
      localStorage.removeItem('uship_reconciliations');
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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return loadAuthStateFromStorage();
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return loadCurrentUserIdFromStorage();
  });

  useEffect(() => {
    saveAuthStateToStorage(isAuthenticated);
  }, [isAuthenticated]);

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
  const currentUser: AppUser =
    users.find((u) => u.id === currentUserId && loggedInUserIds.includes(u.id)) ||
    loggedInUsers[0] ||
    users[0];

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

  const deleteStore = (id: string) => {
    setStores((prev) => prev.filter((s) => s.id !== id));
  };

  // Order actions
  const addOrder = (orderData: Partial<Order>) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const randomOrder = Math.floor(1000000 + Math.random() * 9000000);

    const store = stores.find((s) => s.id === orderData.storeId) || stores[0];
    const weight = orderData.weightKg || 0.5;

    // Tính phí dịch vụ giao hàng chuẩn xác theo bảng cước và bước nhảy của Store
    let calculatedServiceFee = orderData.serviceFee;
    if (!calculatedServiceFee) {
      if (store && store.feeBrackets && store.feeBrackets.length > 0) {
        calculatedServiceFee = calculateShippingFeeByWeight(weight, store.feeBrackets, store.defaultFee).fee;
      } else {
        calculatedServiceFee = store?.defaultFee || 22000;
      }
    }

    const newOrder: Order = {
      trackingNumber: `#8028${randomSuffix}`,
      orderCode: `#91${randomOrder}`,
      storeId: store?.id || orderData.storeId || 'CH0001001',
      storeName: store?.name || orderData.storeName || 'Cửa hàng',
      customerName: orderData.customerName || 'Khách Hàng',
      customerPhone: orderData.customerPhone || '0901234567',
      customerAddress: orderData.customerAddress || 'Hà Nội',
      productName: orderData.productName || 'Hàng thời trang / tiêu dùng',
      weightKg: orderData.weightKg || 0.5,
      itemPrice: orderData.itemPrice || 0,
      serviceFee: calculatedServiceFee,
      actualShippingCost: orderData.actualShippingCost || 16000,
      orderValue: orderData.orderValue || 150000,
      codAmount: orderData.codAmount || 150000,
      status: orderData.status || 'sent',
      printCount: 1,
      createdAt: formattedDate,
      carrier: orderData.carrier || (store?.carriers?.[0]?.name ?? 'J&T Express'),
      partialReceipt: orderData.partialReceipt ?? true,
      partialCodModified: false,
      pickupPoint: store?.pickupPoints?.[0]?.name ?? 'Kho lấy hàng chính',
      notes: orderData.notes,
    };

    setOrders((prev) => [newOrder, ...prev]);
  };

  const updateOrderStatus = (trackingNumber: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.trackingNumber === trackingNumber ? { ...o, status } : o)),
    );
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
  const createReconciliation = (batchData: Omit<ReconciliationBatch, 'id' | 'createdAt'>): string => {
    const nextId = `DS-2026-09-${String(reconciliations.length + 1).padStart(3, '0')}`;
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newBatch: ReconciliationBatch = {
      ...batchData,
      id: nextId,
      createdAt: formattedDate,
    };

    // Mark matched orders as reconciled with this ID
    if (batchData.orderTrackingNumbers?.length) {
      setOrders((prev) =>
        prev.map((o) =>
          batchData.orderTrackingNumbers.includes(o.trackingNumber)
            ? { ...o, reconciliationId: nextId, status: 'reconciled' }
            : o,
        ),
      );
    }

    setReconciliations((prev) => [newBatch, ...prev]);
    return nextId;
  };

  const updateReconciliationStatus = (id: string, status: ReconciliationStatus) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setReconciliations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              transferredAt: status === 'transferred' ? formattedDate : r.transferredAt,
            }
          : r,
      ),
    );
  };

  const deleteReconciliation = (id: string) => {
    setReconciliations((prev) => prev.filter((r) => r.id !== id));
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

  const login = (
    phoneOrEmail: string,
    password?: string,
  ): { success: boolean; error?: string; user?: AppUser } => {
    const res = authenticateUser(users, phoneOrEmail, password);
    if (!res.success || !res.user) {
      return res;
    }
    const matchedUser = res.user;
    setLoggedInUserIds((prev) => (prev.includes(matchedUser.id) ? prev : [...prev, matchedUser.id]));
    setCurrentUserId(matchedUser.id);
    setIsAuthenticated(true);
    saveAuthStateToStorage(true);
    saveCurrentUserIdToStorage(matchedUser.id);
    return res;
  };

  const addAccountSession = (
    phoneOrEmail: string,
    password?: string,
  ): { success: boolean; error?: string; user?: AppUser } => {
    const res = authenticateUser(users, phoneOrEmail, password);
    if (!res.success || !res.user) {
      return res;
    }
    const matchedUser = res.user;
    setLoggedInUserIds((prev) => (prev.includes(matchedUser.id) ? prev : [...prev, matchedUser.id]));
    setCurrentUserId(matchedUser.id);
    setIsAuthenticated(true);
    saveAuthStateToStorage(true);
    saveCurrentUserIdToStorage(matchedUser.id);
    return res;
  };

  const removeAccountSession = (userId: string) => {
    setLoggedInUserIds((prev) => {
      const remaining = prev.filter((id) => id !== userId);
      if (remaining.length === 0) {
        setIsAuthenticated(false);
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
    setIsAuthenticated(false);
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
