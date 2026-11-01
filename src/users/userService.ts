import { AppUser, Store } from '../types';
import { INITIAL_USERS, createDefaultUserForStore } from './userData';

export const STORAGE_KEYS = {
  USERS: 'dolax_users',
  LOGGED_IN_IDS: 'dolax_logged_in_user_ids',
  CURRENT_USER_ID: 'dolax_current_user_id',
  IS_AUTHENTICATED: 'dolax_is_authenticated',
} as const;

/**
 * Đọc danh sách người dùng từ localStorage
 */
export const loadUsersFromStorage = (): AppUser[] => {
  if (typeof window === 'undefined') return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Lỗi đọc dolax_users từ localStorage:', err);
  }
  return INITIAL_USERS;
};

/**
 * Lưu danh sách người dùng vào localStorage
 */
export const saveUsersToStorage = (users: AppUser[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Lỗi lưu dolax_users vào localStorage:', err);
  }
};

/**
 * Đọc danh sách ID người dùng đang đăng nhập
 */
export const loadLoggedInUserIdsFromStorage = (): string[] => {
  if (typeof window === 'undefined') return ['USR001'];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return ['USR001'];
};

/**
 * Lưu danh sách ID người dùng đang đăng nhập
 */
export const saveLoggedInUserIdsToStorage = (ids: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN_IDS, JSON.stringify(ids));
  } catch {
    // ignore
  }
};

/**
 * Đọc ID tài khoản đang hoạt động
 */
export const loadCurrentUserIdFromStorage = (): string => {
  if (typeof window === 'undefined') return 'USR001';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (saved) return saved;
  } catch {
    // fallback
  }
  return 'USR001';
};

/**
 * Lưu ID tài khoản đang hoạt động
 */
export const saveCurrentUserIdToStorage = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  } catch {
    // ignore
  }
};

/**
 * Đọc trạng thái xác thực
 */
export const loadAuthStateFromStorage = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
    if (saved !== null) return saved === 'true';
  } catch {
    // fallback
  }
  return true;
};

/**
 * Lưu trạng thái xác thực
 */
export const saveAuthStateToStorage = (isAuth: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, String(isAuth));
  } catch {
    // ignore
  }
};

/**
 * Sinh ID tiếp theo cho tài khoản mới (USR001, USR002, ...)
 */
export const getNextUserId = (users: AppUser[]): string => {
  let maxNum = 0;
  users.forEach((u) => {
    const match = u.id.match(/\d+/);
    if (match) {
      const val = parseInt(match[0], 10);
      if (val > maxNum) maxNum = val;
    }
  });
  return `USR${String(maxNum + 1).padStart(3, '0')}`;
};

/**
 * Tìm tài khoản người dùng gắn với một cửa hàng cụ thể
 */
export const getUserByStoreId = (
  users: AppUser[],
  storeId: string,
  storeUsername?: string
): AppUser | undefined => {
  if (!storeId && !storeUsername) return undefined;

  // 1. Tìm theo allowedStoreIds
  let matched = users.find((u) => u.allowedStoreIds && u.allowedStoreIds.includes(storeId));
  if (matched) return matched;

  // 2. Tìm theo username
  if (storeUsername) {
    const cleanUName = storeUsername.trim().toLowerCase();
    matched = users.find((u) => u.username && u.username.trim().toLowerCase() === cleanUName);
    if (matched) return matched;
  }

  // 3. Tìm theo storeId trong username hoặc tên
  const cleanId = storeId.trim().toLowerCase();
  matched = users.find(
    (u) =>
      (u.username && u.username.toLowerCase() === `shop_${cleanId}`) ||
      (u.username && u.username.toLowerCase() === cleanId)
  );

  return matched;
};

/**
 * Xử lý đăng nhập tài khoản người dùng
 */
export const authenticateUser = (
  users: AppUser[],
  accountInput: string,
  passwordInput?: string
): { success: boolean; error?: string; user?: AppUser } => {
  const cleanInput = accountInput.trim().toLowerCase();
  const cleanPass = passwordInput?.trim() || '';

  const matchedUser = users.find(
    (u) =>
      (u.username && u.username.toLowerCase() === cleanInput) ||
      u.email.toLowerCase() === cleanInput ||
      u.phone.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, '') ||
      u.id.toLowerCase() === cleanInput
  );

  if (!matchedUser) {
    return {
      success: false,
      error: 'Tài khoản (Tên đăng nhập, Email hoặc SĐT) không tồn tại trên hệ thống.',
    };
  }

  // Kiểm tra tài khoản có bị khóa không
  if (matchedUser.permissions && matchedUser.permissions.accountActive === false) {
    return {
      success: false,
      error: 'Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ Quản trị viên để mở khóa.',
    };
  }

  const expectedPassword = matchedUser.password || '12345678';
  if (cleanPass !== expectedPassword) {
    return {
      success: false,
      error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!',
    };
  }

  return { success: true, user: matchedUser };
};

