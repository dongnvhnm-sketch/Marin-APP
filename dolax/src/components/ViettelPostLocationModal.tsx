import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Database,
  ExternalLink,
  Layers,
  MapPin,
  Loader2,
  Sliders,
} from 'lucide-react';
import {
  ViettelProvince,
  ViettelDistrict,
  ViettelWardV2,
  ViettelWardV3,
  getV2Provinces,
  getV2Districts,
  getV2Wards,
  getV3Provinces,
  getV3Wards,
} from '../services/viettelPostService';

interface ViettelPostLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ViettelPostLocationModal: React.FC<ViettelPostLocationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'v3' | 'v2'>('v3');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Dữ liệu V2
  const [v2Provinces, setV2Provinces] = useState<ViettelProvince[]>([]);
  const [v2Districts, setV2Districts] = useState<ViettelDistrict[]>([]);
  const [v2Wards, setV2Wards] = useState<ViettelWardV2[]>([]);

  // Dữ liệu V3
  const [v3Provinces, setV3Provinces] = useState<ViettelProvince[]>([]);
  const [v3Wards, setV3Wards] = useState<ViettelWardV3[]>([]);

  // Filter selection
  const [selectedV2ProvinceId, setSelectedV2ProvinceId] = useState<number>(1); // Hà Nội
  const [selectedV3ProvinceId, setSelectedV3ProvinceId] = useState<number>(1); // Hà Nội mới

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadAll = async () => {
      setLoading(true);
      try {
        const [p2, d2, w2, p3, w3] = await Promise.all([
          getV2Provinces(),
          getV2Districts(),
          getV2Wards(),
          getV3Provinces(),
          getV3Wards(),
        ]);
        if (isMounted) {
          setV2Provinces(p2);
          setV2Districts(d2);
          setV2Wards(w2);
          setV3Provinces(p3);
          setV3Wards(w3);
        }
      } catch (err) {
        console.error('Lỗi nạp danh mục ViettelPost:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered lists
  const currentV2Districts = v2Districts.filter(
    (d) => d.PROVINCE_ID === selectedV2ProvinceId
  );
  const currentV2Wards = v2Wards.filter((w) =>
    currentV2Districts.some((d) => d.DISTRICT_ID === w.DISTRICT_ID)
  );

  const currentV3Wards = v3Wards.filter(
    (w) => w.PROVINCE_ID === selectedV3ProvinceId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#ef4444] flex items-center justify-center font-bold">
              <Database size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-gray-900">
                  Dữ liệu Địa danh Hành chính ViettelPost
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 size={11} className="mr-1" /> Đã nạp thành công
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Đồng bộ trực tiếp API ViettelPost Partner (Địa danh mới V3 &amp; Địa danh cũ V2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('v3')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'v3'
                  ? 'bg-[#ef4444] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Layers size={14} />
              <span>Địa danh mới (v3 - 2 cấp)</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                activeTab === 'v3' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {v3Provinces.length} Tỉnh/TP
              </span>
            </button>

            <button
              onClick={() => setActiveTab('v2')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'v2'
                  ? 'bg-[#ef4444] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Sliders size={14} />
              <span>Địa danh cũ (v2 - 3 cấp)</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                activeTab === 'v2' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {v2Provinces.length} Tỉnh/TP
              </span>
            </button>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center space-x-1">
            <span>API nguồn:</span>
            <a
              href={
                activeTab === 'v3'
                  ? 'https://partnerdev.viettelpost.vn/v3/categories/listProvinceNew'
                  : 'https://partnerdev.viettelpost.vn/v2/categories/listProvince'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-mono hover:underline inline-flex items-center"
            >
              viettelpost.vn/{activeTab} <ExternalLink size={11} className="ml-0.5" />
            </a>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center">
              <Loader2 size={32} className="animate-spin text-[#ef4444] mb-3" />
              <p className="text-sm font-medium">Đang nạp dữ liệu từ ViettelPost...</p>
            </div>
          ) : activeTab === 'v3' ? (
            /* TAB V3: MỚI */
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-900 flex items-start space-x-2">
                <MapPin size={16} className="text-[#ef4444] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">Cơ cấu địa danh mới ViettelPost (Chuẩn v3):</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    Gồm 2 cấp hành chính (Tỉnh/Thành phố mới và Phường/Xã mới trực thuộc tỉnh), tương thích quyết định cải cách sáp nhập đơn vị hành chính mới.
                  </div>
                  <div className="text-[10px] font-mono text-gray-600 mt-1">
                    API: /v3/categories/listProvinceNew ({v3Provinces.length} Tỉnh/TP) &bull; /v3/categories/listWardsNew ({v3Wards.length} Phường/Xã)
                  </div>
                </div>
              </div>

              {/* Selector Tỉnh V3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Chọn Tỉnh/Thành phố ({v3Provinces.length})
                  </label>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {v3Provinces.map((p) => (
                      <button
                        key={p.PROVINCE_ID}
                        onClick={() => setSelectedV3ProvinceId(p.PROVINCE_ID)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                          selectedV3ProvinceId === p.PROVINCE_ID
                            ? 'bg-[#ef4444] text-white shadow-xs'
                            : 'hover:bg-white text-gray-700'
                        }`}
                      >
                        <span className="truncate">{p.PROVINCE_NAME}</span>
                        <span className={`text-[10px] font-mono ml-2 ${
                          selectedV3ProvinceId === p.PROVINCE_ID ? 'text-rose-100' : 'text-gray-400'
                        }`}>
                          {p.PROVINCE_CODE}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danh sách Phường/Xã V3 của tỉnh được chọn */}
                <div className="md:col-span-2 border border-gray-200 rounded-xl p-3 bg-white flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700">
                      Phường / Xã trực thuộc (
                      {v3Provinces.find((p) => p.PROVINCE_ID === selectedV3ProvinceId)?.PROVINCE_NAME}:{' '}
                      {currentV3Wards.length} xã/phường)
                    </span>
                    <div className="relative w-44">
                      <Search size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm phường/xã..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-xs pl-7 pr-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:border-[#ef4444]"
                      />
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto grid grid-cols-2 gap-2 pr-1">
                    {currentV3Wards
                      .filter((w) =>
                        !searchTerm ||
                        w.WARDS_NAME.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((w) => (
                        <div
                          key={w.WARDS_ID}
                          className="px-2.5 py-1.5 border border-gray-100 rounded-lg bg-gray-50/70 hover:bg-rose-50/40 hover:border-rose-200 text-xs text-gray-700 flex items-center justify-between"
                        >
                          <span className="truncate">{w.WARDS_NAME}</span>
                          <span className="text-[10px] font-mono text-gray-400 ml-2">
                            #{w.WARDS_ID}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB V2: CŨ 3 CẤP */
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
                <MapPin size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">Cơ cấu địa danh cũ ViettelPost (Chuẩn v2 - 3 cấp):</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    Gồm 3 cấp hành chính truyền thống: Tỉnh/Thành phố &rarr; Quận/Huyện &rarr; Phường/Xã.
                  </div>
                  <div className="text-[10px] font-mono text-gray-600 mt-1">
                    API: /v2/categories/listProvince ({v2Provinces.length} Tỉnh) &bull; /v2/categories/listDistrict ({v2Districts.length} Quận/Huyện) &bull; /v2/categories/listWards?districtId=-1 ({v2Wards.length} Phường/Xã)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Tỉnh/TP V2 */}
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Tỉnh / TP ({v2Provinces.length})
                  </label>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {v2Provinces.map((p) => (
                      <button
                        key={p.PROVINCE_ID}
                        onClick={() => setSelectedV2ProvinceId(p.PROVINCE_ID)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                          selectedV2ProvinceId === p.PROVINCE_ID
                            ? 'bg-[#ef4444] text-white shadow-xs'
                            : 'hover:bg-white text-gray-700'
                        }`}
                      >
                        <span className="truncate">{p.PROVINCE_NAME}</span>
                        <span className={`text-[10px] font-mono ml-1 ${
                          selectedV2ProvinceId === p.PROVINCE_ID ? 'text-rose-100' : 'text-gray-400'
                        }`}>
                          {p.PROVINCE_CODE}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Quận/Huyện V2 */}
                <div className="border border-gray-200 rounded-xl p-3 bg-white">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Quận / Huyện ({currentV2Districts.length})
                  </label>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {currentV2Districts.map((d) => (
                      <div
                        key={d.DISTRICT_ID}
                        className="px-3 py-2 border border-gray-100 rounded-lg bg-gray-50/70 text-xs text-gray-700 flex items-center justify-between"
                      >
                        <span className="truncate">{d.DISTRICT_NAME}</span>
                        <span className="text-[10px] font-mono text-gray-400 ml-1">
                          #{d.DISTRICT_ID}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Phường/Xã V2 */}
                <div className="border border-gray-200 rounded-xl p-3 bg-white">
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Phường / Xã ({currentV2Wards.length})
                  </label>
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {currentV2Wards.slice(0, 100).map((w) => (
                      <div
                        key={w.WARDS_ID}
                        className="px-2.5 py-1.5 border border-gray-100 rounded-lg bg-gray-50/50 text-xs text-gray-700 flex items-center justify-between"
                      >
                        <span className="truncate">{w.WARDS_NAME}</span>
                        <span className="text-[10px] font-mono text-gray-400 ml-1">
                          #{w.WARDS_ID}
                        </span>
                      </div>
                    ))}
                    {currentV2Wards.length > 100 && (
                      <div className="text-[11px] text-gray-400 text-center py-1">
                        + còn {currentV2Wards.length - 100} xã/phường khác...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Tổng cộng đã nạp: <strong className="text-gray-800">12.445</strong> xã/phường V2,{' '}
            <strong className="text-gray-800">3.321</strong> xã/phường V3 mới.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
