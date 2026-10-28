import React, { useState } from 'react';
import { 
  DefectCase, 
  UserProfile, 
  CaseStatus, 
  DefectType, 
  SeverityLevel 
} from '../types/defect';
import { 
  STATUS_CONFIG, 
  SEVERITY_CONFIG, 
  DEFECT_TYPE_CONFIG, 
  CONTAINMENT_CONFIG, 
  canPerformAction 
} from '../utils/defectHelpers';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Wrench, 
  ShieldCheck, 
  RotateCcw, 
  Sparkles, 
  MessageSquare, 
  UserCheck, 
  History, 
  Send,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckSquare,
  Square,
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface CaseDetailViewProps {
  defectCase: DefectCase;
  currentUser: UserProfile;
  onBack: () => void;
  onOpenAcceptClassifyModal: () => void;
  onOpenReturnRevisionModal: () => void;
  onOpenDispatchModal: () => void;
  onOpenCauseAnalysisModal: () => void;
  onOpenQaVerificationModal: () => void;
  onOpenLineResumeModal: () => void;
  onOpenCloseCaseModal: () => void;
  onAddCollaborativeNote: (caseId: string, noteContent: string) => void;
  onToggleDispatchTask: (caseId: string, taskId: string) => void;
  onResubmitRevision: (caseId: string, supplementText: string) => void;
  onSubmitToQaVerification: (caseId: string) => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  defectCase,
  currentUser,
  onBack,
  onOpenAcceptClassifyModal,
  onOpenReturnRevisionModal,
  onOpenDispatchModal,
  onOpenCauseAnalysisModal,
  onOpenQaVerificationModal,
  onOpenLineResumeModal,
  onOpenCloseCaseModal,
  onAddCollaborativeNote,
  onToggleDispatchTask,
  onResubmitRevision,
  onSubmitToQaVerification
}) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'DISPATCH' | 'ANALYSIS' | 'QA' | 'REPORT' | 'TIMELINE'>('INFO');
  const [newNote, setNewNote] = useState('');
  const [revisionSupplement, setRevisionSupplement] = useState('');
  const [isGenerating8D, setIsGenerating8D] = useState(false);
  const [reportMarkdown, setReportMarkdown] = useState(defectCase.closure.closureReportMarkdown || '');

  const statusConf = STATUS_CONFIG[defectCase.status];
  const sevConf = SEVERITY_CONFIG[defectCase.severity];

  // Helper to request 8D report draft from server AI-006
  const handleGenerate8DReport = async () => {
    setIsGenerating8D(true);
    try {
      const res = await fetch('/api/ai/draft-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defectCase })
      });
      if (!res.ok) throw new Error('報告產生失敗');
      const data = await res.json();
      setReportMarkdown(data.markdownReport);
      defectCase.closure.closureReportMarkdown = data.markdownReport;
      defectCase.closure.checklist.reportReady = true;
    } catch (err) {
      console.error(err);
      alert('產生報告失敗，請檢查網路連線。');
    } finally {
      setIsGenerating8D(false);
    }
  };

  const handleSendNote = () => {
    if (!newNote.trim()) return;
    onAddCollaborativeNote(defectCase.id, newNote);
    setNewNote('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Bar: Return to list & Case Title */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回案件清單</span>
        </button>

        {/* Current user action authorization badge */}
        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <span>操作者身份：</span>
          <span className="font-semibold text-amber-400">{currentUser.name} ({currentUser.dept})</span>
        </div>
      </div>

      {/* Hero Dossier Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-lg font-mono font-bold text-amber-400">{defectCase.id}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                {statusConf.label}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${sevConf.badge}`}>
                等級：{sevConf.label}
              </span>
              {defectCase.closure.isRepeatIssue && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ⚠️ 重複發生異常 (FR-605)
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-white tracking-tight">
              {defectCase.productName} ({defectCase.productId}) · 機台 {defectCase.machineId}
            </h1>

            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>通報單位: <strong className="text-slate-200">{defectCase.reporterDept} ({defectCase.reporterName})</strong></span>
              <span>發生時間: <strong className="text-slate-200 font-mono">{defectCase.occurredAt.replace('T', ' ')}</strong></span>
              <span>異常分類: <strong className="text-slate-200">{DEFECT_TYPE_CONFIG[defectCase.defectType]?.label}</strong></span>
              <span>不良數量: <strong className="text-amber-400 font-mono">{defectCase.defectQuantity} {defectCase.unit}</strong></span>
            </p>
          </div>

          {/* Dynamic Workflow Action Buttons based on Role & Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* DISPATCHER: 受理與分類 (FR-101) & 退回補件 (FR-103) */}
            {defectCase.status === 'PENDING_CONFIRMATION' && canPerformAction(currentUser.role, 'ACCEPT_AND_CLASSIFY') && (
              <>
                <button
                  onClick={onOpenAcceptClassifyModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>審核受理與分類 (FR-101)</span>
                </button>
                <button
                  onClick={onOpenReturnRevisionModal}
                  className="px-4 py-2 bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700/60 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>退回補件 (FR-103)</span>
                </button>
              </>
            )}

            {/* DISPATCHER: 開立派工單 (FR-201) */}
            {defectCase.status === 'PENDING_DISPATCH' && canPerformAction(currentUser.role, 'DISPATCH') && (
              <button
                onClick={onOpenDispatchModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
              >
                <Wrench className="w-4 h-4" />
                <span>開立派工單 (FR-201)</span>
              </button>
            )}

            {/* OPERATOR: 補件後重送 (FR-103) */}
            {defectCase.status === 'REVISION_REQUIRED' && canPerformAction(currentUser.role, 'EDIT_REPORT_OR_RESUBMIT') && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="輸入補登說明（如：已補上錫膏批號與回溫卡照片）..."
                  value={revisionSupplement}
                  onChange={(e) => setRevisionSupplement(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 w-64"
                />
                <button
                  onClick={() => {
                    if (!revisionSupplement.trim()) return alert('請填寫補登資料說明');
                    onResubmitRevision(defectCase.id, revisionSupplement);
                    setRevisionSupplement('');
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all"
                >
                  補充資料並重新送出 (FR-103)
                </button>
              </div>
            )}

            {/* TECHNICIAN / ENGINEER: 原因分析與改善措施 (UI-04) */}
            {defectCase.status === 'IN_PROGRESS' && canPerformAction(currentUser.role, 'ANALYZE_AND_IMPROVE') && (
              <>
                <button
                  onClick={onOpenCauseAnalysisModal}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Wrench className="w-4 h-4" />
                  <span>UI-04 原因分析與改善</span>
                </button>
                <button
                  onClick={() => onSubmitToQaVerification(defectCase.id)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>提交品保驗證 (FR-503)</span>
                </button>
              </>
            )}

            {/* QA: 品質檢驗判定 (FR-505) */}
            {defectCase.status === 'PENDING_VERIFICATION' && canPerformAction(currentUser.role, 'VERIFY_QA') && (
              <button
                onClick={onOpenQaVerificationModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>執行品質檢驗判定 (FR-505)</span>
              </button>
            )}

            {/* SUPERVISOR: 復線核准 (FR-507) */}
            {!defectCase.lineResume.isApproved && canPerformAction(currentUser.role, 'APPROVE_RESUME') && (
              <button
                onClick={onOpenLineResumeModal}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>核准復線許可 (FR-507)</span>
              </button>
            )}

            {/* SUPERVISOR: 結案核准 (FR-603) */}
            {defectCase.status === 'PENDING_CLOSURE' && canPerformAction(currentUser.role, 'APPROVE_CLOSURE') && (
              <button
                onClick={onOpenCloseCaseModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>主管審查並核准結案 (FR-603)</span>
              </button>
            )}
          </div>
        </div>

        {/* Process Flow Breadcrumb bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[11px]">
          {[
            { step: '1. 現場通報', status: 'DRAFT', done: true },
            { step: '2. 受理確認', status: 'PENDING_CONFIRMATION', done: defectCase.status !== 'PENDING_CONFIRMATION' && defectCase.status !== 'REVISION_REQUIRED' },
            { step: '3. 分類派工', status: 'PENDING_DISPATCH', done: Boolean(defectCase.dispatch) },
            { step: '4. 原因與對策', status: 'IN_PROGRESS', done: Boolean(defectCase.investigation.rootCause) },
            { step: '5. 品質驗證', status: 'PENDING_VERIFICATION', done: defectCase.verification.verdict === 'PASSED' },
            { step: '6. 復線核准', status: 'LINE_RESUME', done: defectCase.lineResume.isApproved },
            { step: '7. 結案入庫', status: 'CLOSED', done: defectCase.status === 'CLOSED' },
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg border font-medium ${
                s.done
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <div className="text-[10px] text-slate-400 font-mono">STEP 0{idx + 1}</div>
              <div className="mt-0.5 truncate">{s.step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revision Notice Banner if in REVISION_REQUIRED state */}
      {defectCase.status === 'REVISION_REQUIRED' && (
        <div className="bg-rose-950/60 border border-rose-500/60 rounded-xl p-4 text-rose-200">
          <div className="flex items-start space-x-3">
            <RotateCcw className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-300">本案件已被受理人員退回待補件 (FR-103)</h4>
              <p className="text-xs text-rose-200/90 mt-1">
                退回原因：<strong className="text-white">{defectCase.revisionRequests[defectCase.revisionRequests.length - 1]?.reason}</strong>
              </p>
              <p className="text-[11px] text-rose-300/80 mt-1">
                請現場通報人員點擊上方「補充資料並重新送出」完成補件。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 border-b border-slate-800 text-xs overflow-x-auto pb-1">
        {[
          { key: 'INFO', label: '1. 異常通報與現場資訊' },
          { key: 'DISPATCH', label: '2. 派工與時效追蹤' },
          { key: 'ANALYSIS', label: '3. 原因分析與改善紀錄' },
          { key: 'QA', label: '4. 品質驗證與復線核准' },
          { key: 'REPORT', label: '5. 8D 結案總結報告 (FR-604)' },
          { key: 'TIMELINE', label: '6. 歷程紀錄與跨部門協作' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-t-lg font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Info & Field Attachments */}
      {activeTab === 'INFO' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">現場異常內容</h3>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-500 block">異常現象描述：</span>
                  <p className="text-slate-200 font-medium leading-relaxed mt-0.5">{defectCase.defectDesc}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500">標準工程規格：</span>
                    <span className="text-slate-200 font-mono block">{defectCase.specStandard || '未填寫'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">現場實際量測值：</span>
                    <span className="text-amber-400 font-mono block font-bold">{defectCase.actualMeasurement || '未量測'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="text-slate-500 block">現場初步處置方式：</span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${CONTAINMENT_CONFIG[defectCase.containment].tag}`}>
                    {CONTAINMENT_CONFIG[defectCase.containment].label}
                  </span>
                </div>
                {defectCase.remarks && (
                  <p className="text-slate-300 text-xs mt-2 italic">備註：{defectCase.remarks}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">現場照片與檢驗附件 (FR-006)</h3>
              {defectCase.attachments.length === 0 ? (
                <div className="bg-slate-950 p-8 rounded-lg border border-slate-800 text-center text-slate-500">
                  尚未上傳任何現場照片或三次元檢驗報告。
                </div>
              ) : (
                <div className="space-y-2">
                  {defectCase.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {att.name.endsWith('.pdf') ? (
                          <FileSpreadsheet className="w-5 h-5 text-rose-400 flex-shrink-0" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-sky-400 flex-shrink-0" />
                        )}
                        <div>
                          <div className="text-slate-200 font-medium">{att.name}</div>
                          <div className="text-[11px] text-slate-500">
                            大小: {att.size} | 上傳者: {att.uploadedBy} | 時間: {att.uploadedAt}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-amber-400 hover:underline cursor-pointer">
                        檢視附件
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Classification Info if present */}
              {defectCase.classification && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">受理分類依據 (FR-107)</span>
                    <span className="text-[10px] text-slate-500">
                      分類人員: {defectCase.classification.classifiedBy} ({defectCase.classification.classifiedAt.slice(0, 16)})
                    </span>
                  </div>
                  <p className="text-slate-400">{defectCase.classification.classificationBasis}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dispatch & SLA Tracking */}
      {activeTab === 'DISPATCH' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
          {!defectCase.dispatch ? (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <Clock className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm">本案尚未正式指派處理單位與承辦人。</p>
              {canPerformAction(currentUser.role, 'DISPATCH') && (
                <button
                  onClick={onOpenDispatchModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                >
                  立即開立派工單 (FR-201)
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500">派工單編號：</span>
                  <div className="text-base font-mono font-bold text-indigo-400">{defectCase.dispatch.workOrderNo}</div>
                  <div className="text-[11px] text-slate-500">
                    由 {defectCase.dispatch.dispatchedBy} 於 {defectCase.dispatch.dispatchedAt.slice(0, 16)} 派發
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500">負責單位與主承辦人：</span>
                  <div className="text-base font-bold text-slate-200">
                    {defectCase.dispatch.assignedDept} - {defectCase.dispatch.primaryAssignee}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    協辦成員: {defectCase.dispatch.collaborators.join(', ') || '無'}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500">SLA 時限與預計完成：</span>
                  <div className="text-base font-mono font-bold text-amber-400">
                    SLA {defectCase.dispatch.responseSLAHours} 小時內首回
                  </div>
                  <div className="text-[11px] text-slate-400">
                    預計結案: {defectCase.dispatch.targetCompletionDate.slice(0, 16)}
                  </div>
                </div>
              </div>

              {/* Task Checklist (FR-201) */}
              <div>
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">
                  派工分項工作任務清單 (FR-201)
                </h4>
                <div className="space-y-2">
                  {defectCase.dispatch.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onToggleDispatchTask(defectCase.id, task.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        task.completed
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className={task.completed ? 'line-through text-slate-400' : 'font-medium'}>
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                        執行者: {task.assignee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Cause Analysis & Countermeasure */}
      {activeTab === 'ANALYSIS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
              原因分析 (F04) 與製程改善措施 (F06)
            </h3>
            {canPerformAction(currentUser.role, 'ANALYZE_AND_IMPROVE') && (
              <button
                onClick={onOpenCauseAnalysisModal}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs"
              >
                編輯檢查紀錄與對策 (UI-04)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Investigation & Root Cause */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <span className="text-slate-400 font-semibold block">根本原因 (Root Cause)：</span>
                <p className="text-slate-200 leading-relaxed font-medium bg-slate-900 p-3 rounded border border-slate-800">
                  {defectCase.investigation.rootCause || '尚未填寫根本原因（調查中）'}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500">判定狀態：</span>
                  {defectCase.investigation.isRootCauseConfirmed ? (
                    <span className="text-emerald-400 font-semibold">✅ 根本原因已確認 (具支持證據)</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">⚠️ 原因待確認 (允許標記避免隨意推定)</span>
                  )}
                </div>
                {defectCase.investigation.basisEvidence && (
                  <div>
                    <span className="text-slate-500 block">判斷依據與支持數據：</span>
                    <p className="text-slate-300 mt-0.5">{defectCase.investigation.basisEvidence}</p>
                  </div>
                )}
              </div>

              {/* Inspection items list */}
              <div>
                <span className="text-slate-400 font-semibold block mb-2">現場檢查與排除紀錄 (FR-301, FR-306)：</span>
                {defectCase.investigation.inspectionItems.length === 0 ? (
                  <div className="text-slate-500 italic bg-slate-950 p-3 rounded">暫無具體檢測項目</div>
                ) : (
                  <div className="space-y-2">
                    {defectCase.investigation.inspectionItems.map((item) => (
                      <div key={item.id} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{item.item}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.result === 'NORMAL' ? 'bg-emerald-950 text-emerald-400' :
                            item.result === 'ABNORMAL' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.result === 'NORMAL' ? '正常' : item.result === 'ABNORMAL' ? '異常' : '待確認'}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          實測: <span className="font-mono text-amber-300">{item.measuredValue || 'N/A'}</span> (標準: {item.specStandard || 'N/A'})
                        </div>
                        <div className="text-slate-500 text-[11px]">{item.notes}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Improvement Plan (FR-501) */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <span className="text-slate-400 font-semibold block">永久改善措施 (Corrective Actions)：</span>
                <p className="text-slate-200 leading-relaxed font-medium bg-slate-900 p-3 rounded border border-slate-800 whitespace-pre-line">
                  {defectCase.improvement.description || '尚未制定改善措施'}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500">對策執行人：</span>
                    <span className="text-slate-200 block">{defectCase.improvement.executor || '未指派'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">預計完成時間：</span>
                    <span className="text-slate-200 block font-mono">{defectCase.improvement.targetDate ? defectCase.improvement.targetDate.slice(0, 16) : 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500">改善前基準 (FR-502)：</span>
                    <p className="text-rose-400 font-mono mt-0.5">{defectCase.improvement.preData || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">改善後結果 (FR-503)：</span>
                    <p className="text-emerald-400 font-mono mt-0.5">{defectCase.improvement.postData || '待執行'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500">標準作業修訂 (SOP / WI, FR-508)：</span>
                  <div className="mt-1 text-slate-300">
                    {defectCase.improvement.sopUpdateRequired ? (
                      <span className="text-emerald-400">✅ 需更新作業指導書：{defectCase.improvement.sopUpdateDetails}</span>
                    ) : (
                      <span>否 (維持既有規範)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: QA Verification & Line Resume */}
      {activeTab === 'QA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QA Verification Card */}
            <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  品質檢驗判定 (FR-504 ~ FR-506)
                </h4>
                {canPerformAction(currentUser.role, 'VERIFY_QA') && (
                  <button
                    onClick={onOpenQaVerificationModal}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold"
                  >
                    登錄檢驗結果
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500">驗證判定結果：</span>
                  <div className="mt-1">
                    {defectCase.verification.verdict === 'PASSED' && (
                      <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-700 rounded-full font-bold">
                        ✅ 檢驗合格通過 (PASSED)
                      </span>
                    )}
                    {defectCase.verification.verdict === 'FAILED' && (
                      <span className="px-3 py-1 bg-rose-950 text-rose-400 border border-rose-700 rounded-full font-bold">
                        ❌ 檢驗不合格退回 (FAILED)
                      </span>
                    )}
                    {defectCase.verification.verdict === 'SUPPLEMENT_NEEDED' && (
                      <span className="px-3 py-1 bg-amber-950 text-amber-400 border border-amber-700 rounded-full font-bold">
                        ⏳ 待補充檢驗數據 (PENDING)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">驗證標準與抽樣計畫 (FR-504)：</span>
                  <p className="text-slate-200 mt-0.5">{defectCase.verification.criteria}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500">抽樣數量：</span>
                    <span className="text-slate-200 block font-mono">{defectCase.verification.sampleQty} 件</span>
                  </div>
                  <div>
                    <span className="text-slate-500">品保判定人員：</span>
                    <span className="text-slate-200 block">{defectCase.verification.verifiedBy || '未指派'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">品保檢驗實測紀錄：</span>
                  <p className="text-slate-300 font-mono mt-0.5">{defectCase.verification.measurements || '待填寫'}</p>
                </div>

                {defectCase.verification.failureReason && (
                  <div className="bg-rose-950/40 p-3 rounded border border-rose-800 text-rose-300">
                    <strong className="block">不合格原因說明：</strong>
                    {defectCase.verification.failureReason}
                  </div>
                )}
              </div>
            </div>

            {/* Line Resume Card */}
            <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  復線核准程序 (FR-507)
                </h4>
                {!defectCase.lineResume.isApproved && canPerformAction(currentUser.role, 'APPROVE_RESUME') && (
                  <button
                    onClick={onOpenLineResumeModal}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold"
                  >
                    簽署復線核准
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500">機台復線狀態：</span>
                  <div className="mt-1">
                    {defectCase.lineResume.isApproved ? (
                      <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-700 rounded-full font-bold">
                        ✅ 准予復線連續量產
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-950 text-rose-400 border border-rose-700 rounded-full font-bold">
                        ⛔ 機台停線鎖定中
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">復線先決條件與簽核人：</span>
                  <p className="text-slate-200 mt-0.5">{defectCase.lineResume.conditions || '需品保連續樣品抽驗合格'}</p>
                  <div className="text-[11px] text-slate-400 mt-1">
                    核准主管: {defectCase.lineResume.approvedBy || '待主管簽核'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: 8D Closure Report */}
      {activeTab === 'REPORT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                8D 品質異常結案與防再發調查報告 (FR-604)
              </h3>
              <p className="text-slate-400 mt-0.5">
                系統依據通報、原因分析、改善措施與品質驗證自動彙整正式結案報告。
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleGenerate8DReport}
                disabled={isGenerating8D}
                className="px-3.5 py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-lg font-bold flex items-center space-x-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>{isGenerating8D ? 'AI 生成報告中...' : 'AI 彙整 8D 結案草稿 (AI-006)'}</span>
              </button>

              {canPerformAction(currentUser.role, 'APPROVE_CLOSURE') && defectCase.status !== 'CLOSED' && (
                <button
                  onClick={onOpenCloseCaseModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md transition-all"
                >
                  審查並結案 (FR-603)
                </button>
              )}
            </div>
          </div>

          {/* Closure 8 Requirements Checklist (FR-601) */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-semibold block mb-2">結案必要條件檢核表 (FR-601 驗收規範)：</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              {[
                { label: '異常資訊完整', ok: defectCase.closure.checklist.infoComplete },
                { label: '根本原因已分析', ok: defectCase.closure.checklist.rootCauseAnalyzed },
                { label: '改善對策已記錄', ok: defectCase.closure.checklist.countermeasuresLogged },
                { label: '品質驗證符合標準', ok: defectCase.closure.checklist.qaPassed },
                { label: '復線核准已簽署', ok: defectCase.closure.checklist.lineResumeDone },
                { label: '必要附件已上傳', ok: defectCase.closure.checklist.attachmentsReady },
                { label: '8D結案報告已完成', ok: Boolean(reportMarkdown) },
                { label: '主管已核准結案', ok: defectCase.closure.isApproved },
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-2 p-2 bg-slate-900 rounded border border-slate-800">
                  {item.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  )}
                  <span className={item.ok ? 'text-slate-200' : 'text-slate-500'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report Markdown Editor / Viewer */}
          <div>
            <textarea
              rows={16}
              value={reportMarkdown}
              onChange={(e) => setReportMarkdown(e.target.value)}
              placeholder="點擊上方「AI 彙整 8D 結案草稿」以自動產生完整 8D 報告..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      )}

      {/* Tab 6: Timeline Audit & Team Collaboration */}
      {activeTab === 'TIMELINE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Audit Timeline (FR-208) */}
            <div>
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <History className="w-4 h-4" />
                <span>處理歷程與稽核軌跡 (FR-208, NFR-002)</span>
              </h4>

              <div className="space-y-4 border-l-2 border-slate-800 ml-2 pl-4">
                {defectCase.timeline.map((t) => (
                  <div key={t.id} className="relative group">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute -left-[21px] top-1.5" />
                    <div className="text-[11px] text-slate-500 font-mono">{t.timestamp}</div>
                    <div className="text-slate-200 font-semibold mt-0.5">
                      {t.actor} ({t.actorRole}): {t.action}
                    </div>
                    {t.newStatus && (
                      <div className="text-[11px] text-amber-400/90 font-mono mt-0.5">
                        狀態更新為：{STATUS_CONFIG[t.newStatus]?.label}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Collaborative Notes (FR-207) */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>跨部門協同處置討論區 (FR-207)</span>
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {defectCase.collaborativeNotes.length === 0 ? (
                  <div className="text-slate-500 italic p-4 bg-slate-950 rounded">暫無協作留言</div>
                ) : (
                  defectCase.collaborativeNotes.map((note) => (
                    <div key={note.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-300">{note.author} ({note.authorRole})</span>
                        <span className="text-slate-500 font-mono">{note.timestamp}</span>
                      </div>
                      <p className="text-slate-200">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 flex space-x-2">
                <input
                  type="text"
                  placeholder="輸入協作留言或更新進度..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={handleSendNote}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>傳送</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
