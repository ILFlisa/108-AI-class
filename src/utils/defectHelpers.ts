import { CaseStatus, DefectType, SeverityLevel, InitialContainment, UserRole } from '../types/defect';

export const STATUS_CONFIG: Record<CaseStatus, { label: string; bg: string; text: string; border: string; desc: string }> = {
  DRAFT: {
    label: '草稿',
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-700',
    desc: '案件尚未正式送出'
  },
  PENDING_CONFIRMATION: {
    label: '待確認',
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-700/60',
    desc: '案件已送出，等待受理人員檢查'
  },
  REVISION_REQUIRED: {
    label: '待補件',
    bg: 'bg-rose-950/70',
    text: 'text-rose-400',
    border: 'border-rose-700/60',
    desc: '資料不足，等待通報人補充'
  },
  PENDING_DISPATCH: {
    label: '待派工',
    bg: 'bg-indigo-950/60',
    text: 'text-indigo-400',
    border: 'border-indigo-700/60',
    desc: '資料已確認，等待指定處理人員'
  },
  IN_PROGRESS: {
    label: '處理中',
    bg: 'bg-sky-950/60',
    text: 'text-sky-400',
    border: 'border-sky-700/60',
    desc: '維修、工程或相關單位正在調查及處理'
  },
  PENDING_VERIFICATION: {
    label: '待驗證',
    bg: 'bg-purple-950/60',
    text: 'text-purple-400',
    border: 'border-purple-700/60',
    desc: '改善措施已執行，等待品質或製程驗證'
  },
  PENDING_CLOSURE: {
    label: '待結案',
    bg: 'bg-teal-950/60',
    text: 'text-teal-400',
    border: 'border-teal-700/60',
    desc: '已符合結案初步條件，等待主管核准'
  },
  CLOSED: {
    label: '已結案',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-700/60',
    desc: '案件已依規定完成結案並入庫'
  },
  CANCELLED: {
    label: '已取消',
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-400',
    border: 'border-zinc-700',
    desc: '經授權人員確認後取消'
  }
};

export const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; badge: string; color: string; dot: string }> = {
  NORMAL: {
    label: '一般',
    badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    color: 'text-blue-400',
    dot: 'bg-blue-400'
  },
  MAJOR: {
    label: '重大',
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    color: 'text-amber-400',
    dot: 'bg-amber-400'
  },
  CRITICAL: {
    label: '緊急',
    badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/40 animate-pulse',
    color: 'text-rose-400',
    dot: 'bg-rose-500 animate-ping'
  }
};

export const DEFECT_TYPE_CONFIG: Record<DefectType, { label: string; dept: string; icon: string }> = {
  DIMENSION: { label: '產品尺寸異常', dept: '品保／製程工程', icon: '📏' },
  APPEARANCE: { label: '外觀異常', dept: '品保／成型組裝', icon: '🔍' },
  FUNCTION: { label: '功能異常', dept: '測試／品保', icon: '⚡' },
  EQUIPMENT: { label: '設備異常', dept: '設備維修課', icon: '🛠️' },
  MATERIAL: { label: '材料異常', dept: '品保／物料／工程', icon: '📦' },
  PROCESS_PARAM: { label: '製程參數異常', dept: '製程工程／生產', icon: '🌡️' },
  UNKNOWN: { label: '原因不明', dept: '維修／工程／品保共同判讀', icon: '❓' },
  OTHER: { label: '其他', dept: '相關權責單位', icon: '📌' }
};

export const CONTAINMENT_CONFIG: Record<InitialContainment, { label: string; tag: string }> = {
  SHUTDOWN: { label: '即刻停機', tag: 'bg-rose-950/80 text-rose-300 border-rose-700/80' },
  QUARANTINE: { label: '隔離受影響批次產品', tag: 'bg-amber-950/80 text-amber-300 border-amber-700/80' },
  CONTINUE_OBSERVING: { label: '減速／持續觀察', tag: 'bg-blue-950/80 text-blue-300 border-blue-700/80' },
  PARAM_ADJUST: { label: '微調參數', tag: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80' }
};

export const ROLE_DETAILS: Record<UserRole, { title: string; desc: string; corePermissions: string[] }> = {
  OPERATOR: {
    title: '生產現場／作業員',
    desc: '發現異常、建立通報、提供現場資訊、補件與確認改善結果',
    corePermissions: ['建立案件 (FR-001)', '退回補件補充資料 (FR-103)', '查看個人通報案件進度 (FR-205)']
  },
  DISPATCHER: {
    title: '客服／維修受理人員',
    desc: '確認資訊、分類案件、安排派工、追蹤處理進度',
    corePermissions: ['受理審核 (FR-101)', '退回補件 (FR-103)', '案件分類與指派 (FR-104~106)', '開立派工單 (FR-201)']
  },
  TECHNICIAN: {
    title: '維修人員',
    desc: '檢查設備、執行維修、記錄處理結果與數據',
    corePermissions: ['接受派工 (FR-204)', '填寫檢查紀錄與數據 (FR-301~302)', '提交改善處置 (FR-501)']
  },
  ENGINEER: {
    title: '工程／製程人員',
    desc: '分析根本原因、制定改善方案、執行製程驗證',
    corePermissions: ['填寫原因分析 (FR-304)', '制定對策 (FR-501)', '提交品保驗證 (FR-503)', '更新 SOP (FR-508)']
  },
  QA: {
    title: '品保人員',
    desc: '檢驗產品、判定品質、確認改善效果、放行/不放行',
    corePermissions: ['登錄檢驗結果 (FR-503)', '品質判定放行/不放行 (FR-505)', '驗證失敗退回 (FR-506)']
  },
  SUPERVISOR: {
    title: '生產主管／管理者',
    desc: '協調資源、監控案件、核准復線、核准結案',
    corePermissions: ['監控全廠案件與逾期 (FR-206)', '核准復線許可 (FR-507)', '核准最終結案 (FR-603)']
  },
  ADMIN: {
    title: '系統管理員',
    desc: '全權管理使用者、角色權限、系統參數與資料庫',
    corePermissions: ['全功能操作與稽核追溯', '參數與標準字典配置', '系統資料備份與匯出']
  }
};

export function canPerformAction(
  role: UserRole,
  action: 'ACCEPT_AND_CLASSIFY' | 'REJECT_REVISION' | 'DISPATCH' | 'ANALYZE_AND_IMPROVE' | 'VERIFY_QA' | 'APPROVE_RESUME' | 'APPROVE_CLOSURE' | 'EDIT_REPORT_OR_RESUBMIT'
): boolean {
  if (role === 'ADMIN') return true;
  switch (action) {
    case 'ACCEPT_AND_CLASSIFY':
    case 'REJECT_REVISION':
    case 'DISPATCH':
      return role === 'DISPATCHER' || role === 'SUPERVISOR';
    case 'ANALYZE_AND_IMPROVE':
      return role === 'TECHNICIAN' || role === 'ENGINEER';
    case 'VERIFY_QA':
      return role === 'QA';
    case 'APPROVE_RESUME':
    case 'APPROVE_CLOSURE':
      return role === 'SUPERVISOR';
    case 'EDIT_REPORT_OR_RESUBMIT':
      return role === 'OPERATOR';
    default:
      return false;
  }
}
