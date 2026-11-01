import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  PackageCheck,
  Truck,
  Send,
  CheckCircle,
  RotateCcw,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  SeparateDateRangePicker,
  formatDateDMY,
} from '../components/SeparateDateRangePicker';

export const DashboardView: React.FC = () => {
  const {
    filteredOrders,
    filteredStores,
    formatVND,
    setCurrentPage,
    setSelectedStoreIdForDetail,
  } = useApp();

  // Bộ lọc ngày tách riêng (mặc định 01/10/2026 - 28/10/2026 theo đúng Ảnh 1 & 2)
  const [dashboardStartDate, setDashboardStartDate] = useState<Date>(() => new Date(2026, 9, 1)); // 01/10/2026
  const [dashboardEndDate, setDashboardEndDate] = useState<Date>(() => new Date(2026, 9, 28)); // 28/10/2026

  // Hàm chuyển đổi chuỗi ngày "DD/MM/YYYY HH:mm" sang đối tượng Date
  const parseOrderDate = (dateStr: string): Date | null => {
    try {
      if (!dateStr) return null;
      const parts = dateStr.trim().split(' ');
      const datePart = parts[0]; // "27/09/2026"
      const [day, month, year] = datePart.split('/').map(Number);
      if (!day || !month || !year) return null;
      let hours = 0;
      let minutes = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':').map(Number);
        hours = timeParts[0] || 0;
        minutes = timeParts[1] || 0;
      }
      return new Date(year, month - 1, day, hours, minutes);
    } catch {
      return null;
    }
  };

  // Xác định khoảng thời gian lọc (Start và End)
  const { rangeStart, rangeEnd, rangeLabel, daysCount } = useMemo(() => {
    // Chuẩn hóa ngày (bỏ thành phần giờ/phút/giây để tính chính xác số ngày theo lịch)
    const sDate = new Date(dashboardStartDate.getFullYear(), dashboardStartDate.getMonth(), dashboardStartDate.getDate());
    const eDate = new Date(dashboardEndDate.getFullYear(), dashboardEndDate.getMonth(), dashboardEndDate.getDate());

    // Tính chính xác số ngày (ví dụ 01/10 đến 28/10 là đúng 28 ngày)
    const diffTime = eDate.getTime() - sDate.getTime();
    const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const start = new Date(sDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(eDate);
    end.setHours(23, 59, 59, 999);

    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const sW = weekdays[start.getDay()];
    const eW = weekdays[end.getDay()];

    return {
      rangeStart: start,
      rangeEnd: end,
      rangeLabel: `${sW}, ${formatDateDMY(start)} - ${eW}, ${formatDateDMY(end)}`,
      daysCount: diffDays,
    };
  }, [dashboardStartDate, dashboardEndDate]);

  // Lọc danh sách đơn hàng thực tế thuộc khoảng thời gian đã chọn
  const ordersInDateRange = useMemo(() => {
    return filteredOrders.filter((order) => {
      const orderDate = parseOrderDate(order.createdAt);
      if (!orderDate) return true;
      return orderDate >= rangeStart && orderDate <= rangeEnd;
    });
  }, [filteredOrders, rangeStart, rangeEnd]);

  // Metrics tính toán chính xác phản hồi ngay lập tức từ dữ liệu đơn hàng
  const totalOrders = useMemo(() => {
    return ordersInDateRange.length;
  }, [ordersInDateRange.length]);

  const totalServiceFee = useMemo(() => {
    return ordersInDateRange.reduce((sum, o) => sum + (o.serviceFee || 0), 0);
  }, [ordersInDateRange]);

  // Chỉ số mới: Số đơn hàng đã gửi giao hàng
  const sentOrders = useMemo(() => {
    return ordersInDateRange.filter((o) => o.status !== 'cancelled').length;
  }, [ordersInDateRange]);

  // Trạng thái chọn chỉ số hiển thị biểu đồ
  type MetricType = 'fee' | 'total_orders' | 'sent_orders';
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('fee');

  // Cấu hình metric hiển thị
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'fee':
        return {
          title: 'TỔNG PHÍ DỊCH VỤ GIAO HÀNG (TRIỆU ĐỒNG)',
          legend: 'Cước phát sinh theo ngày',
          yLabels: ['2.8tr', '2.4tr', '2.0tr', '1.6tr', '1.2tr', '0.8tr'],
          minY: 0.8,
          maxY: 2.8,
          formatVal: (val: number) => (val === 0 ? '0 đ' : `${val.toFixed(1)}tr`),
        };
      case 'total_orders':
        return {
          title: 'TỔNG SỐ LƯỢNG ĐƠN HÀNG (ĐƠN)',
          legend: 'Số đơn phát sinh theo ngày',
          yLabels: ['160 đơn', '135 đơn', '110 đơn', '85 đơn', '60 đơn', '35 đơn'],
          minY: 35,
          maxY: 160,
          formatVal: (val: number) => `${Math.round(val)} đơn`,
        };
      case 'sent_orders':
        return {
          title: 'SỐ ĐƠN HÀNG ĐÃ GỬI GIAO HÀNG (ĐƠN)',
          legend: 'Số đơn đã gửi theo ngày',
          yLabels: ['140 đơn', '118 đơn', '96 đơn', '74 đơn', '52 đơn', '30 đơn'],
          minY: 30,
          maxY: 140,
          formatVal: (val: number) => `${Math.round(val)} đơn`,
        };
    }
  }, [selectedMetric]);

  // Đếm theo trạng thái giao hàng thực tế
  const statusCounts = useMemo(() => {
    const counts = {
      sent: 0,
      picked: 0,
      in_transit: 0,
      delivering: 0,
      delivered: 0,
      returning: 0,
      cancelled: 0,
    };
    ordersInDateRange.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [ordersInDateRange]);

  // Danh sách Top cửa hàng thực tế
  const storeMetrics = useMemo(() => {
    return filteredStores
      .map((store) => {
        const storeOrders = ordersInDateRange.filter((o) => o.storeId === store.id);
        const orderCount = storeOrders.length;
        const fee = storeOrders.reduce((s, o) => s + (o.serviceFee || 0), 0);

        return {
          id: store.id,
          name: store.name,
          orderCount,
          totalFee: fee,
        };
      })
      .sort((a, b) => b.orderCount - a.orderCount);
  }, [filteredStores, ordersInDateRange]);

  // Dữ liệu biểu đồ động (Dynamic Chart Points) theo số ngày của bộ lọc
  const chartPoints = useMemo(() => {
    const numPoints = daysCount <= 7 ? daysCount : 7;
    const pts = [];
    const minX = 40;
    const maxX = 660;

    for (let i = 0; i < numPoints; i++) {
      const frac = numPoints <= 1 ? 0.5 : i / (numPoints - 1);
      const x = minX + frac * (maxX - minX);

      // Tính ngày thực tế dựa trên khoảng ngày lọc từ bộ lọc
      const ptTime = rangeStart.getTime() + frac * (rangeEnd.getTime() - rangeStart.getTime());
      const d = new Date(ptTime);
      const dayStr = String(d.getDate()).padStart(2, '0');
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dateLabel = `${dayStr}/${monthStr}`;

      if (totalOrders === 0) {
        pts.push({
          x,
          y: 175,
          val: 0,
          valFormatted: selectedMetric === 'fee' ? '0 đ' : '0 đơn',
          date: dateLabel,
        });
      } else {
        const dStart = new Date(d);
        dStart.setHours(0, 0, 0, 0);
        const dEnd = new Date(d);
        dEnd.setHours(23, 59, 59, 999);

        const dayOrders = ordersInDateRange.filter((o) => {
          const od = parseOrderDate(o.createdAt);
          return od && od >= dStart && od <= dEnd;
        });

        const val =
          selectedMetric === 'fee'
            ? dayOrders.reduce((s, o) => s + (o.serviceFee || 0), 0) / 1000000
            : selectedMetric === 'sent_orders'
            ? dayOrders.filter((o) => o.status !== 'cancelled').length
            : dayOrders.length;

        const clampedVal = Math.max(metricConfig.minY, Math.min(metricConfig.maxY, val));
        const yRatio = (clampedVal - metricConfig.minY) / (metricConfig.maxY - metricConfig.minY);
        const y = 175 - yRatio * (175 - 25);

        pts.push({
          x,
          y,
          val,
          valFormatted: metricConfig.formatVal(val),
          date: dateLabel,
        });
      }
    }

    return pts;
  }, [daysCount, rangeStart, rangeEnd, metricConfig, totalOrders, ordersInDateRange, selectedMetric]);

  // Tạo đường path SVG trơn mềm mượt (smooth SVG path)
  const svgPathD = useMemo(() => {
    if (chartPoints.length < 2) return '';
    let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [chartPoints]);

  const svgAreaD = useMemo(() => {
    if (!svgPathD || chartPoints.length === 0) return '';
    const last = chartPoints[chartPoints.length - 1];
    const first = chartPoints[0];
    return `${svgPathD} L ${last.x} 190 L ${first.x} 190 Z`;
  }, [svgPathD, chartPoints]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Title & Date Range Filter matching Screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Chào mừng bạn đến với hệ thống Lên đơn!
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Cổng vận hành đơn vị vận chuyển Dolax • Quản lý cửa hàng, đơn giao và đối soát dòng tiền
          </p>
        </div>

        {/* Bộ lọc ngày tách riêng ngày bắt đầu và kết thúc (Ảnh 1 & 2) */}
        <div className="flex items-center space-x-2">
          <SeparateDateRangePicker
            startDate={dashboardStartDate}
            endDate={dashboardEndDate}
            onRangeChange={(start, end) => {
              setDashboardStartDate(start);
              setDashboardEndDate(end);
            }}
          />
        </div>
      </div>

      {/* Overview Cards & Chart Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            Tổng quan đơn hàng
          </h2>
          <div className="text-xs text-gray-500 font-medium flex items-center space-x-1">
            <span>Dữ liệu lọc:</span>
            <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
              {daysCount} ngày ({rangeLabel})
            </span>
          </div>
        </div>

        {/* 3 Stat Cards: Nhấp vào từng thẻ sẽ chuyển đổi biểu đồ tương ứng */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Tổng phí dịch vụ giao hàng */}
          <div
            onClick={() => setSelectedMetric('fee')}
            className={`rounded-xl p-5 transition-all cursor-pointer relative ${
              selectedMetric === 'fee'
                ? 'border-2 border-[#ef4444] bg-white shadow-xs'
                : 'border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                <span className="font-medium">Tổng phí dịch vụ giao hàng</span>
                <HelpCircle size={14} className="text-gray-400" />
              </div>
              {selectedMetric === 'fee' && (
                <span className="text-[10px] font-semibold text-[#ef4444] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                  Đang xem
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {formatVND(totalServiceFee)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Cước dịch vụ thu của khách hàng trong {daysCount} ngày
            </p>
          </div>

          {/* Card 2: Tổng đơn hàng */}
          <div
            onClick={() => setSelectedMetric('total_orders')}
            className={`rounded-xl p-5 transition-all cursor-pointer relative ${
              selectedMetric === 'total_orders'
                ? 'border-2 border-[#ef4444] bg-white shadow-xs'
                : 'border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                <span className="font-medium">Tổng đơn hàng</span>
                <HelpCircle size={14} className="text-gray-400" />
              </div>
              {selectedMetric === 'total_orders' && (
                <span className="text-[10px] font-semibold text-[#ef4444] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                  Đang xem
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {totalOrders.toLocaleString('vi-VN')}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Số lượng vận đơn phát sinh trong khoảng thời gian này
            </p>
          </div>

          {/* Card 3: Số đơn hàng đã gửi giao hàng */}
          <div
            onClick={() => setSelectedMetric('sent_orders')}
            className={`rounded-xl p-5 transition-all cursor-pointer relative ${
              selectedMetric === 'sent_orders'
                ? 'border-2 border-[#ef4444] bg-white shadow-xs'
                : 'border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                <span className="font-medium">Số đơn hàng đã gửi giao hàng</span>
                <HelpCircle size={14} className="text-gray-400" />
              </div>
              {selectedMetric === 'sent_orders' && (
                <span className="text-[10px] font-semibold text-[#ef4444] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                  Đang xem
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {sentOrders.toLocaleString('vi-VN')}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Số lượng đơn đã gửi bàn giao cho đơn vị vận chuyển
            </p>
          </div>
        </div>

        {/* Line Chart: Thay đổi tiêu đề, trục Y và điểm dữ liệu theo chỉ số đang chọn */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {metricConfig.title}
            </span>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="inline-block w-3 h-0.5 bg-[#ef4444] rounded"></span>
              <span>{metricConfig.legend}</span>
            </div>
          </div>

          {/* SVG Smooth Curve Area Chart */}
          <div className="relative h-64 w-full">
            {/* Grid lines and y-axis labels */}
            <div className="absolute inset-0 flex flex-col justify-between text-[11px] text-gray-400 pointer-events-none pb-6">
              {metricConfig.yLabels.map((lbl, idx) => (
                <div key={idx} className="border-b border-gray-100 flex items-center justify-between">
                  <span>{lbl}</span>
                </div>
              ))}
            </div>

            {/* SVG Wave Line */}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Shaded Area under curve */}
              <path d={svgAreaD} fill="url(#redGradient)" />
              {/* Smooth Line Path */}
              <path
                d={svgPathD}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Highlight Nodes */}
              {chartPoints.map((pt, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    className="fill-white stroke-[#ef4444] stroke-2 group-hover:r-6 transition-all"
                  />
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <rect
                      x={pt.x - 30}
                      y={pt.y - 26}
                      width="60"
                      height="18"
                      rx="4"
                      className="fill-gray-900/90"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 13}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-white"
                    >
                      {pt.valFormatted}
                    </text>
                  </g>
                </g>
              ))}
            </svg>

            {/* X-axis date labels: Hiển thị đúng các ngày trong khoảng thời gian lọc */}
            <div className="flex justify-between text-xs text-gray-500 pt-3 px-4">
              {chartPoints.map((p, idx) => (
                <span key={idx} className="font-medium">
                  {p.date}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Top cửa hàng & Tỷ lệ đơn hàng theo trạng thái */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Top cửa hàng (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Top cửa hàng</h3>
              <button
                onClick={() => setCurrentPage('stores')}
                className="text-xs text-[#ef4444] hover:underline font-semibold flex items-center cursor-pointer"
              >
                <span>Xem tất cả cửa hàng</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {storeMetrics.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Chưa có cửa hàng nào được tạo trong hệ thống.
                </div>
              ) : (
                storeMetrics.slice(0, 5).map((st, idx) => (
                  <div
                    key={st.id}
                    onClick={() => {
                      setSelectedStoreIdForDetail(st.id);
                      setCurrentPage('store_detail');
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/70 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-800'
                            : idx === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#ef4444] transition-colors">
                          {st.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-mono">Mã: {st.id}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">
                        {st.orderCount.toLocaleString('vi-VN')} đơn
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        {formatVND(st.totalFee)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Tỷ lệ đơn hàng theo trạng thái (1 col) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Trạng thái giao hàng</h3>
          <p className="text-xs text-gray-500">
            Tổng kết theo khoảng thời gian đã chọn ({rangeLabel})
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <PackageCheck size={14} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-[11px] text-gray-600">Lấy hàng thành công</p>
                <p className="text-xs font-bold text-gray-900">{statusCounts.picked}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2 rounded-lg bg-blue-50/60 border border-blue-100">
              <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                <Truck size={14} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-[11px] text-gray-600">Đang vận chuyển</p>
                <p className="text-xs font-bold text-gray-900">{statusCounts.in_transit}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2 rounded-lg bg-indigo-50/60 border border-indigo-100">
              <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0">
                <Send size={14} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-[11px] text-gray-600">Đang phát hàng</p>
                <p className="text-xs font-bold text-gray-900">{statusCounts.delivering}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2 rounded-lg bg-lime-50/60 border border-lime-100">
              <div className="w-6 h-6 rounded bg-lime-500/20 text-lime-700 flex items-center justify-center shrink-0">
                <CheckCircle size={14} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-[11px] text-gray-600">Giao hàng thành công</p>
                <p className="text-xs font-bold text-gray-900">{statusCounts.delivered}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2 rounded-lg bg-rose-50/60 border border-rose-100">
              <div className="w-6 h-6 rounded bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                <RotateCcw size={14} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-[11px] text-gray-600">Chuyển hoàn</p>
                <p className="text-xs font-bold text-gray-900">{statusCounts.returning}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className="w-6 h-6 rounded bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                <XCircle size={14} />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-[11px] text-gray-600">Hủy đơn hàng</p>
                <p className="text-xs font-bold text-gray-900">{statusCounts.cancelled}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
