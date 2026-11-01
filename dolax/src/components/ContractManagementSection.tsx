import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Eye,
  Download,
  CheckCircle2,
  Building2,
  User,
  X,
  Printer,
  Maximize2,
} from 'lucide-react';
import { StoreContractInfo } from '../types';

// Mẫu ảnh minh họa CCCD mặt trước chuẩn
const SAMPLE_CCCD_FRONT =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="600" height="380" rx="20" fill="%23f0fdf4" stroke="%2386efac" stroke-width="4"/><rect x="25" y="25" width="550" height="330" rx="14" fill="%23ffffff" stroke="%23bbf7d0" stroke-width="2"/><text x="300" y="65" font-family="Arial" font-size="14" font-weight="bold" fill="%23dc2626" text-anchor="middle">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text><text x="300" y="85" font-family="Arial" font-size="12" fill="%2315803d" text-anchor="middle">Độc lập - Tự do - Hạnh phúc</text><text x="300" y="125" font-family="Arial" font-size="18" font-weight="bold" fill="%231e293b" text-anchor="middle">CĂN CƯỚC CÔNG DÂN</text><rect x="45" y="145" width="130" height="165" rx="8" fill="%23e2e8f0" stroke="%2394a3b8" stroke-width="2"/><circle cx="110" cy="205" r="35" fill="%2394a3b8"/><path d="M65 295 C65 250 155 250 155 295 Z" fill="%2394a3b8"/><text x="195" y="170" font-family="Arial" font-size="13" font-weight="bold" fill="%23475569">Số / No.: <tspan fill="%23dc2626" font-size="15">001096008819</tspan></text><text x="195" y="200" font-family="Arial" font-size="12" fill="%23475569">Họ và tên: <tspan font-weight="bold" fill="%230f172a">NGUYỄN VĂN AN</tspan></text><text x="195" y="228" font-family="Arial" font-size="12" fill="%23475569">Ngày sinh: <tspan font-weight="bold" fill="%230f172a">15/08/1992</tspan>   Giới tính: <tspan font-weight="bold" fill="%230f172a">Nam</tspan></text><text x="195" y="256" font-family="Arial" font-size="12" fill="%23475569">Quốc tịch: <tspan font-weight="bold" fill="%230f172a">Việt Nam</tspan></text><text x="195" y="284" font-family="Arial" font-size="12" fill="%23475569">Quê quán: <tspan font-weight="bold" fill="%230f172a">Hà Nội</tspan></text><rect x="490" y="150" width="60" height="45" rx="5" fill="%23fef08a" stroke="%23eab308" stroke-width="1.5"/><text x="520" y="177" font-family="Arial" font-size="9" font-weight="bold" fill="%23854d0e" text-anchor="middle">CHIP</text><text x="300" y="340" font-family="Arial" font-size="10" fill="%2364748b" text-anchor="middle">MẶT TRƯỚC (FRONT SIDE)</text></svg>';

