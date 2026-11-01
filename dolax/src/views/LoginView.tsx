import React, { useState, useEffect, useMemo } from 'react';
import {
  Phone,
  Eye,
  EyeOff,
  Truck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  X,
  Store as StoreIcon,
  User,
  Mail,
  Lock,
  MapPin,
  Loader2,
  Check,
  Copy,
  ChevronLeft,
  Headphones,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
import { ViettelPostLocationModal } from '../components/ViettelPostLocationModal';
import {
  SearchableLocationSelect,
  LocationOption,
} from '../components/SearchableLocationSelect';

export const LoginView: React.FC = () => {
  const { login, completeFirstTimeSetup, addStore, addUser, setCurrentPage, setSelectedStoreIdForDetail } = useApp();

  // Chế độ hiển thị:
  // - 'login': Màn hình đăng nhập ban đầu
  // - 'register': Màn hình đăng ký tài khoản mới
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // --- TRẠNG THÁI ĐĂNG NHẬP ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Tài khoản chưa có mật khẩu -> đặt mật khẩu lần đầu
  const [setupUser, setSetupUser] = useState<{ id: string; name: string } | null>(null);
  const [setupPass, setSetupPass] = useState('');
  const [setupPass2, setSetupPass2] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // --- TRẠNG THÁI ĐĂNG KÝ TÀI KHOẢN (Đồng bộ với màn Thêm cửa hàng) ---
  const [regStoreName, setRegStoreName] = useState('');
  const [regContactName, setRegContactName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [detailAddress, setDetailAddress] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Chuẩn địa danh ViettelPost: 'v3' (mới - 2 cấp) hoặc 'v2' (cũ - 3 cấp)
  const [locationStandard, setLocationStandard] = useState<'v3' | 'v2'>('v3');
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Dữ liệu V3 (Mới)
  const [v3Provinces, setV3Provinces] = useState<ViettelProvince[]>([]);
  const [v3Wards, setV3Wards] = useState<ViettelWardV3[]>([]);
  const [selectedV3ProvinceId, setSelectedV3ProvinceId] = useState<number | ''>('');
  const [selectedV3WardId, setSelectedV3WardId] = useState<number | ''>('');

  // Dữ liệu V2 (Cũ)
  const [v2Provinces, setV2Provinces] = useState<ViettelProvince[]>([]);
  const [v2Districts, setV2Districts] = useState<ViettelDistrict[]>([]);
  const [v2Wards, setV2Wards] = useState<ViettelWardV2[]>([]);
  const [selectedV2ProvinceId, setSelectedV2ProvinceId] = useState<number | ''>('');
  const [selectedV2DistrictId, setSelectedV2DistrictId] = useState<number | ''>('');
  const [selectedV2WardId, setSelectedV2WardId] = useState<number | ''>('');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [regErrorMsg, setRegErrorMsg] = useState('');
  const [regFieldErrors, setRegFieldErrors] = useState<{
    phone?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isRegLoading, setIsRegLoading] = useState(false);

  // Modals phụ trợ
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [policyModalType, setPolicyModalType] = useState<'privacy' | 'terms' | null>(null);

  // Modal thông báo đăng ký thành công
  const [registeredSuccessData, setRegisteredSuccessData] = useState<{
    storeId: string;
    storeName: string;
    username: string;
    password: string;
    contactName: string;
    phone: string;
  } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Nạp danh sách tỉnh thành ViettelPost khi vào trang đăng ký
  useEffect(() => {
    if (mode === 'register') {
      let isMounted = true;
      const loadProvinces = async () => {
        setLoadingProvinces(true);
        try {
          if (locationStandard === 'v3') {
            const list = await getV3Provinces();
            if (isMounted) setV3Provinces(list);
          } else {
            const list = await getV2Provinces();
            if (isMounted) setV2Provinces(list);
          }
        } catch (err) {
          console.error('Lỗi nạp danh mục tỉnh ViettelPost:', err);
        } finally {
          if (isMounted) setLoadingProvinces(false);
        }
      };
      loadProvinces();
      return () => {
        isMounted = false;
      };
    }
  }, [mode, locationStandard]);

  // Chuyển đổi danh mục địa danh sang options cho SearchableLocationSelect
  const v3ProvinceOptions: LocationOption[] = useMemo(
    () =>
      v3Provinces.map((p) => ({
        value: p.PROVINCE_ID,
        label: p.PROVINCE_NAME,
        code: p.PROVINCE_CODE,
      })),
    [v3Provinces]
  );

  const v3WardOptions: LocationOption[] = useMemo(
    () =>
      v3Wards.map((w) => ({
        value: w.WARDS_ID,
        label: w.WARDS_NAME,
      })),
    [v3Wards]
  );

  const v2ProvinceOptions: LocationOption[] = useMemo(
    () =>
      v2Provinces.map((p) => ({
        value: p.PROVINCE_ID,
        label: p.PROVINCE_NAME,
        code: p.PROVINCE_CODE,
      })),
    [v2Provinces]
  );

  const v2DistrictOptions: LocationOption[] = useMemo(
    () =>
      v2Districts.map((d) => ({
        value: d.DISTRICT_ID,
        label: d.DISTRICT_NAME,
        code: d.DISTRICT_VALUE,
      })),
    [v2Districts]
  );

  const v2WardOptions: LocationOption[] = useMemo(
    () =>
      v2Wards.map((w) => ({
        value: w.WARDS_ID,
        label: w.WARDS_NAME,
      })),
    [v2Wards]
  );

  // V3: Đổi Tỉnh mới -> Nạp Phường/Xã mới
  const handleV3ProvinceChange = async (val: number | '') => {
    setSelectedV3ProvinceId(val);
    setSelectedV3WardId('');
    setV3Wards([]);

    if (!val) return;

    setLoadingWards(true);
    try {
      const wardsList = await getV3Wards(Number(val));
      setV3Wards(wardsList);
    } catch (err) {
      console.error('Lỗi nạp Phường/Xã V3:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  // V2: Đổi Tỉnh cũ -> Nạp Quận/Huyện cũ
  const handleV2ProvinceChange = async (val: number | '') => {
    setSelectedV2ProvinceId(val);
    setSelectedV2DistrictId('');
    setV2Districts([]);
    setSelectedV2WardId('');
    setV2Wards([]);

    if (!val) return;

    setLoadingDistricts(true);
    try {
      const districtsList = await getV2Districts(Number(val));
      setV2Districts(districtsList);
    } catch (err) {
      console.error('Lỗi nạp Quận/Huyện V2:', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // V2: Đổi Quận/Huyện cũ -> Nạp Phường/Xã cũ
  const handleV2DistrictChange = async (val: number | '') => {
    setSelectedV2DistrictId(val);
    setSelectedV2WardId('');
    setV2Wards([]);

    if (!val) return;

    setLoadingWards(true);
    try {
      const wardsList = await getV2Wards(Number(val));
      setV2Wards(wardsList);
    } catch (err) {
      console.error('Lỗi nạp Phường/Xã V2:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  // Xử lý gửi biểu mẫu đăng nhập
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoginLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        if (res.needsPasswordSetup && res.user) {
          setSetupUser({ id: res.user.id, name: res.user.name });
          setSetupPass('');
          setSetupPass2('');
          setSetupError(null);
          setPassword('');
        } else {
          setLoginError(res.error || 'Tài khoản hoặc mật khẩu không chính xác.');
        }
        setIsLoginLoading(false);
      }
    }, 350);
  };

  // Xử lý đặt mật khẩu lần đầu
  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupUser) return;
    if (setupPass.trim() !== setupPass2.trim()) {
      setSetupError('Mật khẩu nhập lại không khớp.');
      return;
    }
    const res = completeFirstTimeSetup(setupUser.id, setupPass);
    if (!res.success) {
      setSetupError(res.error || 'Không thể đặt mật khẩu. Vui lòng thử lại.');
    }
  };

  // Kiểm tra biểu mẫu đăng ký
  const validateRegisterForm = (): boolean => {
    const errors: { phone?: string; email?: string; password?: string; confirmPassword?: string } = {};

    const cleanPhone = regPhone.trim().replace(/\D/g, '');
    if (!regPhone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
      errors.phone = 'Số điện thoại bắt buộc phải đủ 10 chữ số (bắt đầu bằng số 0)';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regEmail.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(regEmail.trim())) {
      errors.email = 'Email không đúng định dạng (Ví dụ: shop@gmail.com)';
    }

    if (!regPassword || regPassword.length < 6) {
      errors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự';
    }

    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setRegFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setRegErrorMsg(errors.phone || errors.email || errors.password || errors.confirmPassword || 'Vui lòng kiểm tra lại thông tin.');
      return false;
    }

    if (!regStoreName.trim() || !regContactName.trim() || !regUsername.trim()) {
      setRegErrorMsg('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)');
      return false;
    }

    if (locationStandard === 'v3') {
      if (!selectedV3ProvinceId) {
        setRegErrorMsg('Vui lòng chọn Tỉnh / Thành phố mới');
        return false;
      }
    } else {
      if (!selectedV2ProvinceId) {
        setRegErrorMsg('Vui lòng chọn Tỉnh / Thành phố');
        return false;
      }
      if (!selectedV2DistrictId) {
        setRegErrorMsg('Vui lòng chọn Quận / Huyện');
        return false;
      }
    }

    if (!agreeTerms) {
      setRegErrorMsg('Bạn cần đồng ý với Điều khoản và Chính sách quyền riêng tư để tiếp tục');
      return false;
    }

    setRegErrorMsg('');
    return true;
  };

  // Xử lý gửi biểu mẫu đăng ký
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setIsRegLoading(true);

    setTimeout(() => {
      const provinceName = locationStandard === 'v3'
        ? v3Provinces.find((item) => item.PROVINCE_ID === selectedV3ProvinceId)?.PROVINCE_NAME || 'Thành Phố Hà Nội'
        : v2Provinces.find((item) => item.PROVINCE_ID === selectedV2ProvinceId)?.PROVINCE_NAME || 'Hà Nội';

      const districtName = locationStandard === 'v3'
        ? ''
        : v2Districts.find((item) => item.DISTRICT_ID === selectedV2DistrictId)?.DISTRICT_NAME || '';

      const wardName = locationStandard === 'v3'
        ? v3Wards.find((item) => item.WARDS_ID === selectedV3WardId)?.WARDS_NAME || ''
        : v2Wards.find((item) => item.WARDS_ID === selectedV2WardId)?.WARDS_NAME || '';

      const administrativeParts = [wardName, districtName, provinceName].filter(Boolean).join(', ');
      const fullAddressString = detailAddress.trim()
        ? `${detailAddress.trim()}, ${administrativeParts}`
        : administrativeParts;

      const cleanPhone = regPhone.trim().replace(/\D/g, '');

      // 1. Tạo cửa hàng mới trong hệ thống
      const newStoreId = addStore({
        name: regStoreName.trim(),
        contactName: regContactName.trim(),
        phone: cleanPhone,
        email: regEmail.trim(),
        status: 'active',
        username: regUsername.trim(),
        address: fullAddressString,
        province: provinceName,
        ward: wardName ? `${wardName}, ${districtName}` : districtName,
        defaultFee: 22000,
        insuranceRate: 0.108,
        volumeRatio: 6000,
        feeBrackets: [
          { id: 'fb1', minWeight: 0.01, maxWeight: 1, fee: 17000, stepWeight: 0, stepFee: 0 },
          { id: 'fb2', minWeight: 1.01, maxWeight: 2, fee: 19000, stepWeight: 1, stepFee: 5000 },
        ],
        pickupPoints: [
          {
            id: 'pp1',
            name: `${regStoreName.trim()} - Kho Lấy Hàng`,
            phone: cleanPhone,
            address: fullAddressString,
            status: 'active',
          },
        ],
        carriers: [
          { id: 'c1', name: 'J&T Express', code: 'JNT', status: 'connected' },
          { id: 'c2', name: 'Viettel Post', code: 'VTP', status: 'connected' },
        ],
      });

      // 2. Tạo tài khoản người dùng gắn liền với cửa hàng mới
      addUser({
        name: regContactName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        phone: cleanPhone,
        password: regPassword.trim(),
        role: 'store_manager',
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
        storeAccessType: 'specific',
        allowedStoreIds: [newStoreId],
        storePermissions: {
          canViewOrders: true,
          canViewShippingStatus: true,
          canViewRevenue: true,
        },
        permissions: {
          requests: { all: true, add: true, view: true },
          home: { all: true, view: true, processReturns: true },
          orders: {
            all: true,
            rushPickup: true,
            orderActions: true,
            viewOrderList: true,
            editOrderInfo: true,
            rushDelivery: true,
            createOrder: true,
            editCod: true,
            viewAllOrders: true,
          },
          chat: { all: true, messageList: true, deleteMessage: false, rating: true },
          products: { all: true, add: true, edit: true, search: true },
          settings: { all: true, notes: true, blacklist: true, pushConfig: true, recipientList: true },
          cashFlow: { all: true, history: true, downloadFile: true },
          partialReturn: { all: true, viewHistory: true, downloadFile: true },
          accountActive: true,
          maskRecipientInfo: false,
        },
      });

      setIsRegLoading(false);

      // Hiển thị modal chúc mừng thành công
      setRegisteredSuccessData({
        storeId: newStoreId,
        storeName: regStoreName.trim(),
        username: regUsername.trim(),
        password: regPassword.trim(),
        contactName: regContactName.trim(),
        phone: cleanPhone,
      });
    }, 500);
  };

  const handleCopyCredentials = () => {
    if (!registeredSuccessData) return;
    const info = `THÔNG TIN TÀI KHOẢN VÀ CỬA HÀNG DOLAX
--------------------------------------
Mã cửa hàng: ${registeredSuccessData.storeId}
Tên cửa hàng: ${registeredSuccessData.storeName}
Tên người liên hệ: ${registeredSuccessData.contactName}
Số điện thoại: ${registeredSuccessData.phone}
Tài khoản đăng nhập: ${registeredSuccessData.username}
Mật khẩu: ${registeredSuccessData.password}
--------------------------------------
Đăng nhập ngay tại: ${window.location.origin}`;

    navigator.clipboard.writeText(info).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  const handleBackToLoginAfterRegister = () => {
    if (registeredSuccessData) {
      // Tự động điền tài khoản và mật khẩu vừa tạo vào ô đăng nhập để tiện sử dụng
      setUsername(registeredSuccessData.username || registeredSuccessData.phone);
      setPassword(registeredSuccessData.password);
    }
    // Đóng modal thông báo thành công
    setRegisteredSuccessData(null);
    // Chuyển về màn hình đăng nhập
    setMode('login');
    setLoginError(null);

    // Reset lại form đăng ký
    setRegStoreName('');
    setRegContactName('');
    setRegPhone('');
    setRegEmail('');
    setRegUsername('');
    setRegPassword('');
    setRegConfirmPassword('');
    setDetailAddress('');
    setSelectedV3ProvinceId('');
    setSelectedV3WardId('');
    setSelectedV2ProvinceId('');
    setSelectedV2DistrictId('');
    setSelectedV2WardId('');
    setRegErrorMsg('');
    setRegFieldErrors({});
  };

  const handleDirectLoginToStore = () => {
    if (!registeredSuccessData) return;
    const loginAccount = registeredSuccessData.username || registeredSuccessData.phone;
    const res = login(loginAccount, registeredSuccessData.password);
    if (res.success) {
      setSelectedStoreIdForDetail(registeredSuccessData.storeId);
      setCurrentPage('stores');
      setRegisteredSuccessData(null);
    } else {
      handleBackToLoginAfterRegister();
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-3 sm:p-6 selection:bg-[#ef4444] selection:text-white">
      {/* Container chính: Chia đôi màn hình chuẩn thiết kế Ảnh 1 */}
      <div className="w-full max-w-[1240px] min-h-[640px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-gray-100">
        {/* ========================================================
            CỘT TRÁI (6 Cột): ĐỒNG BỘ NGHỆ THUẬT THEO ẢNH 1 (DẠNG SÓNG, HÌNH ẢNH 3D, HỆ ĐIỀU HÀNH BÁN HÀNG VÀ GIAO VẬN)
           ======================================================== */}
        <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-[#0c1222] via-[#111827] to-[#1e1b4b] p-8 sm:p-12 relative overflow-hidden flex-col justify-between text-white">
          {/* Lớp nền lượn sóng hữu cơ (Organic Waves) đồng bộ nhận diện đỏ Dolax */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              className="absolute -top-20 -left-20 w-[620px] h-[620px] opacity-40 text-[#ef4444] blur-2xl"
              viewBox="0 0 200 200"
              fill="currentColor"
            >
              <path
                d="M45.7,-64.1C58.6,-56.3,68.2,-43.3,73.4,-29C78.6,-14.7,79.4,0.9,74.7,14.6C70,28.3,59.8,40.1,47.8,49.2C35.8,58.3,22,64.7,7.6,67.6C-6.8,70.5,-21.8,69.9,-35.1,63.7C-48.4,57.5,-60,45.7,-68.4,31.4C-76.8,17.1,-82,-0.2,-79.1,-16.2C-76.2,-32.2,-65.2,-46.9,-51.1,-54.6C-37,-62.3,-18.5,-63.1,-0.6,-62.3C17.3,-61.5,32.8,-71.9,45.7,-64.1Z"
                transform="translate(100 100)"
              />
            </svg>
            <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Phần đầu: Logo và định vị thương hiệu */}
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ef4444] to-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                <Truck size={22} className="stroke-[2.5]" />
              </div>
              <div className="flex items-baseline font-black tracking-tight text-3xl">
                <span>do</span>
                <span className="text-[#ef4444]">lax</span>
              </div>
              <span className="bg-[#ef4444]/20 text-rose-300 border border-[#ef4444]/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Logistics OS
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              Cổng vận hành đơn vị vận chuyển & đối soát dòng tiền đa sàn tập trung
            </p>
          </div>

          {/* Minh họa 3D tương tác theo tinh thần Ảnh 1 (Smartphone, Hologram & Các sàn TMĐT) */}
          <div className="relative z-10 py-6 my-auto flex items-center justify-center">
            <div className="relative w-full max-w-[420px] h-[340px] flex items-center justify-center">
              {/* Vầng sáng phía sau màn hình điện thoại */}
              <div className="absolute w-64 h-64 bg-gradient-to-tr from-[#ef4444]/30 to-indigo-500/20 rounded-full blur-2xl" />

              {/* Khung điện thoại thông minh 3D nghiêng */}
              <div className="relative w-48 h-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-[32px] p-2.5 border-2 border-slate-700/80 shadow-2xl rotate-[-6deg] transform hover:rotate-0 transition-transform duration-500">
                {/* Loa thoại & camera trước */}
                <div className="w-20 h-3.5 bg-black rounded-full mx-auto mb-2 flex items-center justify-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-indigo-500/40 rounded-full" />
                </div>
                {/* Màn hình điện thoại hiển thị ứng dụng Dolax */}
                <div className="w-full h-[calc(100%-24px)] bg-gradient-to-b from-slate-950 to-slate-900 rounded-[22px] p-3 text-[9px] flex flex-col justify-between overflow-hidden border border-slate-800">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-bold text-white text-[10px]">Dolax Pro</span>
                    <span className="text-emerald-400 font-mono">Trực tuyến</span>
                  </div>
                  {/* Biểu đồ mini trên màn hình */}
                  <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700/50 space-y-1">
                    <div className="text-[8px] text-slate-400">Đơn giao hôm nay</div>
                    <div className="text-sm font-black text-white">496 đơn</div>
                    <div className="h-6 w-full flex items-end space-x-1 pt-1">
                      <div className="w-1/6 bg-rose-500/40 h-2 rounded-t" />
                      <div className="w-1/6 bg-rose-500/60 h-3 rounded-t" />
                      <div className="w-1/6 bg-rose-500/70 h-4 rounded-t" />
                      <div className="w-1/6 bg-[#ef4444] h-6 rounded-t" />
                      <div className="w-1/6 bg-rose-500/80 h-5 rounded-t" />
                      <div className="w-1/6 bg-rose-500 h-6 rounded-t" />
                    </div>
                  </div>
                  {/* Trạng thái đơn */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[8px] text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                      <span>Đối soát COD</span>
                      <span className="text-emerald-400 font-bold">154.8M đ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hologram Card 1: SUPPORT 24/7 (Đúng như ảnh 1 người dùng cung cấp) */}
              <div className="absolute top-6 right-2 sm:right-6 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-white rounded-2xl p-3 shadow-xl flex items-center space-x-2.5 animate-bounce-subtle z-20">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-500/20">
                  <Headphones size={18} />
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-cyan-300">
                    Hỗ trợ CSKH
                  </div>
                  <div className="text-xs font-black text-white">SUPPORT 24/7</div>
                </div>
              </div>

              {/* Hologram Card 2: Biểu đồ tăng trưởng doanh thu phát sinh */}
              <div className="absolute bottom-8 left-2 sm:left-4 bg-slate-900/90 backdrop-blur-md border border-rose-500/30 text-white rounded-2xl p-3 shadow-xl flex items-center space-x-2.5 z-20">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ef4444] to-rose-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-rose-500/20">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-rose-300">
                    Doanh thu & COD
                  </div>
                  <div className="text-xs font-black text-white">+38.5% Tuần này</div>
                </div>
              </div>

              {/* Badge sàn Shopee (Cam với chữ S trắng giống ảnh 1) */}
              <div className="absolute top-16 left-6 w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 border border-orange-400/40 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30 transform -rotate-12 hover:rotate-0 transition-transform">
                S
              </div>

              {/* Badge sàn TikTok (Đen viền neon xanh/hồng giống ảnh 1) */}
              <div className="absolute bottom-20 right-8 w-11 h-11 rounded-2xl bg-black border border-cyan-400/40 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 transform rotate-12 hover:rotate-0 transition-transform">
                <span className="font-black text-base tracking-tighter text-cyan-400">
                  <Sparkles size={20} className="text-rose-400" />
                </span>
              </div>

              {/* Icon Văn bản / Biên bản giao nhận */}
              <div className="absolute top-2 left-1/3 -translate-x-1/2 w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shadow-md">
                <FileText size={15} />
              </div>

              {/* Icon Đồng hồ đối soát */}
              <div className="absolute bottom-2 right-1/3 w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shadow-md">
                <Clock size={15} />
              </div>
            </div>
          </div>

          {/* Phần chân cột trái: 3 cam kết vận hành */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Đối soát tự động</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 size={14} className="text-[#ef4444] shrink-0" />
              <span>Kết nối J&T, VTP</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
              <span>Phí cước tối ưu</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            CỘT PHẢI (6 Cột): FORM ĐĂNG NHẬP / CHỌN TÀI KHOẢN / ĐĂNG KÝ
           ======================================================== */}
        <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white relative overflow-y-auto max-h-[92vh]">
          {/* Logo mobile hiển thị khi ở màn hình nhỏ */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#ef4444] flex items-center justify-center text-white">
              <Truck size={18} />
            </div>
            <div className="flex items-baseline font-black tracking-tight text-2xl text-gray-900">
              <span>do</span>
              <span className="text-[#ef4444]">lax</span>
            </div>
          </div>

          {/* ========================================================
              VIEW 1: MÀN HÌNH ĐĂNG NHẬP (KHỚP ẢNH 1 & ẢNH 2)
             ======================================================== */}
          {mode === 'login' && setupUser && (
            <div className="max-w-[360px] w-full mx-auto space-y-6 animate-in fade-in">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Đặt mật khẩu
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Tài khoản <span className="font-bold text-gray-800">{setupUser.name}</span> chưa có mật khẩu.
                  Hãy tạo mật khẩu mới (ít nhất 8 ký tự) để tiếp tục.
                </p>
              </div>

              {setupError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <span>{setupError}</span>
                </div>
              )}

              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={setupPass}
                    onChange={(e) => setSetupPass(e.target.value)}
                    placeholder="Ít nhất 8 ký tự"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nhập lại mật khẩu</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={setupPass2}
                    onChange={(e) => setSetupPass2(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] transition-all font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#ef4444] hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
                >
                  Lưu mật khẩu và đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSetupUser(null);
                    setSetupError(null);
                  }}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 hover:underline cursor-pointer"
                >
                  Quay lại đăng nhập
                </button>
              </form>
            </div>
          )}

          {mode === 'login' && !setupUser && (
            <div className="max-w-[360px] w-full mx-auto space-y-6 animate-in fade-in">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Đăng nhập
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Chào bạn, hãy đăng nhập để bắt đầu bán hàng ngay nào!
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Tên đăng nhập/Email/Số điện thoại
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập, email hoặc số điện thoại"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] transition-all font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700">Mật khẩu</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] transition-all font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer text-gray-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-[#ef4444] focus:ring-[#ef4444] w-3.5 h-3.5"
                    />
                    <span>Ghi nhớ phiên đăng nhập</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full py-3 px-4 bg-[#ef4444] hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-70 mt-2"
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-1" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <span>Đăng nhập</span>
                  )}
                </button>
              </form>

              {/* DÒNG ĐĂNG KÝ TÀI KHOẢN MỚI (Khớp 100% Ảnh 2: "Chưa có tài khoản? Đăng ký ngay") */}
              <div className="text-center pt-2">
                <span className="text-xs text-gray-600">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setRegErrorMsg('');
                      setRegFieldErrors({});
                      setMode('register');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer ml-1 inline-flex items-center space-x-1"
                  >
                    <span>Đăng ký ngay</span>
                    <ArrowRight size={13} />
                  </button>
                </span>
              </div>

              {/* Điều khoản chân trang */}
              <div className="pt-6 border-t border-gray-100 text-center text-[11px] text-gray-500">
                <span>Vui lòng tham khảo </span>
                <button
                  type="button"
                  onClick={() => setPolicyModalType('privacy')}
                  className="text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  Chính sách quyền riêng tư
                </button>
                <span> và </span>
                <button
                  type="button"
                  onClick={() => setPolicyModalType('terms')}
                  className="text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  Điều khoản
                </button>
                <span> của chúng tôi</span>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: MÀN HÌNH ĐĂNG KÝ TÀI KHOẢN MỚI
              (Bao gồm các thông tin yêu cầu cơ bản như màn Thêm cửa hàng)
             ======================================================== */}
          {mode === 'register' && (
            <div className="max-w-xl w-full mx-auto space-y-5 animate-in fade-in py-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="inline-flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-900 font-semibold cursor-pointer mb-1 transition-colors"
              >
                <ChevronLeft size={16} />
                <span>Quay lại Đăng nhập</span>
              </button>

              <div className="space-y-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Đăng ký tài khoản mới
                </h1>
                <p className="text-xs text-gray-500">
                  Khởi tạo thông tin cửa hàng và tài khoản đối tác vận chuyển Dolax
                </p>
              </div>

              {regErrorMsg && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>{regErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* NHÓM 1: THÔNG TIN CỬA HÀNG VÀ CHỦ TÀI KHOẢN */}
                <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-3.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-800 pb-1 border-b border-gray-200/60">
                    <StoreIcon size={14} className="text-[#ef4444]" />
                    <span>1. Thông tin cửa hàng & Liên hệ</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Tên cửa hàng <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Dolax Fashion Shop"
                        value={regStoreName}
                        onChange={(e) => setRegStoreName(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Tên người liên hệ / Chủ shop <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={regContactName}
                        onChange={(e) => setRegContactName(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Số điện thoại <span className="text-rose-500">* (10 số)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="0987654321"
                          value={regPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setRegPhone(val);
                            if (!regUsername || regUsername === regPhone) setRegUsername(val);
                            if (regFieldErrors.phone) setRegFieldErrors({ ...regFieldErrors, phone: undefined });
                          }}
                          className={`w-full text-xs border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 ${
                            regFieldErrors.phone
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                              : 'border-gray-200 focus:border-[#ef4444] focus:ring-[#ef4444]'
                          }`}
                        />
                        <Phone size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {regFieldErrors.phone && (
                        <p className="text-[10px] text-rose-600 mt-1">{regFieldErrors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Email liên hệ <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="shop@gmail.com"
                          value={regEmail}
                          onChange={(e) => {
                            setRegEmail(e.target.value);
                            if (regFieldErrors.email) setRegFieldErrors({ ...regFieldErrors, email: undefined });
                          }}
                          className={`w-full text-xs border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 ${
                            regFieldErrors.email
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                              : 'border-gray-200 focus:border-[#ef4444] focus:ring-[#ef4444]'
                          }`}
                        />
                        <Mail size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {regFieldErrors.email && (
                        <p className="text-[10px] text-rose-600 mt-1">{regFieldErrors.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* NHÓM 2: THÔNG TIN ĐĂNG NHẬP */}
                <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-3.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-800 pb-1 border-b border-gray-200/60">
                    <User size={14} className="text-[#ef4444]" />
                    <span>2. Thông tin tài khoản đăng nhập</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Tên đăng nhập hệ thống <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên đăng nhập (hoặc số điện thoại)"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Mật khẩu <span className="text-rose-500">* (Tối thiểu 6 ký tự)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          placeholder="Mật khẩu bảo mật"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showRegPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Xác nhận mật khẩu <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          placeholder="Nhập lại mật khẩu"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className={`w-full text-xs border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 ${
                            regFieldErrors.confirmPassword
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                              : 'border-gray-200 focus:border-[#ef4444] focus:ring-[#ef4444]'
                          }`}
                        />
                        <Lock size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* NHÓM 3: ĐỊA CHỈ LẤY HÀNG (CHUẨN VIETTELPOST) */}
                <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-1 border-b border-gray-200/60 gap-1.5">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
                      <MapPin size={14} className="text-[#ef4444]" />
                      <span>3. Địa chỉ kho lấy hàng mặc định</span>
                      <span className="text-[10px] text-[#ef4444] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-semibold">
                        ViettelPost
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <div className="inline-flex p-0.5 bg-white rounded-lg border border-gray-200 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setLocationStandard('v3')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            locationStandard === 'v3'
                              ? 'bg-[#ef4444] text-white shadow-2xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Mới (v3)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationStandard('v2')}
                          className={`px-2 py-0.5 rounded font-semibold transition-all ${
                            locationStandard === 'v2'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Cũ (v2)
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600 hover:text-[#ef4444] font-medium"
                      >
                        Tra cứu
                      </button>
                    </div>
                  </div>

                  {locationStandard === 'v3' ? (
                    /* CHUẨN MỚI V3 (2 CẤP) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Tỉnh / TP mới */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center justify-between">
                          <span>
                            Tỉnh / Thành phố mới (v3) <span className="text-rose-500">*</span>
                          </span>
                          {loadingProvinces && <Loader2 size={10} className="animate-spin text-[#ef4444]" />}
                        </label>
                        <SearchableLocationSelect
                          options={v3ProvinceOptions}
                          value={selectedV3ProvinceId}
                          onChange={handleV3ProvinceChange}
                          placeholder="Chọn hoặc gõ tên Tỉnh / TP mới"
                          isLoading={loadingProvinces}
                          required
                          emptyText="Không tìm thấy Tỉnh / TP nào"
                        />
                      </div>

                      {/* Phường / Xã mới */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center justify-between">
                          <span>Phường / Xã mới (v3)</span>
                          {loadingWards && <Loader2 size={10} className="animate-spin text-[#ef4444]" />}
                        </label>
                        <SearchableLocationSelect
                          options={v3WardOptions}
                          value={selectedV3WardId}
                          onChange={(val) => setSelectedV3WardId(val)}
                          disabled={!selectedV3ProvinceId || loadingWards || v3Wards.length === 0}
                          placeholder={
                            !selectedV3ProvinceId
                              ? '-- Chọn Tỉnh trước --'
                              : 'Chọn hoặc gõ tên Phường / Xã mới'
                          }
                          isLoading={loadingWards}
                          emptyText="Không tìm thấy Phường / Xã nào"
                        />
                      </div>
                    </div>
                  ) : (
                    /* CHUẨN CŨ V2 (3 CẤP) */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Tỉnh / Thành phố V2 */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center justify-between">
                          <span>
                            Tỉnh / Thành phố <span className="text-rose-500">*</span>
                          </span>
                          {loadingProvinces && <Loader2 size={10} className="animate-spin text-[#ef4444]" />}
                        </label>
                        <SearchableLocationSelect
                          options={v2ProvinceOptions}
                          value={selectedV2ProvinceId}
                          onChange={handleV2ProvinceChange}
                          placeholder="Chọn hoặc gõ tên Tỉnh"
                          isLoading={loadingProvinces}
                          required
                          emptyText="Không tìm thấy Tỉnh / TP nào"
                        />
                      </div>

                      {/* Quận / Huyện V2 */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center justify-between">
                          <span>
                            Quận / Huyện <span className="text-rose-500">*</span>
                          </span>
                          {loadingDistricts && <Loader2 size={10} className="animate-spin text-[#ef4444]" />}
                        </label>
                        <SearchableLocationSelect
                          options={v2DistrictOptions}
                          value={selectedV2DistrictId}
                          onChange={handleV2DistrictChange}
                          disabled={!selectedV2ProvinceId || loadingDistricts || v2Districts.length === 0}
                          placeholder={
                            !selectedV2ProvinceId
                              ? '-- Chọn Tỉnh trước --'
                              : 'Chọn hoặc gõ tên Quận / Huyện'
                          }
                          isLoading={loadingDistricts}
                          required
                          emptyText="Không tìm thấy Quận / Huyện nào"
                        />
                      </div>

                      {/* Phường / Xã V2 */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center justify-between">
                          <span>Phường / Xã</span>
                          {loadingWards && <Loader2 size={10} className="animate-spin text-[#ef4444]" />}
                        </label>
                        <SearchableLocationSelect
                          options={v2WardOptions}
                          value={selectedV2WardId}
                          onChange={(val) => setSelectedV2WardId(val)}
                          disabled={!selectedV2DistrictId || loadingWards || v2Wards.length === 0}
                          placeholder={
                            !selectedV2DistrictId
                              ? '-- Chọn Huyện trước --'
                              : 'Chọn hoặc gõ tên Phường / Xã'
                          }
                          isLoading={loadingWards}
                          emptyText="Không tìm thấy Phường / Xã nào"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà...)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Số 25, ngõ 168 Duy Tân"
                      value={detailAddress}
                      onChange={(e) => setDetailAddress(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]"
                    />
                  </div>
                </div>

                {/* Điều khoản */}
                <div className="flex items-start space-x-2 text-xs pt-1">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-[#ef4444] focus:ring-[#ef4444]"
                  />
                  <label htmlFor="agreeTerms" className="text-gray-600 text-[11px] cursor-pointer">
                    Tôi đồng ý với{' '}
                    <button
                      type="button"
                      onClick={() => setPolicyModalType('terms')}
                      className="text-blue-600 underline font-medium"
                    >
                      Điều khoản dịch vụ
                    </button>{' '}
                    và{' '}
                    <button
                      type="button"
                      onClick={() => setPolicyModalType('privacy')}
                      className="text-blue-600 underline font-medium"
                    >
                      Chính sách bảo mật
                    </button>{' '}
                    của Dolax Logistics.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isRegLoading}
                  className="w-full py-3 px-4 bg-[#ef4444] hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-70"
                >
                  {isRegLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-1" />
                      <span>Đang tạo cửa hàng & tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng ký ngay</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-gray-600">
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer ml-1"
                    >
                      Đăng nhập ngay
                    </button>
                  </span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MODAL: QUÊN MẬT KHẨU
         ======================================================== */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Quên mật khẩu?</h3>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Vì lý do bảo mật tài khoản và dòng tiền đối soát COD, hệ thống không hiển thị hay gửi lại mật khẩu cũ.
              Vui lòng liên hệ Quản trị viên để được cấp lại quyền truy cập.
            </p>
            <p className="text-xs text-gray-500">
              Nếu bạn cần cấp lại mật khẩu mới hoặc hỗ trợ kích hoạt, vui lòng liên hệ Bộ phận CSKH 24/7 qua số hotline: <span className="font-bold text-gray-900">1900 6868</span>.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="w-full py-2.5 bg-[#ef4444] hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CHÍNH SÁCH QUYỀN RIÊNG TƯ / ĐIỀU KHOẢN
         ======================================================== */}
      {policyModalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {policyModalType === 'privacy'
                  ? 'Chính sách quyền riêng tư'
                  : 'Điều khoản dịch vụ Dolax'}
              </h3>
              <button
                type="button"
                onClick={() => setPolicyModalType(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-gray-600 space-y-2.5 max-h-64 overflow-y-auto leading-relaxed">
              <p>
                1. Hệ thống vận hành Dolax cam kết bảo mật tuyệt đối dữ liệu khách hàng, mã vận đơn, số tiền thu hộ COD và danh sách đơn hàng của từng cửa hàng.
              </p>
              <p>
                2. Mọi thông tin đăng nhập và phiên làm việc được mã hóa theo tiêu chuẩn an toàn cao nhất.
              </p>
              <p>
                3. Các chu kỳ đối soát và chuyển tiền COD được thực hiện theo đúng thỏa thuận hợp đồng vận chuyển kết nối các đơn vị vận chuyển hàng đầu như J&T Express và Viettel Post.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPolicyModalType(null)}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold"
            >
              Đã hiểu và đồng ý
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: THÔNG BÁO ĐĂNG KÝ CỬA HÀNG & TÀI KHOẢN THÀNH CÔNG
         ======================================================== */}
      {registeredSuccessData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-100 relative">
            {/* Nút đóng góc phải trên */}
            <button
              type="button"
              onClick={handleBackToLoginAfterRegister}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Đóng và quay lại đăng nhập"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 pr-8">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Đăng ký tài khoản thành công!
                </h3>
                <p className="text-xs text-gray-500">
                  Cửa hàng và tài khoản của bạn đã được khởi tạo sẵn sàng.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-gray-500">Mã cửa hàng:</span>
                <span className="font-bold text-blue-600 font-mono">
                  {registeredSuccessData.storeId}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-gray-500">Tên cửa hàng:</span>
                <span className="font-bold text-gray-900">
                  {registeredSuccessData.storeName}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-gray-500">Tên đăng nhập:</span>
                <span className="font-bold text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                  {registeredSuccessData.username}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/70">
                <span className="text-gray-500">Mật khẩu:</span>
                <span className="font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {registeredSuccessData.password}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số điện thoại liên hệ:</span>
                <span className="font-medium text-gray-800">
                  {registeredSuccessData.phone}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDirectLoginToStore}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ef4444] to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md shadow-rose-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Đăng nhập &amp; Vào Quản lý cửa hàng</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleCopyCredentials}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                  copiedSuccess
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
                }`}
              >
                {copiedSuccess ? (
                  <>
                    <Check size={16} />
                    <span>Đã sao chép thông tin tài khoản!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Sao chép thông tin tài khoản</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToLoginAfterRegister}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Quay lại trang đăng nhập</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tra cứu danh mục địa danh ViettelPost V3 & V2 */}
      <ViettelPostLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};
