import React, { useState } from 'react';
import { DefectCase, InspectionRecord, UserProfile } from '../types/defect';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Save,
  Wrench
} from 'lucide-react';

interface CauseAnalysisModalProps {
  defectCase: DefectCase;
  currentUser: UserProfile;
  onClose: () => void;
  onSave: (updatedCase: DefectCase) => void;
}

export const CauseAnalysisModal: React.FC<CauseAnalysisModalProps> = ({
  defectCase,
  currentUser,
  onClose,
  onSave
}) => {
  const [inspectionItems, setInspectionItems] = useState<InspectionRecord[]>(
    defectCase.investigation.inspectionItems.length > 0
      ? defectCase.investigation.inspectionItems
      : [
          {
            id: 'item-1',
            item: '主軸軸承靜態與動態跳動量測',
            result: 'ABNORMAL',
            measuredValue: '+0.015 mm',
            specStandard: '< 0.005 mm',
            toolUsed: '千分量表 / 雷射干涉儀',
            notes: '前軸承座溫升過高，動態偏擺超標'
          }
        ]
  );

  const [rootCause, setRootCause] = useState(defectCase.investigation.rootCause);
  const [isRootCauseConfirmed, setIsRootCauseConfirmed] = useState(defectCase.investigation.isRootCauseConfirmed);
  const [basisEvidence, setBasisEvidence] = useState(defectCase.investigation.basisEvidence);
  
  // Improvement plan fields
  const [improvementDesc, setImprovementDesc] = useState(defectCase.improvement.description);
  const [executor, setExecutor] = useState(defectCase.improvement.executor || currentUser.name);
  const [targetDate, setTargetDate] = useState(defectCase.improvement.targetDate || new Date().toISOString().slice(0, 16));
  const [preData, setPreData] = useState(defectCase.improvement.preData || defectCase.actualMeasurement || '');
  const [postData, setPostData] = useState(defectCase.improvement.postData || '');
  const [sopUpdateRequired, setSopUpdateRequired] = useState(defectCase.improvement.sopUpdateRequired);
  const [sopUpdateDetails, setSopUpdateDetails] = useState(defectCase.improvement.sopUpdateDetails || '');

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Add new inspection item
  const handleAddItem = () => {
    const newItem: InspectionRecord = {
      id: `item-${Date.now()}`,
      item: '',
      result: 'PENDING',
      measuredValue: '',
      specStandard: '',
      toolUsed: '',
      notes: ''
    };
    setInspectionItems([...inspectionItems, newItem]);
  };

  // Remove inspection item
  const handleRemoveItem = (id: string) => {
    setInspectionItems(inspectionItems.filter(i => i.id !== id));
  };

  // AI-003 Cause assistant
  const handleAiSuggestCauses = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-defect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defectDesc: defectCase.defectDesc,
          productId: defectCase.productId,
          machineId: defectCase.machineId,
          specStandard: defectCase.specStandard,
          actualMeasurement: defectCase.actualMeasurement,
          defectType: defectCase.defectType
        })
      });
      if (!res.ok) throw new Error('AI 分析失敗');
      const data = await res.json();
      if (data.candidateCauses) {
        setAiSuggestions(data.candidateCauses);
      }
    } catch (err) {
      console.error(err);
      alert('AI 服務暫時無法取得候選原因，請由現場專業工程人員填寫。');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveAll = () => {
    const updated: DefectCase = {
      ...defectCase,
      investigation: {
        ...defectCase.investigation,
        inspectionItems,
        rootCause,
        isRootCauseConfirmed,
        basisEvidence,
        analyzedBy: currentUser.name,
        confirmedBy: isRootCauseConfirmed ? currentUser.name : undefined,
        confirmedAt: isRootCauseConfirmed ? new Date().toISOString() : undefined
      },
      improvement: {
        ...defectCase.improvement,
        description: improvementDesc,
        executor,
        targetDate,
        preData,
        postData,
        sopUpdateRequired,
        sopUpdateDetails
      },
      closure: {
        ...defectCase.closure,
        checklist: {
          ...defectCase.closure.checklist,
          rootCauseAnalyzed: Boolean(rootCause),
          countermeasuresLogged: Boolean(improvementDesc)
        }
      },
      timeline: [
        ...defectCase.timeline,
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          actor: currentUser.name,
          actorRole: currentUser.role,
          action: '更新異常原因分析 (F04) 與製程改善措施 (F06)'
        }
      ]
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">UI-04 原因分析與製程改善 (F04, F06)</h3>
                <span className="text-xs font-mono font-bold text-amber-400">{defectCase.id}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                標準調查程序：落實點檢項目與數據量測，避免未明原因就隨意處置。
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 text-xs flex-1">
          {/* AI-003 Suggestion Section */}
          <div className="bg-sky-950/30 border border-sky-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sky-300">AI-003 智慧候選原因與檢查指引</span>
              </div>
              <button
                type="button"
                onClick={handleAiSuggestCauses}
                disabled={isAiLoading}
                className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/50 rounded font-medium transition-all"
              >
                {isAiLoading ? 'AI 推論中...' : '推論候選原因與檢查建議'}
              </button>
            </div>

            {aiSuggestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-sky-900/40">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {aiSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setRootCause(s.cause);
                        setBasisEvidence(`檢查點：${s.inspectionItem}；支持依據：${s.evidenceNeeded}`);
                      }}
                      className="bg-slate-950 p-2.5 rounded border border-slate-800 hover:border-sky-400 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{s.cause}</span>
                        <span className="text-[10px] text-sky-400 font-mono">{s.confidence}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1"><strong>檢查點:</strong> {s.inspectionItem}</p>
                      <span className="text-[10px] text-amber-400 mt-1 block">點擊帶入此原因與依據</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  * 警語：候選原因為基於現場描述之推論，嚴禁直接代替工程實體拆解檢測。
                </p>
              </div>
            )}
          </div>

          {/* Section 1: Inspection Items Table (FR-301, FR-302) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 uppercase tracking-wider">
                1. 檢查項目與量測數據紀錄 (FR-301, FR-302)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增點檢項目</span>
              </button>
            </div>

            <div className="space-y-2">
              {inspectionItems.map((item, index) => (
                <div key={item.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-0.5">檢查項目</label>
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => {
                        const copy = [...inspectionItems];
                        copy[index].item = e.target.value;
                        setInspectionItems(copy);
                      }}
                      placeholder="例：主軸軸承預壓"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-500 block mb-0.5">檢查結果</label>
                    <select
                      value={item.result}
                      onChange={(e) => {
                        const copy = [...inspectionItems];
                        copy[index].result = e.target.value as any;
                        setInspectionItems(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="NORMAL">正常</option>
                      <option value="ABNORMAL">異常</option>
                      <option value="PENDING">待確認</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-0.5">實測值 vs 標準</label>
                    <input
                      type="text"
                      value={item.measuredValue}
                      onChange={(e) => {
                        const copy = [...inspectionItems];
                        copy[index].measuredValue = e.target.value;
                        setInspectionItems(copy);
                      }}
                      placeholder="例：+0.015mm (<0.005mm)"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-500 block mb-0.5">備註 / 量具</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => {
                        const copy = [...inspectionItems];
                        copy[index].notes = e.target.value;
                        setInspectionItems(copy);
                      }}
                      placeholder="例：千分錶量測"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                    />
                  </div>

                  <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Root Cause with Confirmed/Pending Toggle (FR-304, FR-307) */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <span className="font-bold text-amber-400 uppercase tracking-wider block">
              2. 根本原因與判斷依據 (FR-304, 重要規則：支援原因待確認)
            </span>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-300">根本原因陳述 (Root Cause)：</label>
                {/* Important rule from spec: allow "原因待確認" without forcing quick decision */}
                <label className="flex items-center space-x-2 cursor-pointer bg-slate-950 px-3 py-1 rounded border border-slate-800">
                  <input
                    type="checkbox"
                    checked={!isRootCauseConfirmed}
                    onChange={(e) => setIsRootCauseConfirmed(!e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-amber-400 font-medium">標記為「原因待確認」（避免隨意勾選）</span>
                </label>
              </div>

              <textarea
                rows={3}
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="請詳述經調查與證據支持的根本原因（如：冷卻油濾芯油泥堵塞導致流量不足，主軸熱伸長超標...）"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                判斷依據與支持證據 (FR-304, FR-305)：
              </label>
              <textarea
                rows={2}
                value={basisEvidence}
                onChange={(e) => setBasisEvidence(e.target.value)}
                placeholder="記錄量測數據、現場觀察、熱像儀紀錄、金相檢測或物理排除紀錄..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Section 3: Improvement Plan (FR-501 ~ FR-508) */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <span className="font-bold text-amber-400 uppercase tracking-wider block">
              3. 製程改善對策與前/後基準 (FR-501 ~ FR-508)
            </span>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                永久改善對策 (Permanent Corrective Actions, FR-501)：
              </label>
              <textarea
                rows={3}
                value={improvementDesc}
                onChange={(e) => setImprovementDesc(e.target.value)}
                placeholder="請條列具體改善作為（例如：1. 更換 5μm 高效精密濾芯；2. 修正控制器熱補償係數；3. 試切首件 5 件進行全檢...）"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">對策執行人</label>
                <input
                  type="text"
                  value={executor}
                  onChange={(e) => setExecutor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">預計完成時間</label>
                <input
                  type="datetime-local"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">改善前基準 (FR-502)</label>
                <input
                  type="text"
                  value={preData}
                  onChange={(e) => setPreData(e.target.value)}
                  placeholder="例：外徑 25.018mm, 流量 1.2L"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-rose-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">改善後結果 (FR-503)</label>
                <input
                  type="text"
                  value={postData}
                  onChange={(e) => setPostData(e.target.value)}
                  placeholder="例：流量 4.8L, 尺寸 25.001mm"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-emerald-400 font-mono"
                />
              </div>
            </div>

            {/* FR-508 SOP/WI Update */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sopUpdateRequired}
                  onChange={(e) => setSopUpdateRequired(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span className="font-semibold text-slate-200">
                  需要更新作業指導書 (WI) 或定期點檢表 (FR-508 標準作業防再發)
                </span>
              </label>

              {sopUpdateRequired && (
                <input
                  type="text"
                  value={sopUpdateDetails}
                  onChange={(e) => setSopUpdateDetails(e.target.value)}
                  placeholder="請註明修訂之文件編號與條文（例如：修訂 WI-MNT-CNC-004，增列每週冷卻油流量差壓點檢）"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 text-xs mt-1"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end space-x-3 bg-slate-900 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>儲存調查分析與改善對策</span>
          </button>
        </div>
      </div>
    </div>
  );
};
