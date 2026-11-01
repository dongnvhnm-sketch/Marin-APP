import React, { useMemo } from 'react';
import { RotateCw, FileSpreadsheet, TrendingUp, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { estimateCarrierCost } from '../utils/moneyRules';

export const ProfitMarginReportView: React.FC = () => {
  const { filteredOrders: allOrders, formatVND } = useApp();

  // Đơn nháp và đơn đã hủy không phát sinh doanh thu hay cước nên không được tính vào lợi nhuận
  const filteredOrders = useMemo(
    () => allOrders.filter((o) => !['draft', 'cancelled', 'cancel_delivery'].includes(o.status)),
    [allOrders],
  );

  // Cước thực tế của đơn; chưa có thì dùng ước tính chung (cùng một hàm với lúc tạo đơn)
  const costOf = (o: { actualShippingCost?: number; serviceFee?: number }) =>
    o.actualShippingCost ?? estimateCarrierCost(o.serviceFee || 0);

  // Đơn cũ chưa có cờ coi như đang dùng cước ước tính
  const estimatedCount = useMemo(
    () => filteredOrders.filter((o) => o.costIsEstimated !== false).length,
    [filteredOrders],
  );

  // Metrics dynamically computed from real orders
  const totalServiceFee = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.serviceFee || 0), 0);
  }, [filteredOrders]);

  const totalActualCost = useMemo(() => {
    return filteredOrders.reduce(
      (sum, o) => sum + costOf(o),
      0,
    );
  }, [filteredOrders]);

  const totalMargin = totalServiceFee - totalActualCost;

  // Group real orders by store to calculate store profit rows
  const profitRows = useMemo(() => {
    if (filteredOrders.length === 0) return [];

    const storeMap: Record<
      string,
      {
        id: string;
        name: string;
        orders: number;
        serviceFee: number;
        actualCost: number;
        margin: number;
      }
    > = {};

    filteredOrders.forEach((o) => {
      const sId = o.storeId || 'CH_OTHER';
      const sName = o.storeName || 'Cửa hàng';
      if (!storeMap[sId]) {
        storeMap[sId] = {
          id: sId,
          name: sName,
          orders: 0,
          serviceFee: 0,
          actualCost: 0,
          margin: 0,
        };
      }
      const sFee = o.serviceFee || 0;
      const aCost = costOf(o);
      storeMap[sId].orders += 1;
      storeMap[sId].serviceFee += sFee;
      storeMap[sId].actualCost += aCost;
      storeMap[sId].margin += sFee - aCost;
    });

    return Object.values(storeMap).map((item, idx) => ({
      stt: idx + 1,
      ...item,
    }));
  }, [filteredOrders]);

  // Bar chart daily stats from actual orders
  const barData = useMemo(() => {
    if (filteredOrders.length === 0) return [];

    const dateMap: Record<string, { service: number; actual: number }> = {};

    filteredOrders.forEach((o) => {
      const dateKey = o.createdAt ? o.createdAt.split(' ')[0].slice(0, 5) : 'Hôm nay';
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { service: 0, actual: 0 };
      }
      const sFee = o.serviceFee || 0;
      const aCost = costOf(o);
      dateMap[dateKey].service += sFee / 1000000;
      dateMap[dateKey].actual += aCost / 1000000;
    });

    return Object.entries(dateMap).map(([day, val]) => ({
      day,
      service: Number(val.service.toFixed(2)),
      actual: Number(val.actual.toFixed(2)),
    }));
  }, [filteredOrders]);

  const maxChartVal = useMemo(() => {
    if (barData.length === 0) return 3;
    const max = Math.max(...barData.map((d) => Math.max(d.service, d.actual)));
    return Math.max(1, Math.ceil(max));
  }, [barData]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {estimatedCount > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <span className="font-bold">Lưu ý:</span> cước thực tế của {estimatedCount}/{filteredOrders.length} đơn đang là số
          <span className="font-bold"> ước tính</span> (chưa có cước thật từ đối tác vận chuyển), nên lợi nhuận bên dưới
          chỉ mang tính tham khảo.
        </div>
      )}

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Báo cáo chênh lệch lợi nhuận
          </h2>
          <div className="text-xs text-gray-500 mt-0.5 space-x-1">
            <span>Báo cáo</span>
            <span>&gt;</span>
            <span className="text-gray-700 font-medium">Báo cáo chênh lệch lợi nhuận</span>
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
          <div className="flex items-center space-x-2 text-xs">
            <select className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none">
              <option>Nhóm theo ngày</option>
              <option>Nhóm theo tuần</option>
              <option>Nhóm theo tháng</option>
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none">
              <option>7 ngày trước</option>
              <option>15 ngày trước</option>
              <option>30 ngày trước</option>
            </select>
          </div>
          <button
            onClick={() => alert('Đang xuất báo cáo chênh lệch lợi nhuận ra Excel...')}
            className="flex items-center space-x-1.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Main Chart & 3 Stat Cards Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Thống kê chênh lệch phí dịch vụ giao hàng
          </h3>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
              <span>Tổng phí dịch vụ giao hàng</span>
              <HelpCircle size={13} className="text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatVND(totalServiceFee)}
            </div>
          </div>

          <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
              <span>Tổng phí giao hàng thực tế</span>
              <HelpCircle size={13} className="text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatVND(totalActualCost)}
            </div>
          </div>

          <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center space-x-1 text-xs text-gray-500 mb-1">
              <span>Tổng chênh lệch</span>
              <HelpCircle size={13} className="text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 flex items-center space-x-1">
              <span>{formatVND(totalMargin)}</span>
              <TrendingUp size={20} className="text-emerald-500 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Bar Comparison Chart */}
        <div className="pt-4">
          {barData.length === 0 ? (
            <div className="py-14 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <TrendingUp size={36} className="mx-auto mb-2 text-gray-300 stroke-1" />
              <p className="text-sm font-semibold text-gray-700">Chưa có dữ liệu biểu đồ</p>
              <p className="text-xs text-gray-400 mt-1">
                Biểu đồ so sánh phí thu khách và phí trả hãng vận chuyển sẽ xuất hiện khi có đơn hàng.
              </p>
            </div>
          ) : (
            <>
              <div className="relative h-64 w-full">
                {/* Y axis lines */}
                <div className="absolute inset-0 flex flex-col justify-between text-[11px] text-gray-400 pointer-events-none">
                  <div className="border-b border-gray-100 flex items-center justify-between">
                    <span>{maxChartVal}tr</span>
                  </div>
                  <div className="border-b border-gray-100 flex items-center justify-between">
                    <span>{(maxChartVal * 0.8).toFixed(1)}tr</span>
                  </div>
                  <div className="border-b border-gray-100 flex items-center justify-between">
                    <span>{(maxChartVal * 0.6).toFixed(1)}tr</span>
                  </div>
                  <div className="border-b border-gray-100 flex items-center justify-between">
                    <span>{(maxChartVal * 0.4).toFixed(1)}tr</span>
                  </div>
                  <div className="border-b border-gray-100 flex items-center justify-between">
                    <span>{(maxChartVal * 0.2).toFixed(1)}tr</span>
                  </div>
                  <div className="border-b border-gray-100 flex items-center justify-between">
                    <span>0</span>
                  </div>
                </div>

                {/* Bars */}
                <div className="absolute inset-x-12 bottom-0 top-0 flex items-end justify-between px-4">
                  {barData.map((d) => {
                    const serviceHeight = (d.service / maxChartVal) * 100;
                    const actualHeight = (d.actual / maxChartVal) * 100;
                    return (
                      <div key={d.day} className="flex flex-col items-center">
                        <div className="flex items-end space-x-1.5 h-48">
                          {/* Red bar: Service fee collected */}
                          <div
                            style={{ height: `${serviceHeight}%` }}
                            className="w-5 bg-[#ef4444] rounded-t-sm transition-all hover:opacity-90"
                            title={`Phí thu khách: ${d.service}tr`}
                          ></div>
                          {/* Pink bar: Actual fee paid to carrier */}
                          <div
                            style={{ height: `${actualHeight}%` }}
                            className="w-5 bg-[#fca5a5] rounded-t-sm transition-all hover:opacity-90"
                            title={`Phí thực tế trả hãng: ${d.actual}tr`}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 mt-2 font-medium">
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-6 pt-4 text-xs font-medium text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-3.5 bg-[#ef4444] rounded-xs"></span>
                  <span>Phí dịch vụ giao hàng (Thu của shop)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-3.5 bg-[#fca5a5] rounded-xs"></span>
                  <span>Phí giao hàng thực tế (Trả hãng vận chuyển)</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Chi tiết phí dịch vụ giao hàng
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase bg-gray-50/50">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Mã cửa hàng</th>
                <th className="py-3 px-4">Tên cửa hàng</th>
                <th className="py-3 px-4 text-right">Số lượng đơn</th>
                <th className="py-3 px-4 text-right">Phí dịch vụ giao hàng</th>
                <th className="py-3 px-4 text-right">Phí giao hàng thực tế</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-700">Chênh lệch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {profitRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Không có dữ liệu báo cáo lợi nhuận.
                  </td>
                </tr>
              ) : (
                profitRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-3 text-center text-gray-500 font-medium">
                      {row.stt}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-700">{row.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{row.name}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-800">
                      {row.orders}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-gray-900">
                      {formatVND(row.serviceFee)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-700">
                      {formatVND(row.actualCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {formatVND(row.margin)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
