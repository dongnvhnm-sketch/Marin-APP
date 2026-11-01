export type StoreStatus = 'active' | 'inactive';

export interface FeeBracket {
  id: string;
  minWeight: number; // kg
  maxWeight: number; // kg
  fee: number; // đ
  stepWeight?: number;
  stepFee?: number;
}

export interface PickupPoint {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
}

export interface CarrierShippingConfig {
  allowPartialDelivery: boolean; // Cho phép ký nhận 1 phần
  payerType: 'recipient' | 'sender' | 'sender_monthly'; // Người nhận | Người gửi | Người gửi cuối tháng trả phí
  pickupRequest: 'home' | 'post_office'; // Đến lấy hàng tại nhà | Gửi tại bưu cục
}

export interface ConnectedCarrier {
  id: string;
  name: string;
  code: string;
  status: 'connected' | 'disconnected';
  accountName?: string;
  apiKey?: string;
  clientSecret?: string;
  customerCode?: string;
  config?: CarrierShippingConfig;
}

export interface Store {
  id: string; // e.g. CH0001176
  name: string;
  contactName: string;
  phone: string;
  email: string;
  createdAt: string;
  status: StoreStatus;
  username: string;
  address: string;
  province: string;
  ward: string;
  // Shipping config
  defaultFee: number;
  enableWeightFee?: boolean; // Kích hoạt phí dịch vụ theo trọng lượng
  enableVolumeFee?: boolean; // Kích hoạt trọng lượng quy đổi
  enableInsuranceFee?: boolean; // Kích hoạt tỉ lệ bảo hiểm hàng hóa
  insuranceRate: number; // e.g. 0.108 (%)
  volumeRatio: number; // e.g. 6000
  feeBrackets: FeeBracket[];
  pickupPoints: PickupPoint[];
  carriers: ConnectedCarrier[];
  // Quản lý tài khoản ngân hàng (Khớp 4 mục theo yêu cầu ảnh)
  bankName?: string; // Ngân hàng
  bankCode?: string; // Mã ngân hàng
  accountHolder?: string; // Tên chủ tài khoản
  accountNumber?: string; // Số tài khoản
  // Quản lý hợp đồng (CCCD 2 mặt hoặc GPKD, HĐ dịch vụ PDF)
  contractInfo?: StoreContractInfo;
}

export interface StoreContractInfo {
  entityType: 'individual' | 'business'; // 'individual': Cá nhân, 'business': Doanh nghiệp / Hộ kinh doanh
  // Nếu là cá nhân: CCCD yêu cầu ảnh 2 mặt
  cccdNumber?: string;
  cccdFrontImage?: string; // Ảnh mặt trước CCCD
  cccdBackImage?: string; // Ảnh mặt sau CCCD
  cccdIssueDate?: string;
  cccdIssuePlace?: string;
  // Nếu là doanh nghiệp: Giấy phép kinh doanh
  businessTaxCode?: string; // Mã số thuế / Mã số DN
  businessLicenseImage?: string; // Ảnh / File Giấy phép kinh doanh
  legalRepresentative?: string; // Người đại diện pháp luật
  businessAddress?: string; // Địa chỉ trụ sở
  // HĐ dịch vụ quản lý bằng file PDF
  contractFileUrl?: string; // File PDF hợp đồng dịch vụ
  contractFileName?: string; // Tên file PDF
  contractFileSize?: string; // Kích thước file PDF
  contractCode?: string; // Mã / Số hợp đồng
  contractSignedDate?: string; // Ngày ký kết
  contractExpireDate?: string; // Ngày hết hạn
  contractStatus?: 'active' | 'pending' | 'expired'; // Trạng thái hợp đồng
  notes?: string;
  lastUpdatedBy?: string; // Quản trị viên tối cao cập nhật gần nhất
  lastUpdatedAt?: string;
}

export type OrderStatus =
  | 'draft' // Đơn nháp
  | 'cancelled' // Hủy đơn hàng
  | 'cancel_delivery' // Hủy giao hàng
  | 'sent' // Gửi đơn giao hàng
  | 'picked' // Lấy hàng thành công
  | 'in_transit' // Đang vận chuyển
  | 'delivering' // Đang phát hàng
  | 'delivered' // Giao hàng thành công
  | 'returning' // Chuyển hoàn
  | 'reconciled'; // Đối soát

