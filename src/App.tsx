/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DefectCase, UserProfile } from './types/defect';
import { INITIAL_CASES, MOCK_USERS } from './mock/initialCases';
import { Header } from './components/Header';
import { DefectReportForm } from './components/DefectReportForm';
import { DefectListView } from './components/DefectListView';
import { CaseDetailView } from './components/CaseDetailView';
import { CauseAnalysisModal } from './components/CauseAnalysisModal';
import { HistoryCasesView } from './components/HistoryCasesView';
import { DashboardView } from './components/DashboardView';
import { 
  AcceptClassifyModal, 
  ReturnRevisionModal, 
  DispatchModal, 
  QaVerificationModal, 
  LineResumeModal, 
  CloseCaseModal 
} from './components/WorkflowModals';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [cases, setCases] = useState<DefectCase[]>(INITIAL_CASES);
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]); // default: 林小安 (現場作業員)
  const [activeScreen, setActiveScreen] = useState<'REPORT' | 'LIST' | 'HISTORY' | 'DASHBOARD'>('LIST');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Active Modals
  const [isAcceptClassifyOpen, setIsAcceptClassifyOpen] = useState(false);
  const [isReturnRevisionOpen, setIsReturnRevisionOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isCauseAnalysisOpen, setIsCauseAnalysisOpen] = useState(false);
  const [isQaVerificationOpen, setIsQaVerificationOpen] = useState(false);
  const [isLineResumeOpen, setIsLineResumeOpen] = useState(false);
  const [isCloseCaseOpen, setIsCloseCaseOpen] = useState(false);

  // Toast Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>('歡迎使用生產產品異常處理與追蹤系統。切換右上角角色可體驗完整權限與作業流程。');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  // Update a case in master state
  const handleUpdateCase = (updatedCase: DefectCase) => {
    setCases(cases.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  // Create a new case (TC-001)
  const handleCreateCase = (newCase: DefectCase) => {
    setCases([newCase, ...cases]);
    setSelectedCaseId(newCase.id);
    setActiveScreen('LIST');
    showToast(`成功建立異常案件！專屬唯一編號：${newCase.id} (TC-001)`);
  };

  // Toggle dispatch subtasks
  const handleToggleDispatchTask = (caseId: string, taskId: string) => {
    setCases(
      cases.map((c) => {
        if (c.id !== caseId || !c.dispatch) return c;
        const updatedTasks = c.dispatch.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        return {
          ...c,
          dispatch: {
            ...c.dispatch,
            tasks: updatedTasks
          }
        };
      })
    );
  };

  // Add collaboration note
  const handleAddCollaborativeNote = (caseId: string, noteContent: string) => {
    setCases(
      cases.map((c) => {
        if (c.id !== caseId) return c;
        const newNoteItem = {
          id: `note-${Date.now()}`,
          author: currentUser.name,
          authorRole: currentUser.role,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          content: noteContent
        };
        return {
          ...c,
          collaborativeNotes: [...c.collaborativeNotes, newNoteItem],
          timeline: [
            ...c.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              actor: currentUser.name,
              actorRole: currentUser.role,
              action: `新增協作備註：${noteContent}`
            }
          ]
        };
      })
    );
    showToast('協作備註已送出並記錄於稽核歷程。');
  };

  // Resubmit revision (FR-103)
  const handleResubmitRevision = (caseId: string, supplementText: string) => {
    setCases(
      cases.map((c) => {
        if (c.id !== caseId) return c;
        const lastRev = c.revisionRequests[c.revisionRequests.length - 1];
        const updatedRevs = c.revisionRequests.map((r) =>
          r.id === lastRev?.id
            ? { ...r, fulfilledAt: new Date().toISOString(), supplementText }
            : r
        );
        return {
          ...c,
          status: 'PENDING_CONFIRMATION',
          revisionRequests: updatedRevs,
          timeline: [
            ...c.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              actor: currentUser.name,
              actorRole: currentUser.role,
              action: `現場作業員補齊資料重送 (FR-103)：${supplementText}`,
              previousStatus: 'REVISION_REQUIRED',
              newStatus: 'PENDING_CONFIRMATION'
            }
          ]
        };
      })
    );
    showToast('已補齊資料並重新送出，等待受理人員確認！');
  };

  // Submit to QA verification
  const handleSubmitToQaVerification = (caseId: string) => {
    setCases(
      cases.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          status: 'PENDING_VERIFICATION',
          timeline: [
            ...c.timeline,
            {
              id: `tl-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              actor: currentUser.name,
              actorRole: currentUser.role,
              action: '維修／製程已完成對策，送交品保進行品質檢驗判定 (FR-503)',
              previousStatus: 'IN_PROGRESS',
              newStatus: 'PENDING_VERIFICATION'
            }
          ]
        };
      })
    );
    showToast('已轉交品保部進行首件抽樣檢驗與製程能力判定！');
  };

  // KPI calculations
  const openCasesCount = cases.filter((c) => c.status !== 'CLOSED' && c.status !== 'CANCELLED').length;
  const pendingDispatchCount = cases.filter((c) => c.status === 'PENDING_DISPATCH').length;
  const criticalCasesCount = cases.filter((c) => c.severity === 'CRITICAL' && c.status !== 'CLOSED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 border border-amber-500/60 p-3.5 rounded-xl shadow-2xl flex items-center justify-between space-x-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center space-x-2.5 text-xs text-amber-200">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        onUserChange={(newUser) => {
          setCurrentUser(newUser);
          showToast(`已切換為：${newUser.name} (${newUser.dept})`);
        }}
        activeScreen={activeScreen}
        onScreenChange={(screen) => {
          setSelectedCaseId(null);
          setActiveScreen(screen);
        }}
        openCasesCount={openCasesCount}
        pendingDispatchCount={pendingDispatchCount}
        criticalCasesCount={criticalCasesCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If a case is selected, render UI-03 Case Detail View */}
        {selectedCaseId && selectedCase ? (
          <CaseDetailView
            defectCase={selectedCase}
            currentUser={currentUser}
            onBack={() => setSelectedCaseId(null)}
            onOpenAcceptClassifyModal={() => setIsAcceptClassifyOpen(true)}
            onOpenReturnRevisionModal={() => setIsReturnRevisionOpen(true)}
            onOpenDispatchModal={() => setIsDispatchOpen(true)}
            onOpenCauseAnalysisModal={() => setIsCauseAnalysisOpen(true)}
            onOpenQaVerificationModal={() => setIsQaVerificationOpen(true)}
            onOpenLineResumeModal={() => setIsLineResumeOpen(true)}
            onOpenCloseCaseModal={() => setIsCloseCaseOpen(true)}
            onAddCollaborativeNote={handleAddCollaborativeNote}
            onToggleDispatchTask={handleToggleDispatchTask}
            onResubmitRevision={handleResubmitRevision}
            onSubmitToQaVerification={handleSubmitToQaVerification}
          />
        ) : (
          <>
            {/* UI-01: Defect Reporting Form */}
            {activeScreen === 'REPORT' && (
              <DefectReportForm
                currentUser={currentUser}
                existingCases={cases}
                onSubmitCase={handleCreateCase}
                onSelectExistingCase={(caseId) => {
                  setSelectedCaseId(caseId);
                  setActiveScreen('LIST');
                }}
              />
            )}

            {/* UI-02: Defect List & Management View */}
            {activeScreen === 'LIST' && (
              <DefectListView
                cases={cases}
                currentUser={currentUser}
                onSelectCase={(c) => setSelectedCaseId(c.id)}
                onOpenReport={() => setActiveScreen('REPORT')}
              />
            )}

            {/* UI-05: Historical Cases Knowledge Base */}
            {activeScreen === 'HISTORY' && (
              <HistoryCasesView
                cases={cases}
                currentUser={currentUser}
                onSelectCase={(c) => setSelectedCaseId(c.id)}
              />
            )}

            {/* UI-06: Management Dashboard */}
            {activeScreen === 'DASHBOARD' && (
              <DashboardView
                cases={cases}
                currentUser={currentUser}
                onSelectCase={(c) => setSelectedCaseId(c.id)}
              />
            )}
          </>
        )}
      </main>

      {/* Workflow Modals */}
      {isAcceptClassifyOpen && selectedCase && (
        <AcceptClassifyModal
          defectCase={selectedCase}
          currentUser={currentUser}
          onClose={() => setIsAcceptClassifyOpen(false)}
          onConfirm={(updated) => {
            handleUpdateCase(updated);
            showToast('案件已成功受理並指定責任單位！');
          }}
        />
      )}

      {isReturnRevisionOpen && selectedCase && (
        <ReturnRevisionModal
          defectCase={selectedCase}
          currentUser={currentUser}
          onClose={() => setIsReturnRevisionOpen(false)}
          onConfirm={(updated) => {
            handleUpdateCase(updated);
            showToast('已退回通報現場補件 (FR-103)！');
          }}
        />
      )}

      {isDispatchOpen && selectedCase && (
        <DispatchModal
          defectCase={selectedCase}
          currentUser={currentUser}
          onClose={() => setIsDispatchOpen(false)}
          onConfirm={(updated) => {
            handleUpdateCase(updated);
            showToast('派工單已開立並指派承辦人員！');
          }}
        />
      )}

      {isCauseAnalysisOpen && selectedCase && (
        <CauseAnalysisModal
          defectCase={selectedCase}
          currentUser={currentUser}
          onClose={() => setIsCauseAnalysisOpen(false)}
          onSave={(updated) => {
            handleUpdateCase(updated);
            showToast('原因分析與製程改善對策已成功儲存！');
          }}
        />
      )}

      {isQaVerificationOpen && selectedCase && (
        <QaVerificationModal
          defectCase={selectedCase}
          currentUser={currentUser}
          onClose={() => setIsQaVerificationOpen(false)}
          onConfirm={(updated) => {
            handleUpdateCase(updated);
            showToast('品保檢驗判定結果已登錄！');
          }}
        />
      )}

      {isLineResumeOpen && selectedCase && (
        <LineResumeModal
          defectCase={selectedCase}
          currentUser={currentUser}
          onClose={() => setIsLineResumeOpen(false)}
          onConfirm={(updated) => {
            handleUpdateCase(updated);
            showToast('生產主管已簽發復線許可 (FR-507)！');
          }}
        />
      )}

      {isCloseCaseOpen && selectedCase && (
        <CloseCaseModal
          defectCase={selectedCase}
          currentUser={currentUser}
          onClose={() => setIsCloseCaseOpen(false)}
          onConfirm={(updated) => {
            handleUpdateCase(updated);
            showToast('主管已核准結案，案件已歸檔至歷史知識庫！');
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>生產產品異常處理與追蹤系統 · 依據品質規格與服務藍圖實作 · 支援 8D 分析與全生命週期追蹤</p>
      </footer>
    </div>
  );
}
