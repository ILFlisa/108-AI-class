import React, { useState } from 'react';
import { DefectCase, DefectType, UserProfile } from '../types/defect';
import { 
  DEFECT_TYPE_CONFIG, 
  STATUS_CONFIG, 
  SEVERITY_CONFIG 
} from '../utils/defectHelpers';
import { 
  Search, 
  Sparkles, 
  History, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  ArrowRight,
  BookOpen,
  ChevronRight,
  X
} from 'lucide-react';

interface HistoryCasesViewProps {
  cases: DefectCase[];
  currentUser: UserProfile;
  onSelectCase: (defectCase: DefectCase) => void;
}

export const HistoryCasesView: React.FC<HistoryCasesViewProps> = ({
  cases,
  currentUser,
  onSelectCase
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterMachine, setFilterMachine] = useState<string>('ALL');
  const [filterRepeatOnly, setFilterRepeatOnly] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);

  // AI-002 Smart Search State
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiMatches, setAiMatches] = useState<any[] | null>(null);
  const [aiInsight, setAiInsight] = useState('');

  // Selected preview case for quick read
  const [previewCase, setPreviewCase] = useState<DefectCase | null>(null);

  // Unique machines for filtering
  const allMachines = Array.from(new Set(cases.map(c => c.machineId))).filter(Boolean);

  // Filter cases
  const filteredCases = cases.filter((c) => {
    if (filterType !== 'ALL' && c.defectType !== filterType) return false;
    if (filterMachine !== 'ALL' && c.machineId !== filterMachine) return false;
    if (filterRepeatOnly && !c.closure.isRepeatIssue) return false;
    if (filterVerifiedOnly && c.verification.verdict !== 'PASSED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.productId.toLowerCase().includes(q) ||
        c.machineId.toLowerCase().includes(q) ||
        c.defectDesc.toLowerCase().includes(q) ||
        (c.investigation.rootCause && c.investigation.rootCause.toLowerCase().includes(q)) ||
        (c.improvement.description && c.improvement.description.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // AI-002 Trigger
  const handleAiFindSimilar = async () => {
    if (!aiQuery.trim()) {
      alert('請先輸入異常現象或設備關鍵字以進行 AI 相似比對。');
      return;
    }

    setIsAiSearching(true);
    try {
      const res = await fetch('/api/ai/find-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentCase: {
            id: 'QUERY',
            defectDesc: aiQuery,
            defectType: filterType !== 'ALL' ? filterType : 'DIMENSION',
            machineId: filterMachine !== 'ALL' ? filterMachine : ''
          },
          historyCases: cases
        })
      });

      if (!res.ok) throw new Error('AI 搜尋失敗');
      const data = await res.json();
      setAiMatches(data.matches || []);
      setAiInsight(data.aiInsight || '');
    } catch (err) {
      console.error(err);
      alert('AI 相似比對服務暫時無法連線，請使用上方多條件複合查詢。');
    } finally {
      setIsAiSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                F05 · FR-401 ~ FR-406
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">歷史異常案例與工程知識庫</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              彙整全廠過往異常調查、根本原因判定與驗證有效之改善對策，供工程與維修人員快速借鏡。
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>已累積案量: <strong className="text-amber-400 font-mono text-base">{cases.length}</strong> 件</span>
          </div>
        </div>
      </div>

      {/* AI-002 Smart Semantic Search Box */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/40 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">AI-002 智慧相似歷史案例檢索 (跨案比對)</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">Gemini 3.8 Flash</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            輸入現場遇到的疑難雜症，AI 自動媒合過往有效對策
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="例如：主軸轉速升高時尺寸正偏差、注塑件近澆口縮水凹痕、探針鍍金磨耗電阻超差..."
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiFindSimilar()}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            onClick={handleAiFindSimilar}
            disabled={isAiSearching}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>{isAiSearching ? 'AI 比對中...' : '比對歷史解決方案'}</span>
          </button>
        </div>

        {/* AI Matches Display */}
        {aiMatches && (
          <div className="pt-3 border-t border-sky-900/40 space-y-3">
            {aiInsight && (
              <div className="bg-sky-950/70 p-3 rounded-lg border border-sky-800 text-xs text-sky-200">
                <strong>AI 診斷洞察：</strong> {aiInsight}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiMatches.map((m, idx) => {
                const targetCase = cases.find(c => c.id === m.caseId);

                return (
                  <div
                    key={idx}
                    onClick={() => targetCase && setPreviewCase(targetCase)}
                    className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 hover:border-sky-400 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-400 group-hover:underline">
                        {m.caseId}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                        匹配度 {m.similarityScore}%
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-1">
                      {m.matchedReasons?.map((r: string, i: number) => (
                        <span key={i} className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-sky-300">
                          {r}
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-slate-300">
                      <strong className="text-slate-400 block text-[10px] uppercase">查明根本原因：</strong>
                      <p className="line-clamp-2 text-[11px] text-slate-300 mt-0.5">{m.historicalRootCause}</p>
                    </div>

                    <div className="text-xs text-emerald-300 pt-1.5 border-t border-slate-900">
                      <strong className="text-slate-400 block text-[10px] uppercase">過往驗證有效對策：</strong>
                      <p className="line-clamp-2 text-[11px] text-emerald-300 mt-0.5">{m.provenCountermeasure}</p>
                    </div>

                    <div className="text-[10px] text-amber-400 flex items-center justify-end space-x-1 pt-1">
                      <span>點擊檢視案件完整檔案</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Multi-Condition Structured Filter (FR-401, FR-402, TC-005) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <Filter className="w-4 h-4" />
          <span>複合條件精準搜尋 (TC-005 驗收條件：至少兩種條件組合)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Keyword Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="關鍵字：產品編號、異常描述、原因、對策..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Machine Filter */}
          <div>
            <select
              value={filterMachine}
              onChange={(e) => setFilterMachine(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">全部機台設備</option>
              {allMachines.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Defect Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">全部異常類型</option>
              {(Object.keys(DEFECT_TYPE_CONFIG) as DefectType[]).map((k) => (
                <option key={k} value={k}>
                  {DEFECT_TYPE_CONFIG[k].label}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center space-x-3 text-slate-300">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterVerifiedOnly}
                onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>僅品保已驗證合格</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filterRepeatOnly}
                onChange={(e) => setFilterRepeatOnly(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span>曾重複發生</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.map((c) => (
          <div
            key={c.id}
            onClick={() => setPreviewCase(c)}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl p-5 cursor-pointer transition-all shadow-md space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-amber-400 group-hover:underline">
                {c.id}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[c.status].bg} ${STATUS_CONFIG[c.status].text}`}>
                {STATUS_CONFIG[c.status].label}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold text-white">
                {c.machineId} · {c.productName}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {c.productId} (批號: {c.batchNumber || 'N/A'})
              </div>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {c.defectDesc}
            </p>

            {/* Root Cause snippet */}
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-[11px] space-y-1">
              <div className="text-slate-400 font-semibold">
                根本原因:
              </div>
              <p className="text-slate-300 line-clamp-2">
                {c.investigation.rootCause || '調查中／待確認'}
              </p>
            </div>

            {/* Countermeasure snippet */}
            {c.improvement.description && (
              <div className="bg-emerald-950/20 p-2.5 rounded border border-emerald-900/30 text-[11px] space-y-1">
                <div className="text-emerald-400 font-semibold">
                  有效改善措施:
                </div>
                <p className="text-emerald-200 line-clamp-2">
                  {c.improvement.description}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>{c.occurredAt.slice(0, 10)}</span>
              <span className="text-amber-400 flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                <span>檢閱完整案例</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Preview Modal / Drawer */}
      {previewCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">歷史案例檔案：{previewCase.id}</h3>
              </div>
              <button
                onClick={() => setPreviewCase(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block">機台與產品：</span>
                  <span className="text-slate-200 font-bold">{previewCase.machineId} | {previewCase.productName} ({previewCase.productId})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">發生時間與分類：</span>
                  <span className="text-slate-200">{previewCase.occurredAt.replace('T', ' ')} · {DEFECT_TYPE_CONFIG[previewCase.defectType].label}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">異常現象描述：</span>
                <p className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-200 leading-relaxed">
                  {previewCase.defectDesc}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">查明根本原因 (Root Cause)：</span>
                <p className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-200 leading-relaxed">
                  {previewCase.investigation.rootCause || '無詳細紀錄'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">採行改善對策與前/後基準：</span>
                <p className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-line">
                  {previewCase.improvement.description || '無詳細紀錄'}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900 p-2 rounded text-rose-300 font-mono">
                    改善前: {previewCase.improvement.preData || 'N/A'}
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-emerald-300 font-mono">
                    改善後: {previewCase.improvement.postData || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">品保檢驗與復線驗證：</span>
                <p className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-300">
                  檢驗標準: {previewCase.verification.criteria} | 結果: {previewCase.verification.verdict === 'PASSED' ? '✅ 合格' : '待補充'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setPreviewCase(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                關閉預覽
              </button>
              <button
                onClick={() => {
                  onSelectCase(previewCase);
                  setPreviewCase(null);
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center space-x-1.5"
              >
                <span>進入本案完整頁面</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
