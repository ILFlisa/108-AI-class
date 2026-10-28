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
  DEFECT_TYPE_CONFIG 
} from '../utils/defectHelpers';
import { 
  Search, 
  Filter, 
  Kanban, 
  Table as TableIcon, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  User, 
  Calendar, 
  Building2, 
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface DefectListViewProps {
  cases: DefectCase[];
  currentUser: UserProfile;
  onSelectCase: (defectCase: DefectCase) => void;
  onOpenReport: () => void;
}

export const DefectListView: React.FC<DefectListViewProps> = ({
  cases,
  currentUser,
  onSelectCase,
  onOpenReport
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<CaseStatus | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');

  // Filter logic
  const filteredCases = cases.filter((c) => {
    if (selectedStatusTab !== 'ALL' && c.status !== selectedStatusTab) {
      return false;
    }
    if (filterType !== 'ALL' && c.defectType !== filterType) {
      return false;
    }
    if (filterSeverity !== 'ALL' && c.severity !== filterSeverity) {
      return false;
    }
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.productId.toLowerCase().includes(q) ||
        (c.productName && c.productName.toLowerCase().includes(q)) ||
        c.machineId.toLowerCase().includes(q) ||
        c.defectDesc.toLowerCase().includes(q) ||
        c.reporterName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate elapsed waiting hours
  const calculateElapsedHours = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = Date.now();
    const diffHours = Math.max(0, Math.round((now - start) / (1000 * 60 * 60)));
    return diffHours;
  };

  // Status Tab options with counts
  const statusTabs: Array<{ key: CaseStatus | 'ALL'; label: string }> = [
    { key: 'ALL', label: '全部案件' },
    { key: 'PENDING_CONFIRMATION', label: '待確認' },
    { key: 'REVISION_REQUIRED', label: '待補件' },
    { key: 'PENDING_DISPATCH', label: '待派工' },
    { key: 'IN_PROGRESS', label: '處理中' },
    { key: 'PENDING_VERIFICATION', label: '待驗證' },
    { key: 'PENDING_CLOSURE', label: '待結案' },
    { key: 'CLOSED', label: '已結案' },
  ];

  // Helper for determining next action description
  const getNextActionText = (c: DefectCase) => {
    switch (c.status) {
      case 'DRAFT': return '現場尚未正式送出';
      case 'PENDING_CONFIRMATION': return '等待客服／維修受理確認與分類 (FR-101)';
      case 'REVISION_REQUIRED': return '等待通報人補登資料與照片 (FR-103)';
      case 'PENDING_DISPATCH': return '等待派工並指定承辦人 (FR-201)';
      case 'IN_PROGRESS': return '工程／維修執行原因調查與對策實施 (FR-304/501)';
      case 'PENDING_VERIFICATION': return '等待品保檢驗與判定合格 (FR-505)';
      case 'PENDING_CLOSURE': return '等待主管簽核結案與復線許可 (FR-603)';
      case 'CLOSED': return '已完成結案並歸檔知識庫 (FR-607)';
      case 'CANCELLED': return '已取消';
      default: return '無';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="搜尋案件編號、產品 (PRD-*)、機台 (CNC-*)、不良現象或通報人..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">類型:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">全部異常類型</option>
                {(Object.keys(DEFECT_TYPE_CONFIG) as DefectType[]).map((k) => (
                  <option key={k} value={k} className="bg-slate-900">
                    {DEFECT_TYPE_CONFIG[k].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">嚴重度:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">全部等級</option>
                <option value="NORMAL" className="bg-slate-900">一般</option>
                <option value="MAJOR" className="bg-slate-900">重大</option>
                <option value="CRITICAL" className="bg-slate-900">緊急</option>
              </select>
            </div>

            {/* Toggle Table vs Kanban */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded ${viewMode === 'TABLE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                title="工程清單視圖"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('KANBAN')}
                className={`p-1.5 rounded ${viewMode === 'KANBAN' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                title="流程管線看板"
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>

            {/* New Report Shortcut */}
            <button
              onClick={onOpenReport}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5"
            >
              <span>+ 建立通報</span>
            </button>
          </div>
        </div>

        {/* Status Tab Pills with live counts */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-3 mt-3 border-t border-slate-800 text-xs">
          {statusTabs.map((tab) => {
            const count = tab.key === 'ALL' 
              ? cases.length 
              : cases.filter(c => c.status === tab.key).length;
            const isSelected = selectedStatusTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatusTab(tab.key)}
                className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/50 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Table View */}
      {viewMode === 'TABLE' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">案件編號</th>
                  <th className="py-3 px-4">狀態</th>
                  <th className="py-3 px-4">嚴重度</th>
                  <th className="py-3 px-4">機台 / 產品 / 批號</th>
                  <th className="py-3 px-4">異常現象與數量</th>
                  <th className="py-3 px-4">負責單位 / 承辦人</th>
                  <th className="py-3 px-4">通報時效</th>
                  <th className="py-3 px-4">下一個待辦事項</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-500">
                      查無符合條件之異常案件。
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => {
                    const statusConf = STATUS_CONFIG[c.status];
                    const sevConf = SEVERITY_CONFIG[c.severity];
                    const elapsed = calculateElapsedHours(c.createdAt);

                    return (
                      <tr
                        key={c.id}
                        onClick={() => onSelectCase(c)}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* Case ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400 group-hover:underline">
                          {c.id}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                            {statusConf.label}
                          </span>
                        </td>

                        {/* Severity */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${sevConf.badge}`}>
                            {sevConf.label}
                          </span>
                        </td>

                        {/* Machine & Product */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-200 font-bold">
                            {c.machineId} <span className="text-slate-400 font-normal">| {c.productId}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {c.productName}
                          </div>
                          {c.batchNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              批號: {c.batchNumber}
                            </div>
                          )}
                        </td>

                        {/* Defect Desc & Quantity */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="text-slate-200 line-clamp-2 leading-relaxed">
                            {c.defectDesc}
                          </div>
                          <div className="mt-1 flex items-center space-x-2 text-[11px] text-amber-400 font-mono">
                            <span>不良數: {c.defectQuantity} {c.unit}</span>
                            {c.actualMeasurement && (
                              <span className="text-slate-400">| 實測: {c.actualMeasurement}</span>
                            )}
                          </div>
                        </td>

                        {/* Responsible Dept & Assignee */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-300 font-medium">
                            {c.dispatch?.assignedDept || c.classification?.responsibleDept || '待分派'}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                            <User className="w-3 h-3 text-slate-500" />
                            <span>{c.dispatch?.primaryAssignee || '未指派承辦人'}</span>
                          </div>
                        </td>

                        {/* Elapsed time & SLA */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                          <div className="text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>已立案 {elapsed}h</span>
                          </div>
                          {c.dispatch?.targetCompletionDate && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              期限: {c.dispatch.targetCompletionDate.slice(5, 16)}
                            </div>
                          )}
                        </td>

                        {/* Next pending task */}
                        <td className="py-3.5 px-4 text-[11px] text-slate-300 max-w-[200px]">
                          <span className="line-clamp-2 text-slate-300">
                            {getNextActionText(c)}
                          </span>
                        </td>

                        {/* Action link */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center text-xs text-amber-400 group-hover:text-amber-300 font-medium">
                            <span>詳情</span>
                            <ChevronRight className="w-4 h-4 ml-0.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['PENDING_CONFIRMATION', 'PENDING_DISPATCH', 'IN_PROGRESS', 'PENDING_VERIFICATION'] as CaseStatus[]).map((statusKey) => {
            const columnCases = filteredCases.filter(c => c.status === statusKey);
            const conf = STATUS_CONFIG[statusKey];

            return (
              <div key={statusKey} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col min-h-[450px]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${conf.bg} border ${conf.border}`} />
                    <h4 className="text-xs font-bold text-white uppercase">{conf.label}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {columnCases.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onSelectCase(c)}
                      className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all shadow-md space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-400 group-hover:underline">
                          {c.id}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${SEVERITY_CONFIG[c.severity].badge}`}>
                          {SEVERITY_CONFIG[c.severity].label}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {c.machineId} · {c.productName}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {c.defectDesc}
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span>承辦: {c.dispatch?.primaryAssignee || '未指派'}</span>
                        <span className="font-mono">{c.createdAt.slice(11, 16)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
