import React, { useState } from 'react';
import {
  X,
  Store as StoreIcon,
  MapPin,
  DollarSign,
  Truck,
  Check,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Edit2,
  HelpCircle,
  Calculator,
  Settings,
  Landmark,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FeeBracket, PickupPoint, ConnectedCarrier, CarrierShippingConfig, StoreContractInfo } from '../types';
import { calculateShippingFeeByWeight } from '../utils/feeCalculator';
import { ContractManagementSection } from '../components/ContractManagementSection';

interface BankOption {
  code: string;
  shortName: string;
  fullName: string;
}

const VIETNAM_BANKS: BankOption[] = [
  { code: 'VCB', shortName: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)' },
  { code: 'TCB', shortName: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)' },
  { code: 'MB', shortName: 'MB Bank', fullName: 'Ngân hàng TMCP Quân đội (MB Bank)' },
  { code: 'ACB', shortName: 'ACB', fullName: 'Ngân hàng TMCP Á Châu (ACB)' },
  { code: 'VPB', shortName: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)' },
  { code: 'BIDV', shortName: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)' },
  { code: 'CTG', shortName: 'VietinBank', fullName: 'Ngân hàng TMCP Công thương Việt Nam (VietinBank)' },
  { code: 'TPB', shortName: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong (TPBank)' },
  { code: 'STB', shortName: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)' },
  { code: 'HDB', shortName: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển TP.HCM (HDBank)' },
  { code: 'VIB', shortName: 'VIB', fullName: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)' },
  { code: 'SHB', shortName: 'SHB', fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)' },
  { code: 'VBA', shortName: 'Agribank', fullName: 'Ngân hàng Nông nghiệp & Phát triển Nông thôn Việt Nam (Agribank)' },
  { code: 'MSB', shortName: 'MSB', fullName: 'Ngân hàng TMCP Hàng Hải Việt Nam (MSB)' },
  { code: 'LPB', shortName: 'LPBank', fullName: 'Ngân hàng TMCP Lộc Phát Việt Nam (LPBank)' },
  { code: 'OCB', shortName: 'OCB', fullName: 'Ngân hàng TMCP Phương Đông (OCB)' },
  { code: 'SSB', shortName: 'SeABank', fullName: 'Ngân hàng TMCP Đông Nam Á (SeABank)' },
];

export const StoreDetailView: React.FC = () => {
  const {
    stores,
    selectedStoreIdForDetail,
    setCurrentPage,
    updateStore,
  } = useApp();

  const store =
    stores.find((s) => s.id === selectedStoreIdForDetail) || stores[0];


  // 6 Tabs tương ứng đúng theo thiết kế
  const [activeTab, setActiveTab] = useState<'info' | 'pickup' | 'pricing' | 'carriers' | 'bank' | 'contract'>('info');

  // Form State cho Tab 1: Thông tin chung
  const [storeName, setStoreName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [category, setCategory] = useState<string>('Đồ thể thao & Activewear');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Form State cho Tab 5: Quản lý tài khoản ngân hàng (Khớp 100% 4 mục theo ảnh 2)
  const [bankName, setBankName] = useState<string>('');
  const [bankCode, setBankCode] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');

  // Form State cho Tab 6: Quản lý hợp đồng (CCCD 2 mặt, GPKD, HĐ PDF)
  const [contractInfo, setContractInfo] = useState<StoreContractInfo | undefined>(undefined);

  const handleBankNameChange = (val: string) => {
    setBankName(val);
    const matched = VIETNAM_BANKS.find(
      (b) =>
        b.shortName.toLowerCase() === val.toLowerCase() ||
        b.fullName.toLowerCase() === val.toLowerCase() ||
        b.code.toLowerCase() === val.toLowerCase()
    );
    if (matched) {
      setBankCode(matched.code);
    }
  };

  // Form State cho Tab 2: Quản lý địa chỉ kho
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [editingPickupPoint, setEditingPickupPoint] = useState<PickupPoint | null>(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState<boolean>(false);
  const [pickupForm, setPickupForm] = useState<{
    id?: string;
    name: string;
    phone: string;
    address: string;
    status: 'active' | 'inactive';
  }>({
    name: '',
    phone: '',
    address: '',
    status: 'active',
  });

  // Form State cho Tab 3: Cài giá cước đơn hàng (Khớp 100% giao diện ảnh Screenshot)
  const [defaultFee, setDefaultFee] = useState<number>(200000);
  const [enableWeightFee, setEnableWeightFee] = useState<boolean>(true);
  const [enableVolumeFee, setEnableVolumeFee] = useState<boolean>(true);
  const [enableInsuranceFee, setEnableInsuranceFee] = useState<boolean>(true);
  const [insuranceRate, setInsuranceRate] = useState<number>(0.108);
  const [volumeRatio, setVolumeRatio] = useState<number>(6000);
  const [feeBrackets, setFeeBrackets] = useState<FeeBracket[]>([]);

  // Simulator kiểm tra tính giá cước theo cân nặng trực tiếp
  const [testWeight, setTestWeight] = useState<number>(3.5);

  // Modal khôi phục mật khẩu
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState<boolean>(false);
  const [newGeneratedPassword, setNewGeneratedPassword] = useState<string>('');
  const [copiedPwd, setCopiedPwd] = useState<boolean>(false);

  // Thông báo lưu thành công
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Form State cho Tab 4: Kết nối đơn vị vận chuyển
  const [carriers, setCarriers] = useState<ConnectedCarrier[]>([]);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [selectedCarrierForApi, setSelectedCarrierForApi] = useState<ConnectedCarrier | null>(null);
  const [apiForm, setApiForm] = useState<{
    customerCode: string;
    apiKey: string;
    clientSecret: string;
    accountName: string;
  }>({
    customerCode: '',
    apiKey: '',
    clientSecret: '',
    accountName: '',
  });

  // Modal Cấu hình gửi đơn (Khớp 100% ảnh screenshot người dùng cung cấp)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [selectedCarrierForConfig, setSelectedCarrierForConfig] = useState<ConnectedCarrier | null>(null);
  const [shippingConfigForm, setShippingConfigForm] = useState<CarrierShippingConfig>({
    allowPartialDelivery: true, // Cho phép ký nhận 1 phần
    payerType: 'sender_monthly', // Người gửi cuối tháng trả phí
    pickupRequest: 'home', // Đến lấy hàng tại nhà
  });

  // Đồng bộ dữ liệu khi store thay đổi (render-time pattern theo react.dev/learn/you-might-not-need-an-effect)
  const [prevStoreId, setPrevStoreId] = useState<string | null>(null);
  if (store && store.id !== prevStoreId) {
    setPrevStoreId(store.id);
    setStoreName(store.name || '');
    setContactName(store.contactName || '');
    setPhone(store.phone || '');
    setAddress(store.address || '');
    setStatus(store.status || 'active');
    setPickupPoints(store.pickupPoints || []);

    const defaultCarriers: ConnectedCarrier[] = [
      {
        id: 'c1',
        name: 'J&T Express',
        code: 'JNT',
        status: 'connected',
        accountName: 'SHINE_JNT_VN',
        customerCode: 'JNT_CUST_8831',
        apiKey: 'jnt_live_key_99381248102',
        config: {
          allowPartialDelivery: true,
          payerType: 'sender_monthly',
          pickupRequest: 'home',
        },
      },
      {
        id: 'c2',
        name: 'Viettel Post',
        code: 'VTP',
        status: 'connected',
        accountName: 'VTP_SHINE_ACT',
        customerCode: 'VTP_VIP_4492',
        apiKey: 'vtp_prod_token_38120489',
        config: {
          allowPartialDelivery: true,
          payerType: 'sender_monthly',
          pickupRequest: 'home',
        },
      },
      {
        id: 'c3',
        name: 'Giao Hàng Nhanh (GHN)',
        code: 'GHN',
        status: 'disconnected',
        accountName: '',
        customerCode: '',
        apiKey: '',
        config: {
          allowPartialDelivery: false,
          payerType: 'sender',
          pickupRequest: 'home',
        },
      },
    ];

    setCarriers(
      store.carriers && store.carriers.length > 0 ? store.carriers : defaultCarriers
    );

    setDefaultFee(store.defaultFee ?? 200000);
    setEnableWeightFee(store.enableWeightFee ?? true);
    setEnableVolumeFee(store.enableVolumeFee ?? true);
    setEnableInsuranceFee(store.enableInsuranceFee ?? true);
    setInsuranceRate(store.insuranceRate ?? 0.108);
    setVolumeRatio(store.volumeRatio ?? 6000);
    setFeeBrackets(
      store.feeBrackets && store.feeBrackets.length > 0
        ? store.feeBrackets
        : [
            { id: 'fb1', minWeight: 0.01, maxWeight: 1, fee: 17000, stepWeight: 0, stepFee: 0 },
            { id: 'fb2', minWeight: 1.01, maxWeight: 2, fee: 19000, stepWeight: 1, stepFee: 5000 },
          ]
    );

    setBankName(store.bankName || '');
    setBankCode(store.bankCode || '');
    setAccountHolder(store.accountHolder || '');
    setAccountNumber(store.accountNumber || '');
    setContractInfo(store.contractInfo);
  }

  if (!store) {
    return (
      <div className="p-8 text-center text-gray-500">
        Không tìm thấy thông tin cửa hàng.{' '}
        <button
          onClick={() => setCurrentPage('stores')}
          className="text-[#ef4444] font-medium underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // =========================================================================
  // XỬ LÝ QUẢN LÝ KHO (THÊM / SỬA / XÓA)
  // =========================================================================
  const handleOpenAddPickupModal = () => {
    setEditingPickupPoint(null);
    setPickupForm({
      name: '',
      phone: '',
      address: '',
      status: 'active',
    });
    setIsPickupModalOpen(true);
  };

  const handleOpenEditPickupModal = (pp: PickupPoint) => {
    setEditingPickupPoint(pp);
    setPickupForm({
      id: pp.id,
      name: pp.name,
      phone: pp.phone,
      address: pp.address,
      status: pp.status,
    });
    setIsPickupModalOpen(true);
  };

  const handleSavePickupPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupForm.name.trim() || !pickupForm.phone.trim() || !pickupForm.address.trim()) {
      alert('Vui lòng điền đầy đủ tên kho, số điện thoại hotline và địa chỉ kho.');
      return;
    }

    let updatedList: PickupPoint[];
    if (editingPickupPoint) {
      // Sửa kho hiện tại
      updatedList = pickupPoints.map((pp) =>
        pp.id === editingPickupPoint.id
          ? {
              ...pp,
              name: pickupForm.name.trim(),
              phone: pickupForm.phone.trim(),
              address: pickupForm.address.trim(),
              status: pickupForm.status,
            }
          : pp
      );
    } else {
      // Thêm kho mới
      const newPickup: PickupPoint = {
        id: `pp_${Date.now()}`,
        name: pickupForm.name.trim(),
        phone: pickupForm.phone.trim(),
        address: pickupForm.address.trim(),
        status: pickupForm.status,
      };
      updatedList = [...pickupPoints, newPickup];
    }

    setPickupPoints(updatedList);
    updateStore(store.id, { pickupPoints: updatedList });
    setIsPickupModalOpen(false);
    setSavedSuccessMsg(editingPickupPoint ? 'Đã cập nhật kho hàng thành công!' : 'Đã thêm kho hàng mới thành công!');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const handleDeletePickupPoint = (ppId: string) => {
    if (pickupPoints.length <= 1) {
      alert('Cửa hàng cần duy trì tối thiểu 1 kho/điểm lấy hàng để vận chuyển.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa kho lấy hàng này không?')) {
      const updatedList = pickupPoints.filter((pp) => pp.id !== ppId);
      setPickupPoints(updatedList);
      updateStore(store.id, { pickupPoints: updatedList });
      setSavedSuccessMsg('Đã xóa kho lấy hàng thành công!');
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    }
  };

  // =========================================================================
  // XỬ LÝ CÀI ĐẶT BẢNG GIÁ CƯỚC (THÊM / SỬA / XÓA DÒNG BẬC CÂN NẶNG)
  // =========================================================================
  const handleAddFeeBracket = () => {
    const lastBracket = feeBrackets[feeBrackets.length - 1];
    const newMin = lastBracket ? Number((lastBracket.maxWeight + 0.01).toFixed(2)) : 0.01;
    const newMax = Number((newMin + 1).toFixed(2));
    const newFee = lastBracket ? lastBracket.fee + 3000 : 20000;

    const newBracket: FeeBracket = {
      id: `fb_${Date.now()}`,
      minWeight: newMin,
      maxWeight: newMax,
      fee: newFee,
      stepWeight: 1,
      stepFee: 5000,
    };

    setFeeBrackets([...feeBrackets, newBracket]);
  };

  const handleUpdateBracketField = (id: string, field: keyof FeeBracket, value: number) => {
    setFeeBrackets((prev) =>
      prev.map((fb) => (fb.id === id ? { ...fb, [field]: value } : fb))
    );
  };

  const handleDeleteBracket = (id: string) => {
    if (feeBrackets.length <= 1) {
      alert('Cần tối thiểu 1 khoảng trọng lượng.');
      return;
    }
    setFeeBrackets((prev) => prev.filter((fb) => fb.id !== id));
  };

  // Kết quả thử nghiệm tính cước hiện tại
  const testCalculation = calculateShippingFeeByWeight(testWeight, feeBrackets, defaultFee);

  // Sinh mật khẩu ngẫu nhiên
  const handleGenerateResetPassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '@#$%&*!?';
    let pwd = '';
    pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
    pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += specials[Math.floor(Math.random() * specials.length)];
    const all = uppercase + lowercase + numbers + specials;
    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    const finalPwd = pwd
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');

    setNewGeneratedPassword(finalPwd);
    setIsResetPwdModalOpen(true);
    setCopiedPwd(false);
  };

  const handleCopyNewPassword = () => {
    const textToCopy = `THÔNG TIN MẬT KHẨU MỚI CỦA CỬA HÀNG ${store.name}
------------------------------------
Mã cửa hàng: ${store.id}
Tên đăng nhập: ${store.username}
Mật khẩu mới: ${newGeneratedPassword}
Hotline: ${phone}
------------------------------------
Thời gian khôi phục: ${new Date().toLocaleString('vi-VN')}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedPwd(true);
      setTimeout(() => setCopiedPwd(false), 3000);
    });
  };

  // =========================================================================
  // XỬ LÝ KẾT NỐI ĐƠN VỊ VẬN CHUYỂN BẰNG API & CẤU HÌNH GỬI ĐƠN
  // =========================================================================
  // Bật / Tắt kết nối hãng vận chuyển
  const handleToggleCarrierStatus = (carrierId: string) => {
    const updated = carriers.map((c) => {
      if (c.id === carrierId) {
        const nextStatus = c.status === 'connected' ? 'disconnected' : 'connected';
        return { ...c, status: nextStatus as 'connected' | 'disconnected' };
      }
      return c;
    });
    setCarriers(updated);
    updateStore(store.id, { carriers: updated });
    setSavedSuccessMsg('Đã cập nhật trạng thái kết nối hãng vận chuyển!');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  // Mở modal cấu hình API cho hãng
  const handleOpenApiModal = (carrier: ConnectedCarrier) => {
    setSelectedCarrierForApi(carrier);
    setApiForm({
      customerCode: carrier.customerCode || '',
      apiKey: carrier.apiKey || '',
      clientSecret: carrier.clientSecret || '',
      accountName: carrier.accountName || '',
    });
    setIsApiModalOpen(true);
  };

  const handleSaveApiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarrierForApi) return;

    const updated = carriers.map((c) =>
      c.id === selectedCarrierForApi.id
        ? {
            ...c,
            status: 'connected' as const,
            customerCode: apiForm.customerCode.trim(),
            apiKey: apiForm.apiKey.trim(),
            clientSecret: apiForm.clientSecret.trim(),
            accountName: apiForm.accountName.trim() || c.name,
          }
        : c
    );

    setCarriers(updated);
    updateStore(store.id, { carriers: updated });
    setIsApiModalOpen(false);
    setSavedSuccessMsg(`Đã kết nối thành công tài khoản API của ${selectedCarrierForApi.name}!`);
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  // Mở modal Cấu hình gửi đơn (Khớp 100% ảnh screenshot người dùng cung cấp)
  const handleOpenConfigModal = (carrier: ConnectedCarrier) => {
    setSelectedCarrierForConfig(carrier);
    if (carrier.config) {
      setShippingConfigForm({ ...carrier.config });
    } else {
      setShippingConfigForm({
        allowPartialDelivery: true,
        payerType: 'sender_monthly',
        pickupRequest: 'home',
      });
    }
    setIsConfigModalOpen(true);
  };

  const handleSaveShippingConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarrierForConfig) return;

    const updated = carriers.map((c) =>
      c.id === selectedCarrierForConfig.id
        ? {
            ...c,
            config: { ...shippingConfigForm },
          }
        : c
    );

    setCarriers(updated);
    updateStore(store.id, { carriers: updated });
    setIsConfigModalOpen(false);
    setSavedSuccessMsg(`Đã cập nhật cấu hình gửi đơn của ${selectedCarrierForConfig.name}!`);
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  // Lưu toàn bộ cấu hình
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    updateStore(store.id, {
      name: storeName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status: status,
      pickupPoints: pickupPoints,
      defaultFee: defaultFee,
      enableWeightFee: enableWeightFee,
      enableVolumeFee: enableVolumeFee,
      enableInsuranceFee: enableInsuranceFee,
      insuranceRate: insuranceRate,
      volumeRatio: volumeRatio,
      feeBrackets: feeBrackets,
      carriers: carriers,
      bankName: bankName.trim(),
      bankCode: bankCode.trim().toUpperCase(),
      accountHolder: accountHolder.trim().toUpperCase(),
      accountNumber: accountNumber.trim(),
      contractInfo: contractInfo,
    });

    setSavedSuccessMsg('Đã lưu tất cả thay đổi thành công!');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      {/* Toast thông báo lưu thành công */}
      {savedSuccessMsg && (
        <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="font-semibold">{savedSuccessMsg}</span>
          </div>
          <button onClick={() => setSavedSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header: Biểu tượng bút chỉnh sửa + Tên + Mã cửa hàng + Nút đóng X */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-500 shrink-0 shadow-2xs">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center space-x-1.5">
                <span>Chỉnh sửa cửa hàng:</span>
                <span className="text-gray-900 uppercase font-black">{storeName || store.name}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mã: <span className="font-mono text-slate-600 font-bold">{store.id}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage('stores')}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* 4 Tabs Menu Horizontal */}
        <div className="flex border-b border-gray-200 px-2 sm:px-6 bg-gray-50/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center space-x-2 -mb-[1px] cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#ef4444] text-[#ef4444]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <StoreIcon size={14} />
            <span>1. Thông tin chung</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pickup')}
            className={`py-3.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center space-x-2 -mb-[1px] cursor-pointer ${
              activeTab === 'pickup'
                ? 'border-[#ef4444] text-[#ef4444]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <MapPin size={14} />
            <span>2. Quản lý địa chỉ kho</span>
            <span className="ml-1 bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pickupPoints.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-3.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center space-x-2 -mb-[1px] cursor-pointer ${
              activeTab === 'pricing'
                ? 'border-[#ef4444] text-[#ef4444]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <DollarSign size={14} />
            <span>3. Cài giá cước đơn hàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('carriers')}
            className={`py-3.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center space-x-2 -mb-[1px] cursor-pointer ${
              activeTab === 'carriers'
                ? 'border-[#ef4444] text-[#ef4444]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Truck size={14} />
            <span>4. Kết nối đơn vị vận chuyển</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`py-3.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center space-x-2 -mb-[1px] cursor-pointer ${
              activeTab === 'bank'
                ? 'border-[#ef4444] text-[#ef4444]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Landmark size={14} />
            <span>5. Quản lý tài khoản ngân hàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className={`py-3.5 px-4 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center space-x-2 -mb-[1px] cursor-pointer ${
              activeTab === 'contract'
                ? 'border-[#ef4444] text-[#ef4444]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText size={14} />
            <span>6. Quản lý hợp đồng</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveAll}>
          {/* TAB 1: THÔNG TIN CHUNG */}
          {activeTab === 'info' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Mã cửa hàng
                  </label>
                  <input
                    type="text"
                    value={store.id}
                    disabled
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-slate-50 text-gray-500 font-mono font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Trạng thái kích hoạt
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 bg-white focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] cursor-pointer"
                  >
                    <option value="active">Đang hoạt động (Nhận đơn)</option>
                    <option value="inactive">Ngừng hoạt động (Tạm khóa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Tên cửa hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ví dụ: SHINE ACTIVE"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Người đại diện liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ví dụ: SHINE ACTIVE"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Số điện thoại hotline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0327361188"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Địa chỉ trụ sở
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Số 12 Ngõ 86 Chùa Hà, Cầu Giấy, Hà Nội"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Ngành hàng
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ví dụ: Đồ thể thao & Activewear"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      Tài khoản cửa hàng:{' '}
                      <span className="font-mono text-blue-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {store.username}
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Email đăng ký: {store.email} • Bảo mật đăng nhập phân quyền
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateResetPassword}
                  className="px-3.5 py-2 text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 border border-amber-300/80 rounded-lg transition-colors flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                >
                  <KeyRound size={13} className="text-amber-800" />
                  <span>Khôi phục mật khẩu</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ ĐỊA CHỈ KHO (CÓ ĐỦ TÍNH NĂNG SỬA & THÊM KHO MỚI) */}
          {activeTab === 'pickup' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Danh sách kho / Điểm lấy hàng</h3>
                  <p className="text-xs text-gray-400">
                    Nơi đơn vị vận chuyển (J&T, Viettel Post...) đến nhận hàng. Bạn có thể sửa địa chỉ hoặc thêm kho mới.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddPickupModal}
                  className="px-3.5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Thêm kho mới</span>
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Tên kho hàng</th>
                      <th className="py-3 px-4">Hotline lấy hàng</th>
                      <th className="py-3 px-4">Địa chỉ kho</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pickupPoints.map((pp) => (
                      <tr key={pp.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">
                          <div className="flex items-center space-x-2">
                            <MapPin size={14} className="text-[#ef4444] shrink-0" />
                            <span>{pp.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-mono font-medium">{pp.phone}</td>
                        <td className="py-3 px-4 text-gray-700">{pp.address}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                              pp.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border-gray-300'
                            }`}
                          >
                            {pp.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPickupModal(pp)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 flex items-center space-x-1 cursor-pointer"
                              title="Sửa địa chỉ kho"
                            >
                              <Edit2 size={12} />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePickupPoint(pp.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa kho"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pickupPoints.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          Chưa có kho hàng nào được thiết lập. Hãy bấm nút "Thêm kho mới" ở trên.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CÀI GIÁ CƯỚC ĐƠN HÀNG (Khớp 100% Giao diện & Logic tính cước theo ảnh người dùng gửi) */}
          {activeTab === 'pricing' && (
            <div className="p-6 space-y-6">
              {/* Header Tab 3 */}
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  Phí dịch vụ giao hàng
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thiết lập phí dịch vụ giao hàng theo trọng lượng và tỉ lệ bảo hiểm hàng hóa
                </p>
              </div>

              {/* Phí dịch vụ giao hàng mặc định */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Phí dịch vụ giao hàng mặc định
                </label>
                <p className="text-[11px] text-amber-600 font-medium">
                  Lưu ý: Hệ thống sẽ áp dụng phí giao hàng mặc định nếu đơn hàng có trọng lượng không thuộc bảng dưới.
                </p>
                <div className="relative max-w-full">
                  <input
                    type="number"
                    value={defaultFee}
                    onChange={(e) => setDefaultFee(Number(e.target.value))}
                    className="w-full text-xs font-bold text-gray-900 border border-blue-400 rounded-lg px-3 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-500 underline font-serif">
                    đ
                  </span>
                </div>
              </div>

              {/* Block 1: Kích hoạt phí dịch vụ giao hàng theo trọng lượng */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableWeightFee}
                      onChange={() => setEnableWeightFee(!enableWeightFee)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-xs font-bold text-gray-800 flex items-center space-x-1">
                    <span>Kích hoạt phí dịch vụ giao hàng theo trọng lượng</span>
                    <HelpCircle size={13} className="text-gray-400" />
                  </span>
                </div>

                <p className="text-[11px] text-gray-500">
                  Khoảng trọng lượng hợp lệ nằm trong khoảng từ 0.01kg đến 960kg.
                </p>

                {/* Bảng cấu hình các khoảng trọng lượng theo ảnh */}
                {enableWeightFee && (
                  <div className="space-y-2">
                    {/* Header Columns matching Screenshot */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700 px-1">
                      <div className="col-span-2">Trọng lượng từ (kg ≥)</div>
                      <div className="col-span-2">Trọng lượng đến (kg ≤)</div>
                      <div className="col-span-3">Phí dịch vụ giao hàng</div>
                      <div className="col-span-2">Nấc trọng lượng vượt (kg)</div>
                      <div className="col-span-2">Đơn giá trọng lượng vượt</div>
                      <div className="col-span-1 text-center"></div>
                    </div>

                    {/* Danh sách các nấc cân nặng */}
                    {feeBrackets.map((fb, idx) => (
                      <div key={fb.id || idx} className="grid grid-cols-12 gap-2 items-center">
                        {/* Cột 1: Trọng lượng từ */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            value={fb.minWeight}
                            onChange={(e) =>
                              handleUpdateBracketField(fb.id, 'minWeight', Number(e.target.value))
                            }
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800 bg-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Cột 2: Trọng lượng đến */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            value={fb.maxWeight}
                            onChange={(e) =>
                              handleUpdateBracketField(fb.id, 'maxWeight', Number(e.target.value))
                            }
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800 bg-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Cột 3: Phí dịch vụ giao hàng */}
                        <div className="col-span-3 relative">
                          <input
                            type="number"
                            step="1000"
                            value={fb.fee}
                            onChange={(e) =>
                              handleUpdateBracketField(fb.id, 'fee', Number(e.target.value))
                            }
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 pr-6 text-gray-800 bg-white focus:outline-none focus:border-blue-500 font-semibold"
                          />
                          <span className="absolute right-2.5 top-2 text-xs text-gray-400 underline font-serif">
                            đ
                          </span>
                        </div>

                        {/* Cột 4: Nấc trọng lượng vượt (bước nhảy) */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Để trống = 0"
                            value={fb.stepWeight || ''}
                            onChange={(e) =>
                              handleUpdateBracketField(
                                fb.id,
                                'stepWeight',
                                e.target.value ? Number(e.target.value) : 0
                              )
                            }
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 text-gray-800 bg-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {/* Cột 5: Đơn giá trọng lượng vượt */}
                        <div className="col-span-2 relative">
                          <input
                            type="number"
                            step="1000"
                            placeholder="0"
                            value={fb.stepFee || 0}
                            onChange={(e) =>
                              handleUpdateBracketField(
                                fb.id,
                                'stepFee',
                                e.target.value ? Number(e.target.value) : 0
                              )
                            }
                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 pr-6 text-gray-800 bg-white focus:outline-none focus:border-blue-500"
                          />
                          <span className="absolute right-2.5 top-2 text-xs text-gray-400 underline font-serif">
                            đ
                          </span>
                        </div>

                        {/* Cột 6: Nút xóa */}
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteBracket(fb.id)}
                            className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Xóa khoảng trọng lượng này"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Nút "+ Thêm khoảng trọng lượng" màu xanh dương */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleAddFeeBracket}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1.5 py-1.5 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Thêm khoảng trọng lượng</span>
                      </button>
                    </div>

                    {/* BẢNG SIMULATOR KIỂM THỬ TRỰC TIẾP THUẬT TOÁN TÍNH CƯỚC THEO BƯỚC NHẢY */}
                    <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                          <Calculator size={15} className="text-blue-700" />
                          <span>Mô phỏng tính cước theo công thức bước nhảy:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-blue-800">Trọng lượng đơn hàng test:</span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              step="0.1"
                              value={testWeight}
                              onChange={(e) => setTestWeight(Number(e.target.value))}
                              className="w-16 px-2 py-1 text-xs font-bold text-center border border-blue-300 rounded bg-white text-blue-950 focus:outline-none"
                            />
                            <span className="text-xs font-bold text-blue-800">kg</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
                        <span className="text-gray-700">{testCalculation.calculationDetails}</span>
                        <span className="font-black text-rose-600 text-sm">
                          Thành tiền: {testCalculation.fee.toLocaleString()} đ
                        </span>
                      </div>

                      <div className="text-[11px] text-blue-700/90 leading-relaxed">
                        💡 <strong>Nguyên tắc:</strong> Đơn <strong>3.0kg</strong> tính mốc 2kg (19k) + 1 bước 1kg (5k) = <strong>24.000đ</strong>. Đơn <strong>3.5kg</strong> làm tròn mốc 2kg + 2 bước 1kg = <strong>29.000đ</strong>. Đơn <strong>4.0kg</strong> mốc 2kg + 2 bước 1kg = <strong>29.000đ</strong>.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Block 2: Kích hoạt Trọng lượng quy đổi */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableVolumeFee}
                      onChange={() => setEnableVolumeFee(!enableVolumeFee)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-xs font-bold text-gray-800 flex items-center space-x-1">
                    <span>Kích hoạt Trọng lượng quy đổi</span>
                    <HelpCircle size={13} className="text-gray-400" />
                  </span>
                </div>

                <p className="text-[11px] text-gray-500">
                  Cấu hình trọng lượng quy đổi: (Dài × Rộng × Cao) / Hệ số quy đổi
                </p>

                {enableVolumeFee && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Hệ số quy đổi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={volumeRatio}
                      onChange={(e) => setVolumeRatio(Number(e.target.value))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 bg-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Block 3: Kích hoạt tỉ lệ bảo hiểm hàng hóa */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableInsuranceFee}
                      onChange={() => setEnableInsuranceFee(!enableInsuranceFee)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-xs font-bold text-gray-800 flex items-center space-x-1">
                    <span>Kích hoạt tỉ lệ bảo hiểm hàng hóa</span>
                    <HelpCircle size={13} className="text-gray-400" />
                  </span>
                </div>

                {enableInsuranceFee && (
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      step="0.001"
                      value={insuranceRate}
                      onChange={(e) => setInsuranceRate(Number(e.target.value))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-gray-800 bg-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-bold">
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: KẾT NỐI ĐƠN VỊ VẬN CHUYỂN */}
          {activeTab === 'carriers' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Các hãng vận chuyển đối tác</h3>
                  <p className="text-xs text-gray-400">
                    Bật/tắt kết nối, xác thực API để tạo vận đơn và cài đặt cấu hình gửi đơn theo hãng
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {carriers.map((c) => {
                  const isConn = c.status === 'connected';
                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border transition-all shadow-2xs ${
                        isConn
                          ? 'border-gray-200 bg-white'
                          : 'border-gray-200 bg-slate-50/70 opacity-80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3.5">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                              c.code === 'JNT'
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : c.code === 'VTP'
                                ? 'bg-orange-50 text-orange-600 border-orange-200'
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}
                          >
                            {c.code}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-gray-900">{c.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isConn
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-100 text-gray-500 border-gray-300'
                                }`}
                              >
                                {isConn ? 'Đã kết nối' : 'Chưa kết nối'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {c.accountName ? (
                                <span>
                                  Tài khoản: <strong className="text-gray-700">{c.accountName}</strong>
                                  {c.customerCode && <span> • Mã KH: {c.customerCode}</span>}
                                </span>
                              ) : (
                                'Chưa cấu hình tài khoản API'
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Các nút hành động: Bật/Tắt toggle + Cấu hình API + Cấu hình gửi đơn */}
                        <div className="flex items-center space-x-2.5 self-end sm:self-center">
                          {/* Nút Cài đặt cấu hình gửi đơn (Khớp ảnh screenshot người dùng) */}
                          <button
                            type="button"
                            onClick={() => handleOpenConfigModal(c)}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                          >
                            <Settings size={13} className="text-gray-600" />
                            <span>Cấu hình gửi đơn</span>
                          </button>

                          {/* Nút Kết nối / Sửa API */}
                          <button
                            type="button"
                            onClick={() => handleOpenApiModal(c)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 rounded-lg transition-colors border border-blue-200 flex items-center space-x-1 cursor-pointer"
                          >
                            <KeyRound size={13} />
                            <span>{c.apiKey ? 'Cài đặt API' : 'Kết nối API'}</span>
                          </button>

                          {/* Công tắc Bật / Tắt kết nối */}
                          <div className="flex items-center space-x-1.5 pl-2 border-l border-gray-200">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isConn}
                                onChange={() => handleToggleCarrierStatus(c.id)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Tóm tắt cấu hình gửi đơn hiện tại */}
                      {c.config && isConn && (
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap gap-2 text-[11px] text-gray-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                            {c.config.allowPartialDelivery ? '✓ Cho phép ký nhận 1 phần' : '✕ Không ký nhận 1 phần'}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                            Người trả phí:{' '}
                            <strong>
                              {c.config.payerType === 'sender_monthly'
                                ? 'Người gửi cuối tháng trả phí'
                                : c.config.payerType === 'sender'
                                ? 'Người gửi'
                                : 'Người nhận'}
                            </strong>
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                            Lấy hàng:{' '}
                            <strong>
                              {c.config.pickupRequest === 'home' ? 'Đến lấy hàng tại nhà' : 'Gửi tại bưu cục'}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: QUẢN LÝ TÀI KHOẢN NGÂN HÀNG (Khớp 100% 4 mục theo ảnh 2 của người dùng) */}
          {activeTab === 'bank' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center space-x-2">
                    <Landmark size={16} className="text-[#ef4444]" />
                    <span>Quản lý tài khoản ngân hàng</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Thông tin tài khoản thụ hưởng để nhận tiền thu hộ COD và đối soát dòng tiền của cửa hàng.
                  </p>
                </div>

                {bankName && accountNumber && (
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Đã cấu hình tài khoản</span>
                  </span>
                )}
              </div>

              {/* Form 4 mục khớp chính xác 100% theo ảnh 2 người dùng cung cấp */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* 1. Ngân hàng */}
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-2">
                    <span className="text-red-500 font-bold mr-1">*</span>
                    Ngân hàng
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="vietnam-banks-list"
                      value={bankName}
                      onChange={(e) => handleBankNameChange(e.target.value)}
                      placeholder="Nhập tên ngân hàng"
                      required
                      className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] transition-all bg-white"
                    />
                    <datalist id="vietnam-banks-list">
                      {VIETNAM_BANKS.map((b) => (
                        <option key={b.code} value={b.fullName}>
                          {b.code} - {b.shortName}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  {/* Danh sách chọn nhanh ngân hàng phổ biến */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-gray-400 font-medium mr-0.5">Gợi ý nhanh:</span>
                    {VIETNAM_BANKS.slice(0, 5).map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => {
                          setBankName(b.fullName);
                          setBankCode(b.code);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          bankCode === b.code
                            ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {b.shortName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Mã ngân hàng */}
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-2">
                    <span className="text-red-500 font-bold mr-1">*</span>
                    Mã ngân hàng
                  </label>
                  <input
                    type="text"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã ngân hàng hoặc chọn ngân hàng để tự điền"
                    required
                    className="w-full text-xs border border-orange-400 focus:border-[#ef4444] rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ef4444] transition-all bg-white font-mono uppercase"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Ví dụ: VCB, TCB, MB, ACB, VPB, BIDV, CTG... (Tự điền khi chọn ngân hàng)
                  </p>
                </div>

                {/* 3. Tên chủ tài khoản */}
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-2">
                    <span className="text-red-500 font-bold mr-1">*</span>
                    Tên chủ tài khoản
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    placeholder="Nhập đầy đủ họ tên không dấu"
                    required
                    className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] transition-all bg-white uppercase font-medium"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Viết hoa không dấu, trùng khớp trên thẻ hoặc ứng dụng ngân hàng
                  </p>
                </div>

                {/* 4. Số tài khoản */}
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-2">
                    <span className="text-red-500 font-bold mr-1">*</span>
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                    placeholder="Nhập số tài khoản"
                    required
                    className="w-full text-xs border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] transition-all bg-white font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Số tài khoản ngân hàng dùng để nhận đối soát chuyển khoản
                  </p>
                </div>
              </div>

              {/* Thẻ mô phỏng trực quan thẻ ngân hàng của cửa hàng */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <span className="block text-xs font-semibold text-gray-700 mb-3">
                  Xem trước thông tin thẻ thụ hưởng:
                </span>
                <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-white rounded-2xl shadow-md max-w-md space-y-4 border border-slate-700/50">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold tracking-wider uppercase flex items-center space-x-1.5 text-amber-400">
                      <CreditCard size={15} />
                      <span>Tài khoản đối soát COD</span>
                    </span>
                    <span className="bg-slate-700/90 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300">
                      {bankCode || 'BANK CODE'}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 tracking-wide">SỐ TÀI KHOẢN</div>
                    <div className="text-lg font-mono font-bold tracking-widest text-white mt-0.5">
                      {accountNumber || '•••• •••• ••••'}
                    </div>
                  </div>
                  <div className="flex items-end justify-between pt-2 border-t border-slate-700/60 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">CHỦ TÀI KHOẢN</div>
                      <div className="font-bold tracking-wide uppercase text-slate-100">
                        {accountHolder || 'CHƯA CẬP NHẬT'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">NGÂN HÀNG</div>
                      <div className="font-medium text-[11px] max-w-[180px] truncate text-slate-200">
                        {bankName || 'Chưa chọn ngân hàng'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: QUẢN LÝ HỢP ĐỒNG (CCCD 2 MẶT / GPKD / HĐ DỊCH VỤ PDF) */}
          {activeTab === 'contract' && (
            <ContractManagementSection
              contractInfo={contractInfo}
              onChange={setContractInfo}
              storeName={storeName || store.name}
              storeId={store.id}
            />
          )}

          {/* Footer Actions: Hủy & Cập nhật / Lưu tất cả thay đổi (Khớp giao diện ảnh) */}
          <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setCurrentPage('stores')}
              className="px-5 py-2.5 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer border border-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-98"
            >
              <Check size={14} className="text-white" />
              <span>Cập nhật</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL THÊM / SỬA ĐỊA CHỈ KHO HÀNG */}
      {isPickupModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingPickupPoint ? 'Chỉnh sửa kho hàng' : 'Thêm kho hàng mới'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cửa hàng: <strong>{store.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPickupModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePickupPoint} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tên kho lấy hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kho chính Cầu Giấy hoặc Kho Thanh Liệt"
                  value={pickupForm.name}
                  onChange={(e) => setPickupForm({ ...pickupForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-[#ef4444]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Hotline người phụ trách kho <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ví dụ: 0327361188"
                  value={pickupForm.phone}
                  onChange={(e) => setPickupForm({ ...pickupForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:border-[#ef4444]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Địa chỉ chi tiết kho (để shipper đến nhận hàng) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Số nhà, ngõ ngách, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                  value={pickupForm.address}
                  onChange={(e) => setPickupForm({ ...pickupForm, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#ef4444]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Trạng thái kho</label>
                <select
                  value={pickupForm.status}
                  onChange={(e) =>
                    setPickupForm({ ...pickupForm, status: e.target.value as 'active' | 'inactive' })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-[#ef4444] bg-white cursor-pointer"
                >
                  <option value="active">Đang hoạt động (Shipper có thể đến lấy)</option>
                  <option value="inactive">Tạm ngưng nhận hàng</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPickupModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-gray-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingPickupPoint ? 'Lưu thay đổi' : 'Thêm kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL KHÔI PHỤC MẬT KHẨU MỚI TỰ ĐỘNG */}
      {isResetPwdModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Khôi phục mật khẩu thành công!
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Cửa hàng: <strong className="text-gray-800">{store.name}</strong> ({store.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPwdModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/90 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tên đăng nhập:</span>
                <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                  {store.username}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-600">Mật khẩu mới:</span>
                  <span className="inline-flex items-center space-x-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                    <ShieldCheck size={10} />
                    <span>Mạnh</span>
                  </span>
                </div>
                <span className="font-mono font-black text-emerald-700 text-sm bg-white px-2.5 py-1 rounded border border-emerald-300 tracking-wide select-all">
                  {newGeneratedPassword}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-amber-200/60 text-gray-500">
                <span>Hotline nhận SMS:</span>
                <span className="font-semibold text-gray-800">{phone}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCopyNewPassword}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer ${
                  copiedPwd
                    ? 'bg-emerald-600 text-white'
                    : 'bg-black hover:bg-gray-800 text-white'
                }`}
              >
                {copiedPwd ? (
                  <>
                    <Check size={15} />
                    <span>Đã sao chép mật khẩu mới!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>Sao chép mật khẩu mới</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsResetPwdModalOpen(false)}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: KẾT NỐI API HÃNG VẬN CHUYỂN */}
      {isApiModalOpen && selectedCarrierForApi && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Kết nối API {selectedCarrierForApi.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cửa hàng: <strong>{store.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveApiSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Tên tài khoản kết nối (Gợi nhớ)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: SHINE_JNT_VIP"
                  value={apiForm.accountName}
                  onChange={(e) => setApiForm({ ...apiForm, accountName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Mã khách hàng tại hãng (Customer Code / Shop ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: JNT_88321 hoặc VTP_VIP_449"
                  value={apiForm.customerCode}
                  onChange={(e) => setApiForm({ ...apiForm, customerCode: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  API Key / Token xác thực <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập API Token do đối tác vận chuyển cấp"
                  value={apiForm.apiKey}
                  onChange={(e) => setApiForm({ ...apiForm, apiKey: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Client Secret / Chữ ký bảo mật (Tùy chọn)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={apiForm.clientSecret}
                  onChange={(e) => setApiForm({ ...apiForm, clientSecret: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsApiModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Lưu & Kết nối API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CẤU HÌNH GỬI ĐƠN THEO HÃNG (KHỚP 100% ẢNH SCREENSHOT NGƯỜI DÙNG) */}
      {isConfigModalOpen && selectedCarrierForConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 space-y-6 shadow-2xl">
            {/* Header: Cấu hình gửi đơn [Tên Hãng] */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Cấu hình gửi đơn {selectedCarrierForConfig.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveShippingConfig} className="space-y-6 text-xs text-gray-800">
              {/* Mục 1: Cấu hình gửi đơn */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-gray-900 text-sm">Cấu hình gửi đơn</h4>
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={shippingConfigForm.allowPartialDelivery}
                      onChange={(e) =>
                        setShippingConfigForm({
                          ...shippingConfigForm,
                          allowPartialDelivery: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded flex items-center justify-center peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all">
                      {shippingConfigForm.allowPartialDelivery && (
                        <Check size={12} className="text-white stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <span className="text-gray-800 font-medium">Cho phép ký nhận 1 phần</span>
                </label>
              </div>

              {/* Mục 2: Người trả phí */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-gray-900 text-sm">Người trả phí</h4>
                <div className="space-y-2.5">
                  {/* Option 1: Người nhận */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <div className="w-4 h-4 rounded-full border flex items-center justify-center transition-all border-gray-300">
                      {shippingConfigForm.payerType === 'recipient' && (
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="payerType"
                      value="recipient"
                      checked={shippingConfigForm.payerType === 'recipient'}
                      onChange={() =>
                        setShippingConfigForm({ ...shippingConfigForm, payerType: 'recipient' })
                      }
                      className="sr-only"
                    />
                    <span className="text-gray-700">Người nhận</span>
                  </label>

                  {/* Option 2: Người gửi */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <div className="w-4 h-4 rounded-full border flex items-center justify-center transition-all border-gray-300">
                      {shippingConfigForm.payerType === 'sender' && (
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="payerType"
                      value="sender"
                      checked={shippingConfigForm.payerType === 'sender'}
                      onChange={() =>
                        setShippingConfigForm({ ...shippingConfigForm, payerType: 'sender' })
                      }
                      className="sr-only"
                    />
                    <span className="text-gray-700">Người gửi</span>
                  </label>

                  {/* Option 3: Người gửi cuối tháng trả phí */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        shippingConfigForm.payerType === 'sender_monthly'
                          ? 'border-emerald-600 ring-2 ring-emerald-100'
                          : 'border-gray-300'
                      }`}
                    >
                      {shippingConfigForm.payerType === 'sender_monthly' && (
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="payerType"
                      value="sender_monthly"
                      checked={shippingConfigForm.payerType === 'sender_monthly'}
                      onChange={() =>
                        setShippingConfigForm({ ...shippingConfigForm, payerType: 'sender_monthly' })
                      }
                      className="sr-only"
                    />
                    <span className="text-gray-900 font-medium">Người gửi cuối tháng trả phí</span>
                  </label>
                </div>
              </div>

              {/* Mục 3: Yêu cầu lấy hàng */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-gray-900 text-sm">Yêu cầu lấy hàng</h4>
                <div className="space-y-2.5">
                  {/* Option 1: Đến lấy hàng tại nhà */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        shippingConfigForm.pickupRequest === 'home'
                          ? 'border-emerald-600 ring-2 ring-emerald-100'
                          : 'border-gray-300'
                      }`}
                    >
                      {shippingConfigForm.pickupRequest === 'home' && (
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="pickupRequest"
                      value="home"
                      checked={shippingConfigForm.pickupRequest === 'home'}
                      onChange={() =>
                        setShippingConfigForm({ ...shippingConfigForm, pickupRequest: 'home' })
                      }
                      className="sr-only"
                    />
                    <span className="text-gray-900 font-medium">Đến lấy hàng tại nhà</span>
                  </label>

                  {/* Option 2: Gửi tại bưu cục */}
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <div className="w-4 h-4 rounded-full border flex items-center justify-center transition-all border-gray-300">
                      {shippingConfigForm.pickupRequest === 'post_office' && (
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <input
                      type="radio"
                      name="pickupRequest"
                      value="post_office"
                      checked={shippingConfigForm.pickupRequest === 'post_office'}
                      onChange={() =>
                        setShippingConfigForm({ ...shippingConfigForm, pickupRequest: 'post_office' })
                      }
                      className="sr-only"
                    />
                    <span className="text-gray-700">Gửi tại bưu cục</span>
                  </label>
                </div>
              </div>

              {/* Footer buttons: Hủy & Cập nhật (Khớp 100% ảnh screenshot) */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0f172a] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
