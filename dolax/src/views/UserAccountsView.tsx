import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppUser } from '../types';

const ROLE_LABEL: Record<AppUser['role'], string> = {
  admin: 'Quản trị viên',
  store_manager: 'Quản lý cửa hàng',
  coordinator: 'Điều phối',
  accountant: 'Kế toán',
  support: 'Hỗ trợ',
};

export const UserAccountsView: React.FC = () => {
  const { users, stores, currentUser, resetUserPassword } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppUser['role']>('all');
  const [target, setTarget] = useState<AppUser | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return [u.name, u.username, u.email, u.phone, u.id].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [users, search, roleFilter]);

  const scopeLabel = (u: AppUser): string => {
    if (u.storeAccessType === 'all') return 'Tất cả cửa hàng';
    const names = u.allowedStoreIds.map((id) => stores.find((s) => s.id === id)?.name || id);
    if (names.length === 0) return 'Chưa gán cửa hàng';
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const confirmReset = () => {
    if (!target) return;
    const result = resetUserPassword(target.id);
    if (result.ok) {
      setNotice({
        type: 'success',
        text: `Đã đặt lại mật khẩu cho "${target.name}". Họ cần vào màn hình đăng nhập, nhập tên đăng nhập cùng một mật khẩu bất kỳ, rồi tự tạo mật khẩu mới. Hãy báo cho họ qua kênh liên lạc tin cậy.`,
      });
    } else {
      setNotice({ type: 'error', text: result.error });
    }
    setTarget(null);
  };

  // Chặn ngay cả khi ai đó mở trang này bằng cách khác (App.tsx cũng đã chặn)
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          Bạn không có quyền truy cập trang này.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý tài khoản</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Đặt lại mật khẩu khi người dùng quên. Quản trị viên không xem và không đặt hộ mật khẩu: người dùng tự tạo
          mật khẩu mới ở lần đăng nhập kế tiếp.
        </p>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
          role="status"
        >
          {notice.type === 'success' ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, tên đăng nhập, email, số điện thoại"
            className="w-80 max-w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-[#ef4444]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | AppUser['role'])}
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white text-gray-700 focus:outline-none"
        >
          <option value="all">Tất cả vai trò</option>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500">{visibleUsers.length} tài khoản</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[860px]">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-4 font-semibold">Tài khoản</th>
              <th className="py-3 px-4 font-semibold">Vai trò</th>
              <th className="py-3 px-4 font-semibold">Phạm vi</th>
              <th className="py-3 px-4 font-semibold">Mật khẩu</th>
              <th className="py-3 px-4 font-semibold">Đặt lại gần nhất</th>
              <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  Không có tài khoản nào khớp bộ lọc.
                </td>
              </tr>
            ) : (
              visibleUsers.map((u) => {
                const isSelf = u.id === currentUser.id;
                const hasPassword = Boolean(u.password);
                const locked = u.permissions?.accountActive === false;
                return (
                  <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">
                        {u.name}
                        {isSelf && <span className="ml-1.5 text-[10px] font-bold text-blue-600">(Bạn)</span>}
                      </div>
                      <div className="text-gray-500">
                        {u.username || u.email}
                        {u.phone ? ` · ${u.phone}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{ROLE_LABEL[u.role] || u.role}</td>
                    <td className="py-3 px-4 text-gray-700">{scopeLabel(u)}</td>
                    <td className="py-3 px-4">
                      {hasPassword ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã đặt
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ người dùng đặt
                        </span>
                      )}
                      {locked && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Đang khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {u.passwordResetAt ? (
                        <>
                          <div>{u.passwordResetAt}</div>
                          <div className="text-[11px] text-gray-400">bởi {u.passwordResetBy || 'quản trị viên'}</div>
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={isSelf || !hasPassword}
                        onClick={() => setTarget(u)}
                        title={
                          isSelf
                            ? 'Không thể đặt lại mật khẩu của chính bạn'
                            : !hasPassword
                              ? 'Tài khoản này chưa có mật khẩu, người dùng sẽ được yêu cầu tạo khi đăng nhập'
                              : 'Xóa mật khẩu hiện tại để người dùng tự đặt mật khẩu mới'
                        }
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <KeyRound size={13} />
                        <span>Đặt lại mật khẩu</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {target && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Đặt lại mật khẩu?</h3>
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Tài khoản: <span className="font-bold">{target.name}</span> ({target.username || target.email})
            </p>
            <ul className="text-xs text-gray-600 leading-relaxed list-disc pl-5 space-y-1">
              <li>Mật khẩu hiện tại sẽ bị xóa và không thể khôi phục.</li>
              <li>Tài khoản bị đăng xuất khỏi các phiên đang mở trên trình duyệt này.</li>
              <li>
                Người dùng đăng nhập bằng tên đăng nhập và một mật khẩu bất kỳ, sau đó tự tạo mật khẩu mới (ít nhất 8
                ký tự). Ai thực hiện bước này trước sẽ nắm tài khoản, nên hãy báo cho đúng người ngay.
              </li>
            </ul>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmReset}
                className="px-4 py-2 bg-[#ef4444] hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Xác nhận đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
