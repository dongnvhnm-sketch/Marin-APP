import React, { useState, useMemo } from 'react';
import { Search, RotateCw, Plus, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TablePagination } from '../components/TablePagination';

export const StoreListView: React.FC = () => {
  const {
    filteredStores,
    toggleStoreStatus,
    deleteStore,
    setCurrentPage,
    setSelectedStoreIdForDetail,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeMenuStoreId, setActiveMenuStoreId] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const filterKey = `${searchTerm}_${statusFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const displayedStores = useMemo(() => {
    return filteredStores.filter((store) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) {
        return statusFilter === 'all' ? true : store.status === statusFilter;
      }

      const matchesSearch =
        store.name.toLowerCase().includes(term) ||
        store.id.toLowerCase().includes(term) ||
        store.phone.includes(term) ||
        store.contactName.toLowerCase().includes(term) ||
        (store.username && store.username.toLowerCase().includes(term)) ||
        (store.email && store.email.toLowerCase().includes(term)) ||
        (store.address && store.address.toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === 'all' ? true : store.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [filteredStores, searchTerm, statusFilter]);

  const paginatedStores = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayedStores.slice(start, start + pageSize);
  }, [displayedStores, page, pageSize]);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Danh sách cửa hàng
          </h2>
          <div className="text-xs text-gray-500 mt-0.5 space-x-1">
            <span>Quản lý cửa hàng</span>
            <span>&gt;</span>
            <span className="text-gray-700 font-medium">Danh sách cửa hàng</span>
          </div>
        </div>

        {/* Top Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {}}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            title="Làm mới dữ liệu"
          >
            <RotateCw size={16} />
          </button>
            <button
              onClick={() => setCurrentPage('store_create')}
              className="flex items-center space-x-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Plus size={16} />
              <span>Thêm cửa hàng</span>
            </button>
        </div>
      </div>

      {/* Filter and Search Bar matching Screenshot 2 */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <input
            type="text"
            placeholder="Tìm kiếm theo thông tin cửa hàng/sđt người dùng"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-gray-50/50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-[#ef4444] focus:bg-white"
          />
          <Search size={15} className="absolute right-2.5 top-2.5 text-gray-400" />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500 font-medium whitespace-nowrap">Trạng thái</span>
          <span className="text-gray-300">|</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-gray-50/50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-[#ef4444]"
          >
            <option value="all">Chọn trạng thái (Tất cả)</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>

        {/* Apply Button */}
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          Áp dụng
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase bg-gray-50/40">
                <th className="py-3.5 px-4 font-semibold">Mã cửa hàng</th>
                <th className="py-3.5 px-4 font-semibold">Tên cửa hàng</th>
                <th className="py-3.5 px-4 font-semibold">Tên người liên hệ</th>
                <th className="py-3.5 px-4 font-semibold">Số điện thoại</th>
                <th className="py-3.5 px-4 font-semibold">Ngày tạo</th>
                <th className="py-3.5 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3.5 px-3 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-xs text-gray-400">
                    <p className="font-medium text-gray-500 mb-1">Chưa có cửa hàng nào được lưu trong hệ thống.</p>
                    <p className="text-[11px] text-gray-400">
                      Thông tin cửa hàng sẽ tự động xuất hiện tại đây khi khách hàng đăng ký tài khoản ở màn đăng nhập ban đầu hoặc khi nhấn &quot;Thêm cửa hàng&quot;.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedStores.map((store) => (
                  <tr
                    key={store.id}
                    className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedStoreIdForDetail(store.id);
                      setCurrentPage('store_detail');
                    }}
                  >
                  <td className="py-3 px-4 font-mono font-medium text-blue-600">
                    {store.id}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    <div className="font-semibold">{store.name}</div>
                    {store.username && (
                      <div className="text-[11px] text-gray-500 font-normal mt-0.5 flex items-center space-x-1.5">
                        <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">@{store.username}</span>
                        {store.email && <span className="text-gray-400 truncate max-w-[180px]">({store.email})</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    <div className="font-medium text-gray-800">{store.contactName}</div>
                    {store.address && (
                      <div className="text-[11px] text-gray-400 line-clamp-1 max-w-[240px]" title={store.address}>
                        {store.address}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-medium font-mono">
                    {store.phone}
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {store.createdAt}
                  </td>
                  {/* Status Toggle Switch */}
                  <td
                    className="py-3 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={store.status === 'active'}
                        onChange={() => toggleStoreStatus(store.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </td>
                  {/* Action Menu */}
                  <td
                    className="py-3 px-3 text-center relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuStoreId(activeMenuStoreId === store.id ? null : store.id);
                    }}
                  >
                    <button className="p-1 rounded hover:bg-gray-200 text-gray-500">
                      <MoreVertical size={16} />
                    </button>

                    {activeMenuStoreId === store.id && (
                      <div className="absolute right-4 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 w-36 text-left">
                        <button
                          onClick={() => {
                            setSelectedStoreIdForDetail(store.id);
                            setCurrentPage('store_detail');
                            setActiveMenuStoreId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Eye size={13} />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          onClick={() => {
                            const result = deleteStore(store.id);
                            if (!result.ok) alert(result.error);
                            setActiveMenuStoreId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                        >
                          <Trash2 size={13} />
                          <span>Xóa cửa hàng</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination with dynamic page calculation and page size popover matching Screenshot 2 */}
        <TablePagination
          currentPage={page}
          totalItems={displayedStores.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};