/**
 * Thêm tài khoản người dùng mới và lưu vào storage
 */
export const addUser = (
  users: AppUser[],
  userData: Omit<AppUser, 'id' | 'createdAt'>
): { updatedUsers: AppUser[]; newUser: AppUser } => {
  const nextId = getNextUserId(users);
  const now = new Date();
  const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newUser: AppUser = {
    ...userData,
    id: nextId,
    createdAt: formattedDate,
  };

  const updatedUsers = [...users.filter((u) => u.id !== nextId), newUser];
  saveUsersToStorage(updatedUsers);
  return { updatedUsers, newUser };
};

/**
 * Cập nhật thông tin tài khoản người dùng
 */
export const updateUser = (
  users: AppUser[],
  id: string,
  updates: Partial<AppUser>
): AppUser[] => {
  const updatedUsers = users.map((u) => {
    if (u.id === id) {
      return {
        ...u,
        ...updates,
        permissions: updates.permissions
          ? { ...u.permissions, ...updates.permissions }
          : u.permissions,
        storePermissions: updates.storePermissions
          ? { ...u.storePermissions, ...updates.storePermissions }
          : u.storePermissions,
      };
    }
    return u;
  });

  saveUsersToStorage(updatedUsers);
  return updatedUsers;
};

/**
 * Xóa tài khoản người dùng
 */
export const deleteUser = (users: AppUser[], id: string): AppUser[] => {
  const updatedUsers = users.filter((u) => u.id !== id);
  saveUsersToStorage(updatedUsers);
  return updatedUsers;
};

/**
 * Khóa hoặc Mở khóa tài khoản người dùng
 */
export const toggleUserLock = (users: AppUser[], userId: string): AppUser[] => {
  const updatedUsers = users.map((u) => {
    if (u.id === userId) {
      const currentActive = u.permissions ? u.permissions.accountActive !== false : true;
      return {
        ...u,
        permissions: {
          ...u.permissions,
          accountActive: !currentActive,
        },
      };
    }
    return u;
  });

  saveUsersToStorage(updatedUsers);
  return updatedUsers;
};

/**
 * Đổi mật khẩu tài khoản người dùng
 */
export const changeUserPassword = (
  users: AppUser[],
  userId: string,
  newPassword: string
): AppUser[] => {
  const updatedUsers = users.map((u) =>
    u.id === userId ? { ...u, password: newPassword.trim() } : u
  );
  saveUsersToStorage(updatedUsers);
  return updatedUsers;
};

/**
 * Đảm bảo cửa hàng có ít nhất một tài khoản người dùng tương ứng.
 * Nếu chưa có, tự động tạo mới dựa trên thông tin cửa hàng.
 */
export const ensureStoreUser = (
  users: AppUser[],
  store: Store,
  customPassword?: string
): { updatedUsers: AppUser[]; user: AppUser; created: boolean } => {
  const existing = getUserByStoreId(users, store.id, store.username);
  if (existing) {
    // Đảm bảo store.id nằm trong allowedStoreIds
    if (!existing.allowedStoreIds.includes(store.id)) {
      const updated = updateUser(users, existing.id, {
        allowedStoreIds: [...existing.allowedStoreIds, store.id],
      });
      return {
        updatedUsers: updated,
        user: { ...existing, allowedStoreIds: [...existing.allowedStoreIds, store.id] },
        created: false,
      };
    }
    return { updatedUsers: users, user: existing, created: false };
  }

  // Chưa có tài khoản -> Tự động khởi tạo tài khoản mới
  const nextId = getNextUserId(users);
  const newUser = createDefaultUserForStore(store, nextId, customPassword);
  const updatedUsers = [...users, newUser];
  saveUsersToStorage(updatedUsers);
  return { updatedUsers, user: newUser, created: true };
};

/**
 * Tự động kiểm tra và đồng bộ toàn bộ danh sách cửa hàng với danh sách người dùng.
 * Nếu cửa hàng nào chưa có tài khoản tương ứng, tự động khởi tạo để hiển thị trên Quản lý cửa hàng.
 */
export const syncStoresWithUsers = (
  stores: Store[],
  currentUsers: AppUser[]
): { users: AppUser[]; hasChanges: boolean } => {
  let modifiedUsers = [...currentUsers];
  let hasChanges = false;

  stores.forEach((store) => {
    const existing = getUserByStoreId(modifiedUsers, store.id, store.username);
    if (!existing) {
      const nextId = getNextUserId(modifiedUsers);
      const newUser = createDefaultUserForStore(store, nextId);
      modifiedUsers.push(newUser);
      hasChanges = true;
    } else if (!existing.allowedStoreIds.includes(store.id)) {
      existing.allowedStoreIds = [...existing.allowedStoreIds, store.id];
      hasChanges = true;
    }
  });

  if (hasChanges) {
    saveUsersToStorage(modifiedUsers);
  }

  return { users: modifiedUsers, hasChanges };
};