export interface Order {
  trackingNumber: string; // e.g. #802832561402
  orderCode: string; // e.g. #91106243
  storeId: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  weightKg: number;
  itemPrice: number; // Tiền hàng
  serviceFee: number; // Phí dịch vụ giao hàng (Dolax thu shop)
  actualShippingCost: number; // Phí giao hàng thực tế (Dolax trả đối tác vận chuyển)
  costIsEstimated?: boolean; // true nếu actualShippingCost là số ước tính (chưa có cước thật từ đối tác)
  orderValue: number; // Giá trị đơn hàng
  codAmount: number; // Tiền thu hộ COD
  status: OrderStatus;
  printCount: number;
  createdAt: string;
  carrier: string;
  reconciliationId?: string;
  notes?: string;
  partialReceipt?: boolean; // Ký nhận 1 phần (có / không)
  partialCodModified?: boolean; // Sửa COD đơn 1 phần (có / không)
  pickupPoint?: string; // Điểm gửi hàng
}

// Quyền hạn chi tiết khớp đúng 100% với ảnh Screenshot 11
export interface PermissionSettings {
  requests: {
    all: boolean;
    add: boolean; // Thêm yêu cầu
    view: boolean; // Xem yêu cầu
  };
  home: {
    all: boolean;
    view: boolean; // Xem trang chủ
    processReturns: boolean; // Xử lý đơn chờ hoàn
  };
  orders: {
    all: boolean;
    rushPickup: boolean; // Giục lấy
    orderActions: boolean; // Thao tác đơn hàng
    viewOrderList: boolean; // Xem danh sách đơn
    editOrderInfo: boolean; // Sửa thông tin đơn
    rushDelivery: boolean; // Giục giao
    createOrder: boolean; // Tạo đơn hàng
    editCod: boolean; // Sửa COD
    viewAllOrders: boolean; // Xem toàn bộ đơn hàng
  };
  chat: {
    all: boolean;
    messageList: boolean; // Danh sách tin nhắn
    deleteMessage: boolean; // Xóa tin nhắn
    rating: boolean; // Đánh giá CSKH/Shipper
  };
  products: {
    all: boolean;
    add: boolean; // Thêm mới
    edit: boolean; // Chỉnh sửa
    search: boolean; // Tìm kiếm
  };
  settings: {
    all: boolean;
    notes: boolean; // Ghi chú
    blacklist: boolean; // Danh sách đen
    pushConfig: boolean; // Cấu hình thông báo đẩy
    recipientList: boolean; // Danh sách người nhận
  };
  cashFlow: {
    all: boolean;
    history: boolean; // Lịch sử
    downloadFile: boolean; // Tải file
  };
  partialReturn: {
    all: boolean;
    viewHistory: boolean; // Xem lịch sử hoàn hàng
    downloadFile: boolean; // Tải file
  };
  accountActive: boolean; // Sử dụng tài khoản: Bật / Tắt
  maskRecipientInfo: boolean; // Mã hóa thông tin người nhận
}

export interface StoreAccessPermission {
  canViewOrders: boolean; // Xem đơn hàng của cửa hàng
  canViewShippingStatus: boolean; // Xem trạng thái vận chuyển
  canViewRevenue: boolean; // Xem doanh thu chi tiết tại cửa hàng đó
}

export interface AppUser {
  id: string;
  name: string;
  username?: string; // Tên đăng nhập tài khoản
  email: string;
  phone: string;
  password?: string; // Mật khẩu người dùng / quản trị viên
  passwordResetAt?: string; // Thời điểm quản trị viên đặt lại mật khẩu gần nhất
  passwordResetBy?: string; // Tên quản trị viên đã đặt lại mật khẩu
  role: 'admin' | 'store_manager' | 'coordinator' | 'accountant' | 'support';
  avatar?: string;
  storeAccessType: 'all' | 'specific';
  allowedStoreIds: string[]; // Danh sách cửa hàng được quản lý
  storePermissions: StoreAccessPermission;
  permissions: PermissionSettings;
  createdAt: string;
}

export type ReconciliationStatus = 'pending' | 'reconciled' | 'transferred' | 'disputed';

export interface ReconciliationBatch {
  id: string; // e.g. DS-2026-09-001
  title: string;
  period: string;
  storeId: string;
  storeName: string;
  orderCount: number;
  totalCod: number;
  totalServiceFee: number;
  totalInsuranceFee: number;
  otherFee: number;
  netPayout: number; // COD - Fees
  status: ReconciliationStatus;
  createdAt: string;
  transferredAt?: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  note?: string;
  orderTrackingNumbers: string[];
}

export interface BatchOrderHistoryItem {
  id: string;
  fileName: string;
  fileSize?: string;
  createdAt: string;
  codMethod: string;
  carrier: string;
  createdByUser: string;
  successCount: number;
  totalCount: number;
  statusText?: string;
}

