import { AppUser, PermissionSettings, Store } from '../types';

/**
 * Hàm tạo cài đặt phân quyền chi tiết cho tài khoản người dùng
 */
export const createDefaultPermissions = (allGranted = true): PermissionSettings => ({
  requests: {
    all: allGranted,
    add: allGranted,
    view: allGranted,
  },
  home: {
    all: allGranted,
    view: allGranted,
    processReturns: allGranted,
  },
  orders: {
    all: allGranted,
    rushPickup: allGranted,
    orderActions: allGranted,
    viewOrderList: allGranted,
    editOrderInfo: allGranted,
    rushDelivery: allGranted,
    createOrder: allGranted,
    editCod: allGranted,
    viewAllOrders: allGranted,
  },
  chat: {
    all: allGranted,
    messageList: allGranted,
    deleteMessage: allGranted,
    rating: allGranted,
  },
  products: {
    all: allGranted,
    add: allGranted,
    edit: allGranted,
    search: allGranted,
  },
  settings: {
    all: allGranted,
    notes: allGranted,
    blacklist: allGranted,
    pushConfig: allGranted,
    recipientList: allGranted,
  },
  cashFlow: {
    all: allGranted,
    history: allGranted,
    downloadFile: allGranted,
  },
  partialReturn: {
    all: allGranted,
    viewHistory: allGranted,
    downloadFile: allGranted,
  },
  accountActive: true,
  maskRecipientInfo: false,
});

/**
 * Danh sách người dùng hệ thống mặc định (Quản trị viên và người quản lý)
 */
export const INITIAL_USERS: AppUser[] = [
  {
    id: 'USR001',
    name: 'Công ty TNHH Vận Chuyển Dolax (Quản trị viên tối cao)',
    username: 'admin',
    email: 'dongnv.apple@gmail.com',
    phone: '024LC37798',
    password: 'admin@dolax2026',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    storeAccessType: 'all',
    allowedStoreIds: [],
    storePermissions: {
      canViewOrders: true,
      canViewShippingStatus: true,
      canViewRevenue: true,
    },
    permissions: createDefaultPermissions(true),
    createdAt: '15/09/2026 08:00',
  },
  {
    id: 'USR002',
    name: 'Phạm Ngọc Giang (Quản trị viên chi nhánh)',
    username: 'giang.phongthuy',
    email: 'giang.phongthuyhn@gmail.com',
    phone: '0822748225',
    password: '12345678',
    role: 'store_manager',
    storeAccessType: 'all',
    allowedStoreIds: [],
    storePermissions: {
      canViewOrders: true,
      canViewShippingStatus: true,
      canViewRevenue: true,
    },
    permissions: createDefaultPermissions(true),
    createdAt: '18/09/2026 10:15',
  },
  {
    id: 'USR003',
    name: 'Nguyễn Thế Vinh (Quản lý cửa hàng)',
    username: 'vinhnguyen',
    email: 'kelvinnguyen368@gmail.com',
    phone: '0327361188',
    password: '12345678',
    role: 'store_manager',
    storeAccessType: 'all',
    allowedStoreIds: [],
    storePermissions: {
      canViewOrders: true,
      canViewShippingStatus: true,
      canViewRevenue: true,
    },
    permissions: createDefaultPermissions(true),
    createdAt: '25/09/2026 14:30',
  },
  {
    id: 'USR004',
    name: 'Lê Thuỳ Dung (Kế toán Đối soát & Dòng tiền)',
    username: 'dung.ketoan',
    email: 'ketoan.dolax@gmail.com',
    phone: '0936112233',
    password: '12345678',
    role: 'accountant',
    storeAccessType: 'all',
    allowedStoreIds: [],
    storePermissions: {
      canViewOrders: true,
      canViewShippingStatus: true,
      canViewRevenue: true,
    },
    permissions: {
      ...createDefaultPermissions(false),
      home: { all: true, view: true, processReturns: false },
      orders: {
        all: false,
        rushPickup: false,
        orderActions: false,
        viewOrderList: true,
        editOrderInfo: false,
        rushDelivery: false,
        createOrder: false,
        editCod: false,
        viewAllOrders: true,
      },
      cashFlow: { all: true, history: true, downloadFile: true },
      settings: { all: false, notes: true, blacklist: false, pushConfig: false, recipientList: false },
      requests: { all: false, add: false, view: false },
      chat: { all: false, messageList: false, deleteMessage: false, rating: false },
      products: { all: false, add: false, edit: false, search: false },
      partialReturn: { all: false, viewHistory: false, downloadFile: false },
      accountActive: true,
      maskRecipientInfo: false,
    },
    createdAt: '20/09/2026 09:10',
  },
];

/**
 * Tạo tài khoản mặc định liên kết với một Cửa hàng
 */
export const createDefaultUserForStore = (
  store: Store,
  assignedId: string,
  customPassword?: string
): AppUser => {
  const cleanPhone = store.phone ? store.phone.replace(/\D/g, '') : '0901234567';
  const cleanUsername =
    store.username && store.username.trim()
      ? store.username.trim()
      : `shop_${store.id.toLowerCase()}`;

  const cleanEmail =
    store.email && store.email.trim()
      ? store.email.trim()
      : `${cleanUsername}@dolax.vn`;

  return {
    id: assignedId,
    name: store.contactName ? `${store.contactName} (${store.name})` : store.name,
    username: cleanUsername,
    email: cleanEmail,
    phone: cleanPhone,
    password: customPassword || '12345678',
    role: 'store_manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    storeAccessType: 'specific',
    allowedStoreIds: [store.id],
    storePermissions: {
      canViewOrders: true,
      canViewShippingStatus: true,
      canViewRevenue: true,
    },
    permissions: createDefaultPermissions(true),
    createdAt: store.createdAt || '30/10/2026 10:00',
  };
};
