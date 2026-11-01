import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Home,
  Store as StoreIcon,
  FileText,
  PieChart,
  Wallet,
  LogOut,
  Database,
} from 'lucide-react';
import { NavigationPage, useApp } from '../context/AppContext';
import { ViettelPostLocationModal } from './ViettelPostLocationModal';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    logout,
  } = useApp();

  const [orderMenuOpen, setOrderMenuOpen] = useState(true);
  const [reportMenuOpen, setReportMenuOpen] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleNav = (page: NavigationPage) => {
    setCurrentPage(page);
  };

  const isOrderSectionActive = ['orders', 'order_create', 'orders_batch'].includes(currentPage);

  return (
    <aside
      className={`bg-[#111827] text-gray-300 flex flex-col justify-between transition-all duration-200 select-none z-30 shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header with Dolax Logo */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          <div
            onClick={() => handleNav('dashboard')}
            className="flex items-center space-x-3 cursor-pointer overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ef4444] to-rose-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
              D
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-black text-white text-base tracking-wider uppercase">
                  DOLAX
                </span>
                <span className="text-[10px] text-gray-400 font-medium -mt-1 tracking-tight">
                  VẬN CHUYỂN &amp; COD
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 text-xs font-medium">
          {/* Trang chủ */}
          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
              currentPage === 'dashboard'
                ? 'bg-[#ef4444] text-white font-semibold shadow-sm'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
            title="Trang chủ"
          >
            <Home size={18} className="shrink-0" />
            {!collapsed && <span>Trang chủ</span>}
          </button>

          {/* Quản lý cửa hàng */}
          <button
            onClick={() => handleNav('stores')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
              ['stores', 'store_create', 'store_detail'].includes(currentPage)
                ? 'bg-[#ef4444] text-white font-medium shadow-sm'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
            title="Quản lý cửa hàng"
          >
            <StoreIcon size={18} className="shrink-0" />
            {!collapsed && <span>Quản lý cửa hàng</span>}
          </button>

          {/* Quản lý đơn hàng (Collapsible 3 mục theo ảnh thiết kế) */}
          <div>
            <button
              onClick={() => {
                if (collapsed) setCollapsed(false);
                setOrderMenuOpen(!orderMenuOpen);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                isOrderSectionActive
                  ? 'text-[#ef4444] font-semibold bg-gray-800/40'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
              title="Quản lý đơn hàng"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    isOrderSectionActive
                      ? 'bg-[#ef4444] text-white shadow-sm'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  <FileText size={14} />
                </div>
                {!collapsed && (
                  <span className={`truncate text-xs ${isOrderSectionActive ? 'text-[#ef4444]' : 'text-gray-200'}`}>
                    Quản lý đơn hàng
                  </span>
                )}
              </div>
              {!collapsed && (
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    isOrderSectionActive ? 'text-[#ef4444]' : 'text-gray-400'
                  } ${orderMenuOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {/* Submenu for Quản lý đơn hàng: 3 mục */}
            {!collapsed && orderMenuOpen && (
              <div className="ml-8 mt-1 space-y-1 text-xs border-l border-gray-800 pl-3">
                <button
                  onClick={() => handleNav('orders')}
                  className={`w-full text-left py-2 px-2 rounded-md transition-colors ${
                    currentPage === 'orders'
                      ? 'text-[#ef4444] font-bold bg-gray-800/60'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  Danh sách đơn hàng
                </button>
                <button
                  onClick={() => handleNav('order_create')}
                  className={`w-full text-left py-2 px-2 rounded-md transition-colors ${
                    currentPage === 'order_create'
                      ? 'text-[#ef4444] font-bold bg-gray-800/60'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  Tạo đơn hàng
                </button>
                <button
                  onClick={() => handleNav('orders_batch')}
                  className={`w-full text-left py-2 px-2 rounded-md transition-colors ${
                    currentPage === 'orders_batch'
                      ? 'text-[#ef4444] font-bold bg-gray-800/60'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  Lên đơn hàng loạt
                </button>
              </div>
            )}
          </div>

          {/* Báo cáo thống kê (Collapsible) */}
          <div>
            <button
              onClick={() => {
                if (collapsed) setCollapsed(false);
                setReportMenuOpen(!reportMenuOpen);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left ${
                ['delivery_fee_report', 'profit_report'].includes(currentPage)
                  ? 'bg-gray-800/80 text-white font-medium'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
              title="Báo cáo thống kê"
            >
              <div className="flex items-center space-x-3">
                <PieChart size={18} className="shrink-0" />
                {!collapsed && <span>Báo cáo thống kê</span>}
              </div>
              {!collapsed && (
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 text-gray-400 ${
                    reportMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {/* Submenu for Báo cáo thống kê */}
            {!collapsed && reportMenuOpen && (
              <div className="ml-8 mt-1 space-y-1 text-xs border-l border-gray-800 pl-3">
                <button
                  onClick={() => handleNav('delivery_fee_report')}
                  className={`w-full text-left py-2 px-2 rounded-md transition-colors ${
                    currentPage === 'delivery_fee_report'
                      ? 'text-white font-semibold bg-gray-800/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Cước phí vận chuyển
                </button>
                <button
                  onClick={() => handleNav('profit_report')}
                  className={`w-full text-left py-2 px-2 rounded-md transition-colors ${
                    currentPage === 'profit_report'
                      ? 'text-white font-semibold bg-gray-800/50'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tỷ suất lợi nhuận
                </button>
              </div>
            )}
          </div>

          {/* Dòng tiền & Đối soát */}
          <button
            onClick={() => handleNav('cash_flow')}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
              currentPage === 'cash_flow'
                ? 'bg-[#ef4444] text-white font-medium shadow-sm'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
            title="Quản lý dòng tiền và đối soát"
          >
            <Wallet size={18} className="shrink-0" />
            {!collapsed && <span>Dòng tiền &amp; Đối soát</span>}
          </button>

          {/* Dữ liệu địa danh ViettelPost */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left hover:bg-gray-800 text-gray-300 group cursor-pointer"
            title="Tra cứu dữ liệu địa danh ViettelPost (Cũ v2 & Mới v3)"
          >
            <Database size={18} className="shrink-0 text-rose-400 group-hover:scale-105 transition-transform" />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>Địa danh ViettelPost</span>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                  v2 &amp; v3
                </span>
              </div>
            )}
          </button>
        </nav>
      </div>

      {/* User profile & Logout at the bottom */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800/40">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow">
              {(currentUser?.name || 'A').charAt(0)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser?.name || 'Quản trị hệ thống'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {currentUser?.email || 'admin@dolax.vn'}
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={logout}
              className="text-gray-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Modal tra cứu địa danh ViettelPost */}
      <ViettelPostLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </aside>
  );
};
