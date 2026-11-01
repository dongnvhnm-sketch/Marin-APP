import React, { useState, useMemo } from 'react';
import { RotateCw, FileSpreadsheet, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  SeparateDateRangePicker,
  formatDateDMY,
} from '../components/SeparateDateRangePicker';
import { TablePagination } from '../components/TablePagination';

export const DeliveryFeeReportView: React.FC = () => {
  const { filteredOrders, filteredStores, formatVND } = useApp();
  const [storeFilter, setStoreFilter] = useState('all');

  // Bộ lọc ngày tạo đơn (mặc định 01/10/2026 - 28/10/2026 theo đúng Ảnh 1 & 2 người dùng cung cấp)
  const [startDate, setStartDate] = useState<Date>(() => new Date(2026, 9, 1)); // 01/10/2026
  const [endDate, setEndDate] = useState<Date>(() => new Date(2026, 9, 28)); // 28/10/2026
  const [isDateFilterActive, setIsDateFilterActive] = useState<boolean>(true);

  // Phân trang danh sách đơn hàng
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const filterKey = `${storeFilter}_${startDate.getTime()}_${endDate.getTime()}_${isDateFilterActive}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const displayedOrders = useMemo(() => {
    return filteredOrders.filter((order) => {
      if (storeFilter !== 'all' && order.storeId !== storeFilter) return false;

      if (isDateFilterActive && order.createdAt) {
        const parts = order.createdAt.trim().split(' ')[0].split('/');
        if (parts.length === 3) {
          const orderDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          const startTimestamp = new Date(startDate).setHours(0, 0, 0, 0);
          const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);
          if (orderDate.getTime() < startTimestamp || orderDate.getTime() > endTimestamp) {
            return false;
          }
        }
      }

      return true;
    });
  }, [filteredOrders, storeFilter, isDateFilterActive, startDate, endDate]);

  const totalOrders = displayedOrders.length;
  const totalServiceFee = displayedOrders.reduce((sum, o) => sum + (o.serviceFee || 0), 0);
  const totalCod = displayedOrders.reduce((sum, o) => sum + (o.codAmount || 0), 0);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayedOrders.slice(start, start + pageSize);
  }, [displayedOrders, page, pageSize]);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Báo cáo phí dịch vụ giao hàng
          </h2>
          <div className="text-xs text-gray-500 mt-0.5 space-x-1">
            <span>Báo cáo</span>
            <span>&gt;</span>
            <span className="text-gray-700 font-medium">Báo cáo phí dịch vụ giao hàng</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {}}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RotateCw size={16} />
          </button>
          <button
            onClick={() => alert('Đang xuất báo cáo chi tiết ra file Excel...')}
            className="flex items-center space-x-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Filter Row matching Screenshot 1 & 2 */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Bộ lọc ngày tách riêng ngày bắt đầu và kết thúc (Ảnh 1 & 2) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Ngày tạo đơn:</span>
          <SeparateDateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setIsDateFilterActive(true);
            }}
            onClear={() => setIsDateFilterActive(false)}
            isFiltered={isDateFilterActive}
          />
        </div>

        {/* Store selector */}
        <div className="h-[38px] bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium flex items-center min-w-[240px]">
          <span className="px-3 text-gray-600 whitespace-nowrap">Tên cửa hàng</span>
          <div className="w-[1px] bg-gray-200 self-stretch my-1" />
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="w-full h-full bg-transparent px-3 py-2 text-xs text-gray-800 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">Chọn cửa hàng (Tất cả)</option>
            {filteredStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsDateFilterActive(true)}
          className="h-[38px] bg-black hover:bg-gray-800 text-white text-xs font-semibold px-5 rounded-lg transition-colors cursor-pointer"
        >
          Áp dụng
        </button>
      </div>

      {/* Active Filter Tag */}
      {isDateFilterActive && (
        <div>
          <span className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-1 rounded-md text-xs font-medium">
            <span>
              Ngày tạo đơn: {formatDateDMY(startDate)} 00:00 - {formatDateDMY(endDate)} 23:59
            </span>
            <button
              type="button"
              onClick={() => setIsDateFilterActive(false)}
              className="hover:text-rose-900 cursor-pointer ml-1"
              title="Xóa bộ lọc ngày"
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}

      {/* 3 Summary Stat Cards matching Screenshot 5 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-xs">
          <p className="text-xs text-gray-500 mb-1">Tổng số lượng đơn</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-xs">
          <p className="text-xs text-gray-500 mb-1">Tổng phí dịch vụ</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatVND(totalServiceFee)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-xs">
          <p className="text-xs text-gray-500 mb-1">Tổng tiền thu hộ</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatVND(totalCod)}
          </p>
        </div>
      </div>

      {/* Detailed Delivery Fee Report Table matching Screenshot 5 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase bg-gray-50/50">
                <th className="py-3 px-4">Mã cửa hàng</th>
                <th className="py-3 px-4">Tên cửa hàng</th>
                <th className="py-3 px-4">Mã đơn hàng</th>
                <th className="py-3 px-4">Mã vận đơn</th>
                <th className="py-3 px-4 text-right">Tiền hàng</th>
                <th className="py-3 px-4 text-right">Phí dịch vụ</th>
                <th className="py-3 px-4 text-right">Giá trị đơn hàng</th>
                <th className="py-3 px-4 text-right">Tiền thu hộ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => (
                <tr key={order.trackingNumber} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-700">{order.storeId}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{order.storeName}</td>
                  <td className="py-3 px-4 text-gray-800">
                    <div>{order.orderCode}</div>
                    <div className="text-[10px] text-gray-400">{order.createdAt}</div>
                  </td>
                  <td className="py-3 px-4 text-blue-600 font-medium">
                    <div>{order.trackingNumber}</div>
                    <div className="text-[10px] text-gray-400">{order.createdAt}</div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatVND(order.itemPrice || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    {formatVND(order.serviceFee)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {formatVND(order.orderValue)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    {formatVND(order.codAmount)}
                  </td>
                </tr>
              ))}
              {displayedOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination with dynamic page calculation and page size popover matching Screenshot 2 */}
        <TablePagination
          currentPage={page}
          totalItems={totalOrders}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};
