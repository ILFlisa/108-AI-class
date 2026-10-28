export type UserRole =
  | 'OPERATOR'     // 生產現場／作業員
  | 'DISPATCHER'   // 客服／維修受理人員
  | 'TECHNICIAN'   // 維修人員
  | 'ENGINEER'     // 工程／製程人員
  | 'QA'           // 品保人員
  | 'SUPERVISOR'   // 生產主管／管理者
  | 'ADMIN';       // 系統管理員

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  dept: string;
  avatar?: string;
}

export type CaseStatus =
  | 'DRAFT'                  // 草稿
  | 'PENDING_CONFIRMATION'  // 待確認
  | 'REVISION_REQUIRED'     // 待補件
  | 'PENDING_DISPATCH'      // 待派工
  | 'IN_PROGRESS'           // 處理中
  | 'PENDING_VERIFICATION'  // 待驗證
  | 'PENDING_CLOSURE'       // 待結案
  | 'CLOSED'                // 已結案
  | 'CANCELLED';             // 已取消

export type DefectType =
  | 'DIMENSION'     // 產品尺寸異常
  | 'APPEARANCE'    // 外觀異常
  | 'FUNCTION'      // 功能異常
  | 'EQUIPMENT'     // 設備異常
  | 'MATERIAL'      // 材料異常
  | 'PROCESS_PARAM' // 製程參數異常
  | 'UNKNOWN'       // 原因不明
  | 'OTHER';        // 其他

export type SeverityLevel = 'NORMAL' | 'MAJOR' | 'CRITICAL'; // 一般 | 重大 | 緊急

export type InitialContainment =
  | 'SHUTDOWN'           // 即刻停機
  | 'QUARANTINE'         // 隔離受影響產品
  | 'CONTINUE_OBSERVING' // 持續觀察/降速
  | 'PARAM_ADJUST';      // 微調參數

export interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  previousStatus?: CaseStatus;
  newStatus?: CaseStatus;
  comments?: string;
}

export interface RevisionRecord {
  id: string;
  requestedAt: string;
  requestedBy: string;
  reason: string;
  fulfilledAt?: string;
  supplementText?: string;
}

export interface WorkOrderDispatch {
  workOrderNo: string;
  assignedDept: string;
  primaryAssignee: string;
  collaborators: string[];
  responseSLAHours: number;
  targetCompletionDate: string;
  dispatchedBy: string;
  dispatchedAt: string;
  firstResponseAt?: string;
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    assignee: string;
  }>;
}

export interface InspectionRecord {
  id: string;
  item: string;
  result: 'NORMAL' | 'ABNORMAL' | 'PENDING';
  measuredValue?: string;
  specStandard?: string;
  toolUsed?: string;
  notes: string;
}

export interface CauseAnalysis {
  inspectionItems: InspectionRecord[];
  possibleCauses: string[];
  ruledOutCauses: Array<{
    cause: string;
    reasonWhyRuledOut: string;
  }>;
  rootCause: string;
  isRootCauseConfirmed: boolean; // 若尚未確認可勾選「原因待確認」
  basisEvidence: string;
  analyzedBy: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface ImprovementPlan {
  description: string;
  executor: string;
  targetDate: string;
  completedAt?: string;
  preData: string;
  postData: string;
  sopUpdateRequired: boolean;
  sopUpdateDetails?: string;
}

export interface QaVerification {
  criteria: string;
  sampleQty: number;
  measurements: string;
  verdict?: 'PASSED' | 'FAILED' | 'SUPPLEMENT_NEEDED';
  verifiedBy?: string;
  verifiedAt?: string;
  failureReason?: string;
}

export interface LineResumeApproval {
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  conditions?: string;
}

export interface CaseClosure {
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  approvalRemarks?: string;
  checklist: {
    infoComplete: boolean;
    rootCauseAnalyzed: boolean;
    countermeasuresLogged: boolean;
    qaPassed: boolean;
    lineResumeDone: boolean;
    attachmentsReady: boolean;
    reportReady: boolean;
  };
  closureReportMarkdown?: string;
  isRepeatIssue: boolean;
  linkedPriorCaseId?: string;
}

export interface DefectCase {
  id: string; // e.g. ABN-20261027-001
  createdAt: string;
  occurredAt: string;
  reporterName: string;
  reporterDept: string;
  line: string;
  
  productId: string;
  productName: string;
  batchNumber: string;
  machineId: string;
  
  defectType: DefectType;
  defectDesc: string;
  defectQuantity: number;
  unit: string;
  
  specStandard?: string;
  actualMeasurement?: string;
  severity: SeverityLevel;
  containment: InitialContainment;
  remarks?: string;
  attachments: AttachmentItem[];
  
  status: CaseStatus;
  
  // F02 案件分類與受理
  classification?: {
    category: DefectType;
    priority: SeverityLevel;
    responsibleDept: string;
    classifiedBy: string;
    classifiedAt: string;
    classificationBasis: string;
  };
  
  revisionRequests: RevisionRecord[];
  dispatch?: WorkOrderDispatch;
  investigation: CauseAnalysis;
  improvement: ImprovementPlan;
  verification: QaVerification;
  lineResume: LineResumeApproval;
  closure: CaseClosure;
  
  timeline: TimelineEntry[];
  collaborativeNotes: Array<{
    id: string;
    author: string;
    authorRole: UserRole;
    timestamp: string;
    content: string;
  }>;
}

export interface SystemKPIs {
  openCasesCount: number;
  pendingDispatchCount: number;
  overdueCasesCount: number;
  inProgressByDept: Record<string, number>;
  avgFirstResponseHours: number;
  avgResolutionDays: number;
  defectTypeDistribution: Record<DefectType, number>;
  repeatIssueRate: number; // percentage
  verificationPassRate: number; // percentage
}
