import React, { useState } from 'react';
import { 
  DefectCase, 
  UserProfile, 
  DefectType, 
  SeverityLevel 
} from '../types/defect';
import { 
  DEFECT_TYPE_CONFIG 
} from '../utils/defectHelpers';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Wrench, 
  ShieldCheck, 
  FileCheck,
  Plus,
  Trash2
} from 'lucide-react';

// ==========================================
// 1. Accept & Classify Modal (FR-101 ~ FR-107)
// ==========================================
interface AcceptClassifyModalProps {
  defectCase: DefectCase;
  currentUser: UserProfile;
  onClose: () => void;
  onConfirm: (updatedCase: DefectCase) => void;
}

export const AcceptClassifyModal: React.FC<AcceptClassifyModalProps> = ({
  defectCase,
  currentUser,
  onClose,
  onConfirm
}) => {
  const [category, setCategory] = useState<DefectType>(defectCase.defectType);
  const [priority, setPriority] = useState<SeverityLevel>(defectCase.severity);
  const [responsibleDept, setResponsibleDept] = useState(
    DEFECT_TYPE_CONFIG[defectCase.defectType]?.dept || '設備維修課'
  );
  const [basis, setBasis] = useState(
    `依通報現象，初步判定為「${DEFECT_TYPE_CONFIG[defectCase.defectType]?.label}」，指派由 ${responsibleDept} 主導進一步調查。`
  );

  const handleSubmit = () => {
    const updated: DefectCase = {
      ...defectCase,
      status: 'PENDING_DISPATCH',
      classification: {
        category,
        priority,
        responsibleDept,
        classifiedBy: currentUser.name,
        classifiedAt: new Date().toISOString(),
        classificationBasis: basis
      },
      timeline: [
        ...defectCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: `受理案件並分類為【${DEFECT_TYPE_CONFIG[category].label}】，指派責任單位【${responsibleDept}】(FR-101~106)`,
          previousStatus: defectCase.status,
          newStatus: 'PENDING_DISPATCH'
        }
      ]
    };
    onConfirm(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">案件審核受理與分類 (FR-101 ~ FR-106)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">核定異常分類 (FR-104)</label>
            <select
              value={category}
              onChange={(e) => {
                const newCat = e.target.value as DefectType;
                setCategory(newCat);
                setResponsibleDept(DEFECT_TYPE_CONFIG[newCat]?.dept || '相關權責單位');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
            >
              {(Object.keys(DEFECT_TYPE_CONFIG) as DefectType[]).map((k) => (
                <option key={k} value={k}>
                  {DEFECT_TYPE_CONFIG[k].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">指派主責處理部門 (FR-106)</label>
            <input
              type="text"
              value={responsibleDept}
              onChange={(e) => setResponsibleDept(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">處理優先級 (FR-105)</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SeverityLevel)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
            >
              <option value="NORMAL">一般 (Normal) - 依標準排程處置</option>
              <option value="MAJOR">重大 (Major) - 影響產能，需限時回覆</option>
              <option value="CRITICAL">緊急 (Critical) - 立即停機派工排查</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">分類依據與判斷紀錄 (FR-107)</label>
            <textarea
              rows={3}
              value={basis}
              onChange={(e) => setBasis(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
            取消
          </button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg">
            正式受理並轉至待派工
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. Return for Revision Modal (FR-103)
// ==========================================
interface ReturnRevisionModalProps {
  defectCase: DefectCase;
  currentUser: UserProfile;
  onClose: () => void;
  onConfirm: (updatedCase: DefectCase) => void;
}

export const ReturnRevisionModal: React.FC<ReturnRevisionModalProps> = ({
  defectCase,
  currentUser,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('資料不完整：請補充產品精確批號、發生時機台加工參數設定值，以及清晰的異常照片。');

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('請務必填寫退回補件原因 (FR-103)');
      return;
    }

    const updated: DefectCase = {
      ...defectCase,
      status: 'REVISION_REQUIRED',
      revisionRequests: [
        ...defectCase.revisionRequests,
        {
          id: `rev-${Date.now()}`,
          requestedAt: new Date().toISOString(),
          requestedBy: `${currentUser.name} (${currentUser.dept})`,
          reason
        }
      ],
      timeline: [
        ...defectCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: `退回案件要求通報人補件 (FR-103)：${reason}`,
          previousStatus: defectCase.status,
          newStatus: 'REVISION_REQUIRED'
        }
      ]
    };

    onConfirm(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-rose-900/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">退回補件通知 (FR-103)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-300">
          案件資料不足時，可退回通報現場人員補充，並完整保留退回補件歷史紀錄。
        </p>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">退回補件原因 (必填) <span className="text-rose-400">*</span></label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
            取消
          </button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg">
            確定退回待補件
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. Dispatch Work Order Modal (FR-201 ~ FR-203)
// ==========================================
interface DispatchModalProps {
  defectCase: DefectCase;
  currentUser: UserProfile;
  onClose: () => void;
  onConfirm: (updatedCase: DefectCase) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  defectCase,
  currentUser,
  onClose,
  onConfirm
}) => {
  const [assignedDept, setAssignedDept] = useState(
    defectCase.classification?.responsibleDept || '設備維修課'
  );
  const [primaryAssignee, setPrimaryAssignee] = useState('王大明 (資深維修工程師)');
  const [collaborator, setCollaborator] = useState('李立宏 (製程工程師)');
  const [slaHours, setSlaHours] = useState(2);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  const [tasks, setTasks] = useState([
    { id: 't-1', title: '現場實體拆檢與機構幾何精度量測', completed: false, assignee: '王大明' },
    { id: 't-2', title: '檢查製程刀具磨損與切削液冷卻流量', completed: false, assignee: '李立宏' }
  ]);

  const handleSubmit = () => {
    const updated: DefectCase = {
      ...defectCase,
      status: 'IN_PROGRESS',
      dispatch: {
        workOrderNo: `WO-${Date.now().toString().slice(-6)}`,
        assignedDept,
        primaryAssignee,
        collaborators: collaborator ? [collaborator] : [],
        responseSLAHours: slaHours,
        targetCompletionDate: targetDate,
        dispatchedBy: currentUser.name,
        dispatchedAt: new Date().toISOString(),
        firstResponseAt: new Date().toISOString(),
        tasks
      },
      timeline: [
        ...defectCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: `開立派工單指派 ${assignedDept} / ${primaryAssignee} (SLA: ${slaHours}h)`,
          previousStatus: defectCase.status,
          newStatus: 'IN_PROGRESS'
        }
      ]
    };

    onConfirm(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">開立派工單與指派人員 (FR-201 ~ FR-203)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">承辦部門 (FR-202)</label>
              <input
                type="text"
                value={assignedDept}
                onChange={(e) => setAssignedDept(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">主承辦人 (FR-202)</label>
              <input
                type="text"
                value={primaryAssignee}
                onChange={(e) => setPrimaryAssignee(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">協作人員 (FR-207)</label>
              <input
                type="text"
                value={collaborator}
                onChange={(e) => setCollaborator(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">首次回覆 SLA (小時)</label>
              <input
                type="number"
                min="1"
                value={slaHours}
                onChange={(e) => setSlaHours(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">預計完成期限 (FR-203)</label>
            <input
              type="datetime-local"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
            取消
          </button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg">
            發布派工並進入處理中
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. QA Verification Modal (FR-504 ~ FR-506, TC-007)
// ==========================================
interface QaVerificationModalProps {
  defectCase: DefectCase;
  currentUser: UserProfile;
  onClose: () => void;
  onConfirm: (updatedCase: DefectCase) => void;
}

export const QaVerificationModal: React.FC<QaVerificationModalProps> = ({
  defectCase,
  currentUser,
  onClose,
  onConfirm
}) => {
  const [verdict, setVerdict] = useState<'PASSED' | 'FAILED' | 'SUPPLEMENT_NEEDED'>('PASSED');
  const [criteria, setCriteria] = useState(
    defectCase.verification.criteria || `以工程圖面規範連續抽驗 30 件，全尺寸合格且 Cpk >= 1.33`
  );
  const [sampleQty, setSampleQty] = useState(defectCase.verification.sampleQty || 30);
  const [measurements, setMeasurements] = useState('實測 30 件尺寸均落於允收公差內，標準差 σ=0.0012mm，外觀無瑕疵。');
  const [failureReason, setFailureReason] = useState('');

  const handleSubmit = () => {
    // If failed, revert to IN_PROGRESS per TC-007 requirement
    const isPassed = verdict === 'PASSED';
    const nextStatus = isPassed ? 'PENDING_CLOSURE' : (verdict === 'FAILED' ? 'IN_PROGRESS' : 'PENDING_VERIFICATION');

    const updated: DefectCase = {
      ...defectCase,
      status: nextStatus,
      verification: {
        criteria,
        sampleQty,
        measurements,
        verdict,
        verifiedBy: currentUser.name,
        verifiedAt: new Date().toISOString(),
        failureReason: verdict === 'FAILED' ? failureReason : undefined
      },
      closure: {
        ...defectCase.closure,
        checklist: {
          ...defectCase.closure.checklist,
          qaPassed: isPassed
        }
      },
      timeline: [
        ...defectCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: isPassed
            ? '品質驗證判定【合格通過 (PASSED)】(FR-505)'
            : `品質驗證判定【不通過 (FAILED)】(FR-506)，退回處理中：${failureReason}`,
          previousStatus: defectCase.status,
          newStatus: nextStatus
        }
      ]
    };

    onConfirm(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-purple-900/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">品保檢驗判定與放行審查 (FR-504 ~ FR-506)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">判定結果 (FR-505) <span className="text-rose-400">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVerdict('PASSED')}
                className={`py-2 rounded-lg font-bold border transition-colors ${
                  verdict === 'PASSED'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400'
                }`}
              >
                ✅ 通過 (PASSED)
              </button>
              <button
                type="button"
                onClick={() => setVerdict('FAILED')}
                className={`py-2 rounded-lg font-bold border transition-colors ${
                  verdict === 'FAILED'
                    ? 'bg-rose-950 border-rose-500 text-rose-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400'
                }`}
              >
                ❌ 不通過 (退回)
              </button>
              <button
                type="button"
                onClick={() => setVerdict('SUPPLEMENT_NEEDED')}
                className={`py-2 rounded-lg font-bold border transition-colors ${
                  verdict === 'SUPPLEMENT_NEEDED'
                    ? 'bg-amber-950 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400'
                }`}
              >
                ⏳ 待補充資料
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">檢驗驗證標準 (FR-504)</label>
            <input
              type="text"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">抽樣件數</label>
              <input
                type="number"
                value={sampleQty}
                onChange={(e) => setSampleQty(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">檢驗人</label>
              <input
                type="text"
                disabled
                value={currentUser.name}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">品保實測數值紀錄</label>
            <textarea
              rows={3}
              value={measurements}
              onChange={(e) => setMeasurements(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
            />
          </div>

          {verdict === 'FAILED' && (
            <div className="bg-rose-950/40 p-3 rounded-lg border border-rose-800 space-y-1">
              <label className="block text-rose-300 font-bold">
                驗證失敗原因 (FR-506, 案件將自動退回「處理中」)
              </label>
              <textarea
                rows={2}
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="請說明未通過規格、抽檢不良數或製程能力不足之處..."
                className="w-full bg-slate-950 border border-rose-700 rounded p-2 text-rose-200"
              />
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
            取消
          </button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg">
            登錄檢驗結果
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. Line Resume Modal (FR-507)
// ==========================================
interface LineResumeModalProps {
  defectCase: DefectCase;
  currentUser: UserProfile;
  onClose: () => void;
  onConfirm: (updatedCase: DefectCase) => void;
}

export const LineResumeModal: React.FC<LineResumeModalProps> = ({
  defectCase,
  currentUser,
  onClose,
  onConfirm
}) => {
  const [conditions, setConditions] = useState('已完成首件 30 顆尺寸全檢合格，防誤裝置與刀具壽命設定已生效，准予復線量產。');

  const handleSubmit = () => {
    const updated: DefectCase = {
      ...defectCase,
      lineResume: {
        isApproved: true,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString(),
        conditions
      },
      closure: {
        ...defectCase.closure,
        checklist: {
          ...defectCase.closure.checklist,
          lineResumeDone: true
        }
      },
      timeline: [
        ...defectCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: `生產主管簽核【復線核准許可】(FR-507)：${conditions}`
        }
      ]
    };

    onConfirm(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-teal-900/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">復線核准程序 (FR-507)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-300">
          依公司權責及品質制度，確認安全條件與品質驗證合格後，由生產主管簽發復線許可。
        </p>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">復線簽核條件與備註說明</label>
          <textarea
            rows={4}
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
            取消
          </button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg">
            正式簽署復線核准
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. Close Case Modal (FR-601 ~ FR-604, TC-008, TC-009)
// ==========================================
interface CloseCaseModalProps {
  defectCase: DefectCase;
  currentUser: UserProfile;
  onClose: () => void;
  onConfirm: (updatedCase: DefectCase) => void;
}

export const CloseCaseModal: React.FC<CloseCaseModalProps> = ({
  defectCase,
  currentUser,
  onClose,
  onConfirm
}) => {
  const [approvalRemarks, setApprovalRemarks] = useState('原因調查詳實，改善措施具體，品保驗證合格且完成 SOP 更新，同意本案正式結案歸檔。');
  const [isRepeatIssue, setIsRepeatIssue] = useState(defectCase.closure.isRepeatIssue || false);
  const [linkedPriorCaseId, setLinkedPriorCaseId] = useState(defectCase.closure.linkedPriorCaseId || '');

  // TC-008: Check critical conditions
  const isQaPassed = defectCase.verification?.verdict === 'PASSED';
  const hasRootCause = Boolean(defectCase.investigation?.rootCause);
  const hasImprovement = Boolean(defectCase.improvement?.description);

  const canClose = isQaPassed && hasRootCause && hasImprovement;

  const handleSubmit = () => {
    if (!canClose) {
      alert('【TC-008 結案規則限制】未完成必要品質驗證或未記錄原因/對策，系統阻止結案！');
      return;
    }

    const updated: DefectCase = {
      ...defectCase,
      status: 'CLOSED',
      closure: {
        isApproved: true,
        approvedBy: currentUser.name,
        approvedAt: new Date().toISOString(),
        approvalRemarks,
        checklist: {
          infoComplete: true,
          rootCauseAnalyzed: true,
          countermeasuresLogged: true,
          qaPassed: true,
          lineResumeDone: true,
          attachmentsReady: true,
          reportReady: true
        },
        isRepeatIssue,
        linkedPriorCaseId
      },
      timeline: [
        ...defectCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: `主管完成結案簽核審查 (FR-603)：${approvalRemarks}`,
          previousStatus: defectCase.status,
          newStatus: 'CLOSED'
        }
      ]
    };

    onConfirm(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-900/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">主管結案審查與正式歸檔 (FR-601 ~ FR-604)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Alert if not ready (TC-008) */}
        {!canClose && (
          <div className="bg-rose-950/50 border border-rose-800 p-3 rounded-lg text-rose-300 space-y-1">
            <div className="flex items-center space-x-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>未滿足結案必要條件 (TC-008)</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-rose-300/90">
              {!isQaPassed && <li>品質驗證尚未判定為「合格通過」</li>}
              {!hasRootCause && <li>尚未記錄根本原因分析</li>}
              {!hasImprovement && <li>尚未記錄永久改善措施</li>}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">主管結案審查意見 (FR-603)</label>
            <textarea
              rows={3}
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRepeatIssue}
                onChange={(e) => setIsRepeatIssue(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="font-semibold text-slate-200">
                本案標記為「重複異常問題」(FR-605 納入復發統計)
              </span>
            </label>

            {isRepeatIssue && (
              <input
                type="text"
                placeholder="關聯之先前歷史案件編號 (例如：ABN-20260912-003)..."
                value={linkedPriorCaseId}
                onChange={(e) => setLinkedPriorCaseId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 text-xs"
              />
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canClose}
            className={`px-5 py-2 font-bold rounded-lg text-white shadow-md ${
              canClose ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            核准結案並納入歷史庫
          </button>
        </div>
      </div>
    </div>
  );
};
