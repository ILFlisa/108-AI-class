import React from 'react';
import { UserProfile, UserRole } from '../types/defect';
import { MOCK_USERS } from '../mock/initialCases';
import { ROLE_DETAILS } from '../utils/defectHelpers';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  FileText, 
  History, 
  BarChart3, 
  ShieldCheck, 
  UserCheck,
  Clock,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  activeScreen: 'REPORT' | 'LIST' | 'HISTORY' | 'DASHBOARD';
  onScreenChange: (screen: 'REPORT' | 'LIST' | 'HISTORY' | 'DASHBOARD') => void;
  openCasesCount: number;
  pendingDispatchCount: number;
  criticalCasesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  activeScreen,
  onScreenChange,
  openCasesCount,
  pendingDispatchCount,
  criticalCasesCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      {/* Top Banner: System Title & Role Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-950/40 border border-orange-400/30">
              <AlertTriangle className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">生產產品異常處理與追蹤系統</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  標準作業流程 v2.4
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <Sparkles className="w-3 h-3" />
                  Gemini AI 已就緒
                </span>
              </div>
              <p className="text-xs text-slate-400">通報 · 受理 · 派工 · 調查 · 改善 · 驗證 · 結案 · 歷史知識庫</p>
            </div>
          </div>

          {/* Quick Status & Role Selector */}
          <div className="flex items-center space-x-4">
            {/* Live plant status indicators */}
            <div className="hidden lg:flex items-center space-x-2 text-xs">
              {criticalCasesCount > 0 && (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-semibold">{criticalCasesCount} 件緊急</span>
                </div>
              )}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>處理中: <strong className="text-white font-mono">{openCasesCount}</strong></span>
              </div>
              {pendingDispatchCount > 0 && (
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-700/50 text-indigo-300">
                  <span>待派工: <strong className="text-indigo-200 font-mono">{pendingDispatchCount}</strong></span>
                </div>
              )}
            </div>

            {/* Role Switcher (Crucial for testing all 7 roles specified in Section 2) */}
            <div className="flex items-center space-x-2 bg-slate-800/90 p-1.5 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 pl-1 hidden sm:inline">當前角色:</span>
              <div className="relative">
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    const found = MOCK_USERS.find(u => u.id === e.target.value);
                    if (found) onUserChange(found);
                  }}
                  className="bg-slate-900 text-xs text-amber-400 font-medium py-1 px-2.5 rounded border border-slate-700 hover:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  {MOCK_USERS.map((user) => (
                    <option key={user.id} value={user.id} className="bg-slate-900 text-slate-200">
                      {user.avatar} {user.name} ({ROLE_DETAILS[user.role].title} - {user.dept})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (UI-01 ~ UI-06) */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-1 pb-2">
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => onScreenChange('REPORT')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                activeScreen === 'REPORT'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>UI-01 異常通報</span>
            </button>

            <button
              onClick={() => onScreenChange('LIST')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                activeScreen === 'LIST'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>UI-02 案件清單與處置</span>
              {openCasesCount > 0 && (
                <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
                  activeScreen === 'LIST' ? 'bg-slate-900 text-amber-400' : 'bg-slate-700 text-slate-200'
                }`}>
                  {openCasesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onScreenChange('HISTORY')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                activeScreen === 'HISTORY'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>UI-05 歷史案例庫</span>
            </button>

            <button
              onClick={() => onScreenChange('DASHBOARD')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                activeScreen === 'DASHBOARD'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>UI-06 管理儀表板</span>
            </button>
          </nav>

          {/* Current Role Permissions Brief Bar */}
          <div className="hidden md:flex items-center text-xs text-slate-400 space-x-2">
            <span className="text-slate-500">當前職責:</span>
            <span className="text-slate-300 font-medium">{ROLE_DETAILS[currentUser.role].desc}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
