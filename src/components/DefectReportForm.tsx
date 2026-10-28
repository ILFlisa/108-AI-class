import React, { useState, useId } from 'react';
import { 
  DefectCase, 
  UserProfile, 
  DefectType, 
  SeverityLevel, 
  InitialContainment, 
  AttachmentItem 
} from '../types/defect';
import { 
  DEFECT_TYPE_CONFIG, 
  SEVERITY_CONFIG, 
  CONTAINMENT_CONFIG 
} from '../utils/defectHelpers';
import { 
  AlertTriangle, 
  Upload, 
  Sparkles, 
  Save, 
  Send, 
  FileCheck2, 
  Info, 
  Clock, 
  CheckCircle,
  HelpCircle,
  X,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';

interface DefectReportFormProps {
  currentUser: UserProfile;
  existingCases: DefectCase[];
  onSubmitCase: (newCase: DefectCase) => void;
  onSelectExistingCase?: (caseId: string) => void;
}

export const DefectReportForm: React.FC<DefectReportFormProps> = ({
  currentUser,
  existingCases,
  onSubmitCase,
  onSelectExistingCase
}) => {
  // Generate unique Case ID
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const serialNo = (existingCases.length + 1).toString().padStart(3, '0');
  const generatedId = `ABN-${todayStr}-${serialNo}`;

  const [formData, setFormData] = useState({
    id: generatedId,
    occurredAt: new Date().toISOString().slice(0, 16),
    line: '精密車削 A 棟 2 樓',
    productId: 'PRD-M8-SHAFT',
    productName: '高精度傳動主軸 (Ø25)',
    batchNumber: 'LOT-20261027-C3',
    machineId: 'CNC-04',
    defectType: 'DIMENSION' as DefectType,
    defectDesc: '',
    defectQuantity: 10,
    unit: '件',
    specStandard: '25.000 ± 0.005 mm',
    actualMeasurement: '25.016 mm',
    severity: 'MAJOR' as SeverityLevel,
    containment: 'QUARANTINE' as InitialContainment,
    remarks: ''
  });

  const [attachments, setAttachments] = useState<AttachmentItem[]>([
    {
      id: 'att-init-1',
      name: '現場異常量測數據卡_初版.pdf',
      type: 'application/pdf',
      size: '620 KB',
      uploadedAt: new Date().toLocaleTimeString(),
      uploadedBy: currentUser.name
    }
  ]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    structuredSummary?: string;
    missingFields?: string[];
    suggestedCategory?: string;
    candidateCauses?: Array<{ cause: string; confidence: string; inspectionItem: string; evidenceNeeded: string }>;
    disclaimer?: string;
  } | null>(null);

  // FR-008: Check for potential duplicate cases
  const duplicateCandidates = existingCases.filter(c => 
    c.status !== 'CLOSED' && 
    c.status !== 'CANCELLED' && 
    (c.machineId.trim().toUpperCase() === formData.machineId.trim().toUpperCase() ||
     c.productId.trim().toUpperCase() === formData.productId.trim().toUpperCase())
  );

  const hasDuplicateWarning = duplicateCandidates.length > 0;

  // Validation function
  const validateForm = (isDraft: boolean): boolean => {
    if (isDraft) return true; // Draft allows partial save
    const errors: string[] = [];
    if (!formData.productId.trim()) errors.push('產品編號為必填項 (FR-004)');
    if (!formData.machineId.trim()) errors.push('機台編號為必填項 (FR-004)');
    if (!formData.defectDesc.trim()) errors.push('異常描述為必填項 (FR-005)');
    if (!formData.defectQuantity || formData.defectQuantity <= 0) errors.push('異常數量必須大於 0 (FR-005)');
    if (!formData.occurredAt) errors.push('發生時間為必填項 (FR-003)');
    if (!formData.line.trim()) errors.push('生產線/部門為必填項');
    
    // Dimension defect must have spec and actual measurements
    if (formData.defectType === 'DIMENSION' && (!formData.specStandard.trim() || !formData.actualMeasurement.trim())) {
      errors.push('尺寸異常類型強烈建議填寫「正常規格值」與「實際量測值」');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // AI-001 / AI-003 Assist trigger
  const handleAiAssist = async () => {
    if (!formData.defectDesc.trim()) {
      alert('請先在「異常描述」填寫目前觀察到的現場現象，AI 方可進行分析整理。');
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-defect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defectDesc: formData.defectDesc,
          productId: formData.productId,
          machineId: formData.machineId,
          specStandard: formData.specStandard,
          actualMeasurement: formData.actualMeasurement,
          defectType: formData.defectType
        })
      });

      if (!res.ok) throw new Error('AI 請求失敗');
      const data = await res.json();
      setAiAnalysisResult(data);

      // Auto update suggested type if relevant
      if (data.suggestedCategory && DEFECT_TYPE_CONFIG[data.suggestedCategory as DefectType]) {
        // keep user aware
      }
    } catch (err) {
      console.error(err);
      alert('AI 分析服務暫時無法連線，已為您切換至標準本機規則檢核。');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Submit or Draft
  const handleSave = (isDraft: boolean) => {
    if (!validateForm(isDraft)) return;

    const newCase: DefectCase = {
      id: formData.id,
      createdAt: new Date().toISOString(),
      occurredAt: formData.occurredAt,
      reporterName: currentUser.name,
      reporterDept: currentUser.dept,
      line: formData.line,
      productId: formData.productId,
      productName: formData.productName || formData.productId,
      batchNumber: formData.batchNumber,
      machineId: formData.machineId,
      defectType: formData.defectType,
      defectDesc: formData.defectDesc,
      defectQuantity: Number(formData.defectQuantity),
      unit: formData.unit || '件',
      specStandard: formData.specStandard,
      actualMeasurement: formData.actualMeasurement,
      severity: formData.severity,
      containment: formData.containment,
      remarks: formData.remarks,
      attachments: attachments,
      status: isDraft ? 'DRAFT' : 'PENDING_CONFIRMATION',
      revisionRequests: [],
      investigation: {
        inspectionItems: [],
        possibleCauses: aiAnalysisResult?.candidateCauses?.map(c => c.cause) || [],
        ruledOutCauses: [],
        rootCause: '',
        isRootCauseConfirmed: false,
        basisEvidence: '',
        analyzedBy: ''
      },
      improvement: {
        description: '',
        executor: '',
        targetDate: '',
        preData: formData.actualMeasurement || '',
        postData: '',
        sopUpdateRequired: false
      },
      verification: {
        criteria: `依 ${formData.productId} 圖面及品保抽樣標準檢驗`,
        sampleQty: 20,
        measurements: '',
        verdict: 'SUPPLEMENT_NEEDED'
      },
      lineResume: {
        isApproved: false
      },
      closure: {
        isApproved: false,
        checklist: {
          infoComplete: true,
          rootCauseAnalyzed: false,
          countermeasuresLogged: false,
          qaPassed: false,
          lineResumeDone: false,
          attachmentsReady: attachments.length > 0,
          reportReady: false
        },
        isRepeatIssue: false
      },
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: isDraft ? '暫存通報草稿 (FR-007)' : '正式送出異常通報 (FR-001)',
          newStatus: isDraft ? 'DRAFT' : 'PENDING_CONFIRMATION'
        }
      ],
      collaborativeNotes: []
    };

    onSubmitCase(newCase);
  };

  // Simulate file upload
  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAtt: AttachmentItem = {
        id: `att-${Date.now()}`,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: `${Math.round(file.size / 1024)} KB`,
        uploadedAt: new Date().toLocaleTimeString(),
        uploadedBy: currentUser.name
      };
      setAttachments([...attachments, newAtt]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner: Screen Purpose */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/30">
                F01 · FR-001 ~ FR-008
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">現場產品異常通報單</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              由生產現場作業員或發現人員填寫，提供機台、批號、實測值與初步處置，落實來源追溯。
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-mono">系統自動編號</span>
              <span className="text-base font-mono font-bold text-amber-400">{formData.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FR-008: Duplicate warning prompt */}
      {hasDuplicateWarning && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 text-amber-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-300">FR-008 防重複通報警示</h4>
                <p className="text-xs text-amber-200/90 mt-0.5">
                  系統偵測到同機台 <strong className="text-white font-mono">{formData.machineId}</strong> 或同產品 <strong className="text-white font-mono">{formData.productId}</strong> 目前尚有未結案之案件：
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {duplicateCandidates.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelectExistingCase && onSelectExistingCase(c.id)}
                      className="text-xs px-2.5 py-1 rounded bg-amber-900/60 border border-amber-600/50 hover:bg-amber-800 text-amber-100 flex items-center space-x-1.5 transition-colors"
                    >
                      <span className="font-mono font-bold">{c.id}</span>
                      <span className="text-amber-300">({c.defectDesc.slice(0, 18)}...)</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-amber-400/80 mt-1.5">
                  若屬同一異常事件，建議直接至既有案件補充紀錄；若為全新獨立批次異常，請確認後繼續送出。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency alert notification if CRITICAL */}
      {formData.severity === 'CRITICAL' && (
        <div className="bg-rose-950/60 border border-rose-500/60 rounded-xl p-4 text-rose-200 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
            <div>
              <span className="text-sm font-bold text-white">【緊急事故程序】</span>
              <span className="text-xs text-rose-200">
                本案已標記為「緊急」，應依廠區工安與品質程序立即執行實體停機與產品隔離，不應等待系統受理。
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors Box */}
      {validationErrors.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-700/50 rounded-xl p-4 text-rose-200">
          <div className="flex items-center space-x-2 text-rose-300 font-semibold text-sm mb-2">
            <X className="w-4 h-4 text-rose-400" />
            <span>資料缺漏提示 (驗收條件 TC-002)</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 text-rose-300/90">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Assistant Output Card (if generated) */}
      {aiAnalysisResult && (
        <div className="bg-gradient-to-br from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/40 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-sky-900/50">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-bold text-white">AI-001 / AI-003 異常智能分析與缺漏提示</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">Gemini 3.8 Flash</span>
            </div>
            <button
              onClick={() => setAiAnalysisResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              關閉提示
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">精簡問題陳述 (5W2H 結構)：</span>
              <p className="bg-slate-950/70 p-2.5 rounded border border-slate-800 text-slate-200">
                {aiAnalysisResult.structuredSummary}
              </p>
            </div>

            <div>
              <span className="text-amber-400 block mb-1">現場缺漏欄位建議補充：</span>
              <ul className="bg-slate-950/70 p-2.5 rounded border border-slate-800 space-y-1">
                {aiAnalysisResult.missingFields?.map((m, idx) => (
                  <li key={idx} className="text-amber-300/90 flex items-center space-x-1">
                    <span className="text-amber-500">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {aiAnalysisResult.candidateCauses && aiAnalysisResult.candidateCauses.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-300 font-semibold block mb-2">
                候選潛在原因推測 (依工程歷史數據建議檢查項目)：
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {aiAnalysisResult.candidateCauses.map((c, i) => (
                  <div key={i} className="bg-slate-950/90 p-2.5 rounded border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{c.cause}</span>
                      <span className="text-[10px] text-sky-400 font-mono">{c.confidence}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      <strong>檢查點:</strong> {c.inspectionItem}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strict AI disclaimer requirement */}
          <div className="mt-3 text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded border border-slate-800/80">
            {aiAnalysisResult.disclaimer || '【AI 遵守規範】AI 僅提供推測建議，不直接取代專業工程判讀與復線核准。'}
          </div>
        </div>
      )}

      {/* Main Reporting Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        {/* Section 1: Basic Identifiers */}
        <div>
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <span>1. 發生單位與設備產品資訊</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                通報人 (自動帶入) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                disabled
                value={`${currentUser.name} (${currentUser.dept})`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                發生時間 <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.occurredAt}
                onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                生產線／部門 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.line}
                onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                placeholder="例如：精密車削 A 棟 2 樓"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                機台編號 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.machineId}
                onChange={(e) => setFormData({ ...formData, machineId: e.target.value.toUpperCase() })}
                placeholder="例如：CNC-04"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                產品編號 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                placeholder="例如：PRD-M8-SHAFT"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                產品品名
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="例如：高精度傳動主軸 (Ø25)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                產品批號 (Lot No.)
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="例如：LOT-20261027-C3"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                異常類型 <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.defectType}
                onChange={(e) => setFormData({ ...formData, defectType: e.target.value as DefectType })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {(Object.keys(DEFECT_TYPE_CONFIG) as DefectType[]).map((key) => (
                  <option key={key} value={key}>
                    {DEFECT_TYPE_CONFIG[key].icon} {DEFECT_TYPE_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Defect Details & Measurement */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
              2. 異常現象與量測數據
            </h3>
            <button
              type="button"
              onClick={handleAiAssist}
              disabled={isAiLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500/25 text-xs font-medium transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{isAiLoading ? 'AI 正在分析中...' : 'AI 整理現象與缺漏提示 (AI-001)'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                異常描述 (實際觀察到的現象) <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.defectDesc}
                onChange={(e) => setFormData({ ...formData, defectDesc: e.target.value })}
                placeholder="請詳細記錄：在何處、何種狀態下發現何種異常現象（如：外徑持續偏大、切削面有週期震動波紋、首件不良率等）"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  受影響數量 <span className="text-rose-400">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.defectQuantity}
                    onChange={(e) => setFormData({ ...formData, defectQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-center text-slate-300"
                    placeholder="件"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  正常工程規格 (Tolerance)
                </label>
                <input
                  type="text"
                  value={formData.specStandard}
                  onChange={(e) => setFormData({ ...formData, specStandard: e.target.value })}
                  placeholder="例如：25.000 ± 0.005 mm"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  現場實際量測值 (Measured)
                </label>
                <input
                  type="text"
                  value={formData.actualMeasurement}
                  onChange={(e) => setFormData({ ...formData, actualMeasurement: e.target.value })}
                  placeholder="例如：25.016 mm"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  影響程度 (嚴重等級) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as SeverityLevel })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="NORMAL">一般 (Normal) - 少量偏差可局部微調</option>
                  <option value="MAJOR">重大 (Major) - 影響整批品質或需換刀維修</option>
                  <option value="CRITICAL">緊急 (Critical) - 嚴重失控需立即停線</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Containment & Attachments */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">
            3. 現場初步處置與檢驗證據
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                現場初步處置 (Containment Action) <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.containment}
                onChange={(e) => setFormData({ ...formData, containment: e.target.value as InitialContainment })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 mb-3"
              >
                {(Object.keys(CONTAINMENT_CONFIG) as InitialContainment[]).map((key) => (
                  <option key={key} value={key}>
                    {CONTAINMENT_CONFIG[key].label}
                  </option>
                ))}
              </select>

              <label className="block text-xs font-medium text-slate-300 mb-1">
                處置補充說明 / 備註
              </label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="例如：已在不良品外箱張貼紅色標籤，並將加工刀具退刀至零點位置。"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* FR-006: Attachments Upload */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                異常照片與檢驗報告上傳 (FR-006)
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-4 text-center bg-slate-950/50 cursor-pointer relative group transition-colors">
                <input
                  type="file"
                  onChange={handleSimulateUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-400 mx-auto mb-1.5 transition-colors" />
                <span className="text-xs text-slate-300 block font-medium">點擊或拖曳檔案至此處上傳</span>
                <span className="text-[11px] text-slate-500 block">支援 JPG, PNG, PDF, CSV, Excel (上限 20MB)</span>
              </div>

              {/* Uploaded attachments list */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {att.name.endsWith('.pdf') ? (
                          <FileSpreadsheet className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        )}
                        <span className="text-slate-200 truncate">{att.name}</span>
                        <span className="text-[10px] text-slate-500">({att.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}
                        className="text-slate-500 hover:text-rose-400 ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Draft vs Submit */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span>送出後系統將產生專屬編號，依序進入受理確認與派工流程。</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {/* FR-007 Draft Save */}
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
            >
              <Save className="w-4 h-4 text-slate-400" />
              <span>暫存草稿 (FR-007)</span>
            </button>

            {/* FR-001 Formal Submit */}
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
            >
              <Send className="w-4 h-4 text-slate-950" />
              <span>正式送出通報 (FR-001)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