// Mẫu ảnh minh họa CCCD mặt sau chuẩn
const SAMPLE_CCCD_BACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="600" height="380" rx="20" fill="%23f0fdf4" stroke="%2386efac" stroke-width="4"/><rect x="25" y="25" width="550" height="330" rx="14" fill="%23ffffff" stroke="%23bbf7d0" stroke-width="2"/><text x="50" y="70" font-family="Arial" font-size="12" fill="%23334155"><tspan font-weight="bold">Đặc điểm nhận dạng:</tspan> Nốt ruồi cách 1cm dưới sau đuôi mắt trái</text><text x="50" y="105" font-family="Arial" font-size="12" fill="%23334155"><tspan font-weight="bold">Ngày cấp:</tspan> 12/04/2021</text><text x="50" y="140" font-family="Arial" font-size="12" fill="%23334155"><tspan font-weight="bold">Nơi cấp:</tspan> CỤC TRƯỞNG CỤC CẢNH SÁT QUẢN LÝ HÀNH CHÍNH VỀ TRẬT TỰ XÃ HỘI</text><circle cx="470" cy="115" r="35" fill="%23dc2626" opacity="0.15"/><circle cx="470" cy="115" r="30" fill="none" stroke="%23dc2626" stroke-width="2" stroke-dasharray="3,3"/><text x="470" y="112" font-family="Arial" font-size="8" font-weight="bold" fill="%23dc2626" text-anchor="middle">BỘ CÔNG AN</text><text x="470" y="124" font-family="Arial" font-size="7" fill="%23dc2626" text-anchor="middle">ĐÃ XÁC THỰC</text><rect x="45" y="185" width="510" height="110" rx="6" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="1.5"/><text x="60" y="225" font-family="Courier, monospace" font-size="15" font-weight="bold" fill="%230f172a" letter-spacing="3">IDVNM0010960088194<<<<<<<<<<<<</text><text x="60" y="255" font-family="Courier, monospace" font-size="15" font-weight="bold" fill="%230f172a" letter-spacing="3">9208154M3104128VNM<<<<<<<<<<<8</text><text x="60" y="285" font-family="Courier, monospace" font-size="15" font-weight="bold" fill="%230f172a" letter-spacing="3">NGUYEN<<VAN<AN<<<<<<<<<<<<<<<<<<</text><text x="300" y="340" font-family="Arial" font-size="10" fill="%2364748b" text-anchor="middle">MẶT SAU (BACK SIDE)</text></svg>';

// Mẫu ảnh minh họa Giấy phép kinh doanh
const SAMPLE_BUSINESS_LICENSE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" rx="16" fill="%23fffbeb" stroke="%23fcd34d" stroke-width="4"/><rect x="25" y="25" width="550" height="370" rx="10" fill="%23ffffff" stroke="%23fde68a" stroke-width="2"/><text x="300" y="60" font-family="Arial" font-size="13" font-weight="bold" fill="%23dc2626" text-anchor="middle">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text><text x="300" y="78" font-family="Arial" font-size="11" fill="%2315803d" text-anchor="middle">Độc lập - Tự do - Hạnh phúc</text><text x="300" y="115" font-family="Arial" font-size="16" font-weight="black" fill="%231e293b" text-anchor="middle">GIẤY CHỨNG NHẬN ĐĂNG KÝ DOANH NGHIỆP</text><text x="300" y="135" font-family="Arial" font-size="11" fill="%2364748b" text-anchor="middle">CÔNG TY TNHH MỘT THÀNH VIÊN</text><text x="60" y="175" font-family="Arial" font-size="12" fill="%23334155"><tspan font-weight="bold">Mã số doanh nghiệp (MST):</tspan> <tspan font-weight="bold" fill="%23dc2626" font-size="14">0109827364</tspan></text><text x="60" y="205" font-family="Arial" font-size="12" fill="%23334155"><tspan font-weight="bold">Tên doanh nghiệp:</tspan> <tspan font-weight="bold" fill="%230f172a">CÔNG TY TNHH SHINE ACTIVE VIỆT NAM</tspan></text><text x="60" y="235" font-family="Arial" font-size="12" fill="%23334155"><tspan font-weight="bold">Tên giao dịch viết tắt:</tspan> SHINE ACTIVE CO., LTD</text><text x="60" y="265" font-family="Arial" font-size="12" fill="%23334155"><tspan font-weight="bold">Địa chỉ trụ sở chính:</tspan> Số 282 Phan Trọng Tuệ, Xã Thanh Liệt, Huyện Thanh Trì, TP. Hà Nội</text><text x="60" y="295" font-family="Arial" font-size="12" fill="%23334155"><tspan font-weight="bold">Người đại diện theo pháp luật:</tspan> <tspan font-weight="bold" fill="%230f172a">NGUYỄN VĂN AN</tspan> - Chức danh: Giám đốc</text><circle cx="480" cy="330" r="38" fill="%23dc2626" opacity="0.12"/><circle cx="480" cy="330" r="32" fill="none" stroke="%23dc2626" stroke-width="2" stroke-dasharray="4,2"/><text x="480" y="325" font-family="Arial" font-size="8" font-weight="bold" fill="%23dc2626" text-anchor="middle">SỞ KH &amp; ĐT</text><text x="480" y="337" font-family="Arial" font-size="7" fill="%23dc2626" text-anchor="middle">TP. HÀ NỘI</text><text x="300" y="380" font-family="Arial" font-size="10" fill="%2394a3b8" text-anchor="middle">GIẤY PHÉP KINH DOANH HỢP LỆ</text></svg>';

interface ContractManagementSectionProps {
  contractInfo?: StoreContractInfo;
  onChange: (info: StoreContractInfo) => void;
  storeName: string;
  storeId: string;
}

export const ContractManagementSection: React.FC<ContractManagementSectionProps> = ({
  contractInfo,
  onChange,
  storeName,
  storeId,
}) => {
  // Local state with sensible defaults
  const [data, setData] = useState<StoreContractInfo>(() => ({
    entityType: contractInfo?.entityType || 'business',
    cccdNumber: contractInfo?.cccdNumber || '001096008819',
    cccdFrontImage: contractInfo?.cccdFrontImage || SAMPLE_CCCD_FRONT,
    cccdBackImage: contractInfo?.cccdBackImage || SAMPLE_CCCD_BACK,
    cccdIssueDate: contractInfo?.cccdIssueDate || '12/04/2021',
    cccdIssuePlace: contractInfo?.cccdIssuePlace || 'Cục Cảnh sát QLHC về TTXH',
    businessTaxCode: contractInfo?.businessTaxCode || '0109827364',
    businessLicenseImage: contractInfo?.businessLicenseImage || SAMPLE_BUSINESS_LICENSE,
    legalRepresentative: contractInfo?.legalRepresentative || 'NGUYỄN VĂN AN',
    businessAddress:
      contractInfo?.businessAddress ||
      'Số 282 Phan Trọng Tuệ, Phường Thanh Liệt, Huyện Thanh Trì, TP. Hà Nội',
    contractCode: contractInfo?.contractCode || `HDDV-2026/DOLAX-${storeId}`,
    contractFileName:
      contractInfo?.contractFileName || `Hop_Dong_Dich_Vu_Van_Chuyen_Dolax_${storeId}.pdf`,
    contractFileSize: contractInfo?.contractFileSize || '1.85 MB',
    contractSignedDate: contractInfo?.contractSignedDate || '15/09/2026',
    contractExpireDate: contractInfo?.contractExpireDate || '15/09/2028',
    contractStatus: contractInfo?.contractStatus || 'active',
    contractFileUrl: contractInfo?.contractFileUrl || '#sample-pdf',
    notes: contractInfo?.notes || 'Hợp đồng đối tác vận chuyển tiêu chuẩn có bảo lãnh đối soát COD.',
  }));

  // Modals state
  const [previewImage, setPreviewImage] = useState<{ title: string; src: string } | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState<boolean>(false);

  // File input refs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Sync to parent
  const updateData = (patch: Partial<StoreContractInfo>) => {
    const next = { ...data, ...patch };
    setData(next);
    onChange(next);
  };

  // Upload handler for images
  const handleImageUpload = (
    field: 'cccdFrontImage' | 'cccdBackImage' | 'businessLicenseImage',
    file: File | null,
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updateData({ [field]: result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload handler for PDF contract
  const handlePdfUpload = (file: File | null) => {
    if (!file) return;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateData({
        contractFileName: file.name,
        contractFileSize: sizeMb,
        contractFileUrl: result || '#uploaded-pdf',
        contractStatus: 'active',
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 1. Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center space-x-2">
              <FileText size={16} className="text-[#ef4444]" />
              <span>Quản lý hợp đồng &amp; Hồ sơ định danh pháp lý</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Lưu trữ hợp đồng dịch vụ vận chuyển điện tử (PDF) và giấy tờ định danh (CCCD 2 mặt hoặc Giấy phép kinh doanh).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Hồ sơ hợp lệ</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Loại hình chủ thể (Cá nhân vs Doanh nghiệp) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
        <label className="block text-xs font-bold text-gray-800">
          Loại hình chủ thể cửa hàng:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateData({ entityType: 'individual' })}
            className={`p-3.5 rounded-xl border flex items-center space-x-3 text-left transition-all cursor-pointer ${
              data.entityType === 'individual'
                ? 'bg-white border-[#ef4444] shadow-xs ring-1 ring-[#ef4444]'
                : 'bg-white/60 border-gray-200 hover:bg-white text-gray-600'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                data.entityType === 'individual'
                  ? 'bg-rose-50 text-[#ef4444]'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <User size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Cá nhân (Căn cước công dân)</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Yêu cầu chụp và tải lên CCCD 2 mặt (Mặt trước + Mặt sau)
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateData({ entityType: 'business' })}
            className={`p-3.5 rounded-xl border flex items-center space-x-3 text-left transition-all cursor-pointer ${
              data.entityType === 'business'
                ? 'bg-white border-[#ef4444] shadow-xs ring-1 ring-[#ef4444]'
                : 'bg-white/60 border-gray-200 hover:bg-white text-gray-600'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                data.entityType === 'business'
                  ? 'bg-rose-50 text-[#ef4444]'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Building2 size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Doanh nghiệp / Hộ kinh doanh</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Yêu cầu Giấy chứng nhận đăng ký kinh doanh &amp; Mã số thuế
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Phần Hồ sơ định danh (CCCD 2 mặt hoặc GPKD) */}
      {data.entityType === 'individual' ? (
        /* ================= CÁ NHÂN: CCCD 2 MẶT ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
              <span>Ảnh Căn cước công dân (CCCD yêu cầu đủ 2 mặt)</span>
            </h4>
            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Đã tải đủ 2 mặt
            </span>
          </div>

          {/* 2 Cột hiển thị Mặt trước và Mặt sau CCCD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mặt trước */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                  <span className="text-red-500 font-bold">*</span>
                  <span>Mặt trước CCCD</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">CCCD_FRONT.jpg</span>
              </div>

              {/* Khung xem trước ảnh */}
              <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
                {data.cccdFrontImage ? (
                  <img
                    src={data.cccdFrontImage}
                    alt="CCCD Mặt trước"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4 text-gray-400">
                    <User size={32} className="mx-auto mb-1 opacity-50" />
                    <span className="text-xs">Chưa có ảnh mặt trước</span>
                  </div>
                )}

                {/* Nút phóng to xem ảnh */}
                {data.cccdFrontImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({ title: 'Căn cước công dân - Mặt trước', src: data.cccdFrontImage! })
                    }
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Phóng to xem chi tiết"
                  >
                    <Maximize2 size={14} />
                  </button>
                )}
              </div>

              {/* Nút hành động */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="file"
                  ref={frontInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload('cccdFrontImage', e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => frontInputRef.current?.click()}
                  className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Upload size={13} />
                  <span>Tải ảnh mặt trước mới</span>
                </button>
              </div>
            </div>

            {/* Mặt sau */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                  <span className="text-red-500 font-bold">*</span>
                  <span>Mặt sau CCCD</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">CCCD_BACK.jpg</span>
              </div>

              {/* Khung xem trước ảnh */}
              <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
                {data.cccdBackImage ? (
                  <img
                    src={data.cccdBackImage}
                    alt="CCCD Mặt sau"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4 text-gray-400">
                    <User size={32} className="mx-auto mb-1 opacity-50" />
                    <span className="text-xs">Chưa có ảnh mặt sau</span>
                  </div>
                )}

                {/* Nút phóng to xem ảnh */}
                {data.cccdBackImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({ title: 'Căn cước công dân - Mặt sau', src: data.cccdBackImage! })
                    }
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Phóng to xem chi tiết"
                  >
                    <Maximize2 size={14} />
                  </button>
                )}
              </div>

              {/* Nút hành động */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="file"
                  ref={backInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload('cccdBackImage', e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Upload size={13} />
                  <span>Tải ảnh mặt sau mới</span>
                </button>
              </div>
            </div>
          </div>

          {/* Các trường thông tin CCCD phụ trợ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Số CCCD (12 số)</label>
              <input
                type="text"
                value={data.cccdNumber || ''}
                onChange={(e) => updateData({ cccdNumber: e.target.value })}
                placeholder="Nhập 12 số CCCD"
                className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày cấp</label>
              <input
                type="text"
                value={data.cccdIssueDate || ''}
                onChange={(e) => updateData({ cccdIssueDate: e.target.value })}
                placeholder="DD/MM/YYYY"
                className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nơi cấp</label>
              <input
                type="text"
                value={data.cccdIssuePlace || ''}
                onChange={(e) => updateData({ cccdIssuePlace: e.target.value })}
                placeholder="Cục Cảnh sát QLHC về TTXH"
                className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white"
              />
            </div>
          </div>
        </div>
      ) : (
        /* ================= DOANH NGHIỆP: GIẤY PHÉP KINH DOANH ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
              <span>Giấy phép đăng ký kinh doanh (GPKD)</span>
            </h4>
            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Đã xác thực pháp nhân
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Khung tài liệu GPKD */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 flex items-center space-x-1.5">
                  <span className="text-red-500 font-bold">*</span>
                  <span>Ảnh chụp / Bản scan Giấy phép kinh doanh</span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">GPKD_SHINE_ACTIVE.pdf</span>
              </div>

              <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-4/3 flex items-center justify-center">
                {data.businessLicenseImage ? (
                  <img
                    src={data.businessLicenseImage}
                    alt="Giấy phép kinh doanh"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4 text-gray-400">
                    <Building2 size={36} className="mx-auto mb-1 opacity-50" />
                    <span className="text-xs">Chưa có bản scan GPKD</span>
                  </div>
                )}

                {data.businessLicenseImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({ title: 'Giấy phép đăng ký kinh doanh', src: data.businessLicenseImage! })
                    }
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Phóng to xem tài liệu"
                  >
                    <Maximize2 size={14} />
                  </button>
                )}
              </div>

              <div className="pt-1">
                <input
                  type="file"
                  ref={licenseInputRef}
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleImageUpload('businessLicenseImage', e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => licenseInputRef.current?.click()}
                  className="w-full py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Upload size={13} />
                  <span>Tải bản scan GPKD mới</span>
                </button>
              </div>
            </div>

            {/* Các trường thông tin pháp nhân doanh nghiệp */}
            <div className="space-y-3.5 border border-gray-200 rounded-2xl p-4 bg-white">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="text-red-500 font-bold mr-1">*</span>
                  Mã số thuế / Mã số doanh nghiệp
                </label>
                <input
                  type="text"
                  value={data.businessTaxCode || ''}
                  onChange={(e) => updateData({ businessTaxCode: e.target.value })}
                  placeholder="Ví dụ: 0109827364"
                  className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  <span className="text-red-500 font-bold mr-1">*</span>
                  Người đại diện theo pháp luật
                </label>
                <input
                  type="text"
                  value={data.legalRepresentative || ''}
                  onChange={(e) => updateData({ legalRepresentative: e.target.value.toUpperCase() })}
                  placeholder="Họ tên người đại diện pháp luật"
                  className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white uppercase font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Địa chỉ trụ sở đăng ký kinh doanh
                </label>
                <textarea
                  rows={2}
                  value={data.businessAddress || ''}
                  onChange={(e) => updateData({ businessAddress: e.target.value })}
                  placeholder="Địa chỉ trụ sở trên GPKD"
                  className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Hợp đồng dịch vụ quản lý bằng file PDF */}
      <div className="pt-4 border-t border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
              <span>Hợp đồng dịch vụ vận chuyển Dolax (Quản lý file PDF)</span>
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Hợp đồng nguyên tắc cung cấp dịch vụ giao nhận, cước phí và thỏa thuận đối soát COD điện tử.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center space-x-1">
              <CheckCircle2 size={13} />
              <span>Đang hiệu lực</span>
            </span>
          </div>
        </div>

        {/* Khung hiển thị file PDF hợp đồng */}
        <div className="p-4 bg-gradient-to-r from-slate-50 to-rose-50/30 border border-gray-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {/* Biểu tượng file PDF đỏ chuyên nghiệp */}
            <div className="w-12 h-14 bg-red-500 text-white rounded-xl shadow-xs flex flex-col items-center justify-center shrink-0">
              <FileText size={20} />
              <span className="text-[9px] font-black tracking-wider uppercase mt-0.5">PDF</span>
            </div>

            <div>
              <div className="text-xs font-bold text-gray-900 flex items-center space-x-2">
                <span>{data.contractFileName || `Hop_Dong_Dich_Vu_${storeId}.pdf`}</span>
                <span className="text-[10px] text-gray-400 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">
                  {data.contractFileSize || '1.85 MB'}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Số HĐ: <strong className="text-gray-800 font-mono">{data.contractCode}</strong>
                </span>
                <span>•</span>
                <span>
                  Hiệu lực:{' '}
                  <strong className="text-gray-800">
                    {data.contractSignedDate} ~ {data.contractExpireDate}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Các nút hành động với PDF */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Nút Xem file PDF */}
            <button
              type="button"
              onClick={() => setShowPdfViewer(true)}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Eye size={14} className="text-blue-600" />
              <span>Xem PDF</span>
            </button>

            {/* Nút Tải về PDF */}
            <a
              href={data.contractFileUrl || '#'}
              download={data.contractFileName || `Hop_Dong_Dich_Vu_${storeId}.pdf`}
              onClick={(e) => {
                if (data.contractFileUrl === '#sample-pdf' || !data.contractFileUrl) {
                  e.preventDefault();
                  alert('Đang tải file PDF hợp đồng: ' + data.contractFileName);
                }
              }}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Download size={14} className="text-emerald-600" />
              <span>Tải về</span>
            </a>

            {/* Nút Tải lên / Thay file PDF */}
            <input
              type="file"
              ref={pdfInputRef}
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handlePdfUpload(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="px-3.5 py-2 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Upload size={14} />
              <span>Thay file PDF</span>
            </button>
          </div>
        </div>

        {/* Thông tin phụ trợ về hợp đồng */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mã / Số hợp đồng</label>
            <input
              type="text"
              value={data.contractCode || ''}
              onChange={(e) => updateData({ contractCode: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày ký kết</label>
            <input
              type="text"
              value={data.contractSignedDate || ''}
              onChange={(e) => updateData({ contractSignedDate: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ngày hết hạn</label>
            <input
              type="text"
              value={data.contractExpireDate || ''}
              onChange={(e) => updateData({ contractExpireDate: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded-xl p-2.5 bg-white"
            />
          </div>
        </div>
      </div>

      {/* ================= MODAL PHÓNG TO ẢNH (LIGHTBOX) ================= */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 space-y-3 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-bold text-sm text-gray-900">{previewImage.title}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center overflow-auto bg-slate-100 rounded-xl p-2">
              <img src={previewImage.src} alt={previewImage.title} className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TRÌNH XEM FILE PDF HỢP ĐỒNG ================= */}
      {showPdfViewer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center font-black text-xs text-white">
                  PDF
                </div>
                <div>
                  <h4 className="text-xs font-bold truncate max-w-md">{data.contractFileName}</h4>
                  <p className="text-[10px] text-slate-400">Số HĐ: {data.contractCode}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  title="In tài liệu"
                >
                  <Printer size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfViewer(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  title="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Document Content Simulation */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-200 flex justify-center">
              <div className="bg-white w-full max-w-2xl min-h-[900px] shadow-lg rounded-sm p-10 text-gray-800 text-xs space-y-6 leading-relaxed font-serif">
                {/* Quốc hiệu tiêu ngữ */}
                <div className="text-center space-y-1">
                  <p className="font-bold text-sm tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="font-medium text-xs">Độc lập - Tự do - Hạnh phúc</p>
                  <div className="w-32 h-0.5 bg-gray-400 mx-auto mt-1"></div>
                </div>

                <div className="text-center pt-2">
                  <h2 className="text-base font-black uppercase text-gray-900">
                    HỢP ĐỒNG CUNG ỨNG DỊCH VỤ VẬN CHUYỂN VÀ THU HỘ COD
                  </h2>
                  <p className="text-[11px] text-gray-500 italic mt-0.5">Số: {data.contractCode}</p>
                </div>

                <div className="space-y-3 pt-3">
                  <p className="italic">
                    Căn cứ Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam;
                  </p>
                  <p className="italic">
                    Căn cứ Luật Thương mại và nhu cầu thực tế của hai bên;
                  </p>

                  <div className="pt-2 space-y-2 border-t border-gray-200">
                    <p className="font-bold uppercase text-gray-900">BÊN A (BÊN CUNG CẤP DỊCH VỤ):</p>
                    <p><strong>CÔNG TY CỔ PHẦN CÔNG NGHỆ VẬN CHUYỂN DOLAX VIỆT NAM</strong></p>
                    <p>Đại diện: Ông Kelvin Nguyễn - Chức vụ: Tổng Giám Đốc</p>
                    <p>Địa chỉ: Tầng 6, Tòa nhà Dolax Tower, Cầu Giấy, Hà Nội</p>
                  </div>

                  <div className="pt-2 space-y-2 border-t border-gray-200">
                    <p className="font-bold uppercase text-gray-900">BÊN B (CỬA HÀNG ĐỐI TÁC):</p>
                    <p><strong>{storeName}</strong> (Mã đối tác: {storeId})</p>
                    <p>Đại diện: {data.legalRepresentative || 'Chủ sở hữu cửa hàng'}</p>
                    <p>Mã số định danh / MST: {data.businessTaxCode || data.cccdNumber || '0109827364'}</p>
                  </div>

                  <div className="pt-2 space-y-2 border-t border-gray-200">
                    <p className="font-bold text-gray-900">ĐIỀU 1: PHẠM VI DỊCH VỤ</p>
                    <p>
                      Bên A nhận vận chuyển hàng hóa, bưu phẩm cho Bên B trên toàn quốc, đồng thời cung cấp dịch vụ thu tiền hộ (COD) và thực hiện đối soát tự động theo chu kỳ thỏa thuận.
                    </p>
                    <p className="font-bold text-gray-900">ĐIỀU 2: CƯỚC PHÍ VÀ THANH TOÁN</p>
                    <p>
                      Cước phí vận chuyển được áp dụng theo bảng biểu phí đã cài đặt trong hệ thống portal Dolax. Tiền thu hộ COD được chuyển khoản trực tiếp về tài khoản ngân hàng thụ hưởng của Bên B.
                    </p>
                  </div>

                  {/* Ký tên đóng dấu */}
                  <div className="pt-10 grid grid-cols-2 gap-8 text-center">
                    <div>
                      <p className="font-bold uppercase">ĐẠI DIỆN BÊN B</p>
                      <p className="italic text-[10px] text-gray-400 mt-1">(Ký, ghi rõ họ tên &amp; đóng dấu)</p>
                      <div className="h-20 flex items-center justify-center font-bold text-blue-700 italic font-sans text-sm">
                        {data.legalRepresentative || storeName}
                      </div>
                      <p className="font-bold">{data.legalRepresentative || 'NGUYỄN VĂN AN'}</p>
                    </div>

                    <div>
                      <p className="font-bold uppercase">ĐẠI DIỆN BÊN A</p>
                      <p className="italic text-[10px] text-gray-400 mt-1">(Đã ký số điện tử &amp; đóng dấu đỏ)</p>
                      <div className="h-20 flex items-center justify-center">
                        <div className="w-24 h-16 border-2 border-dashed border-red-500 rounded-lg flex flex-col items-center justify-center text-red-600 rotate-[-4deg]">
                          <span className="text-[9px] font-bold">DOLAX VIETNAM</span>
                          <span className="text-[8px]">DIGITALLY SIGNED</span>
                          <span className="text-[7px]">15/09/2026</span>
                        </div>
                      </div>
                      <p className="font-bold">DOLAX TECHNOLOGY CORP</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
