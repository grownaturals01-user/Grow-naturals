import React, { useState } from 'react';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { Header } from './components/layout/Header';
import { ProjectList } from './components/projects/ProjectList';
import { ProjectDetailView } from './components/project-detail/ProjectDetailView';
import { DailyLedgerView } from './components/views/DailyLedgerView';
import { PnLAnalyticsView } from './components/views/PnLAnalyticsView';
import { EnquiriesPipelineView } from './components/views/EnquiriesPipelineView';
import { ResourceAllocationView } from './components/views/ResourceAllocationView';
import { NewProjectModal } from './components/modals/NewProjectModal';
import './index.css';

const AppContent: React.FC = () => {
  const { currentView } = useProjects();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  return (
    <div className="page-wrapper" style={{ minHeight: 'calc(100vh - 60px)', background: '#fafbfe' }}>
      <div className="content pb-5" style={{ maxWidth: '100%' }}>
        <div className="landscaping-suite-root min-h-screen text-neutral-900 flex flex-col font-sans">
          <Header onOpenNewProject={() => setShowNewProjectModal(true)} />

          <main className="flex-1 w-full">
            {currentView === 'dashboard' && (
              <ProjectList onOpenNewProject={() => setShowNewProjectModal(true)} />
            )}
            {currentView === 'enquiries' && (
              <EnquiriesPipelineView onOpenNewEnquiry={() => setShowNewProjectModal(true)} />
            )}
            {currentView === 'project-detail' && <ProjectDetailView />}
            {currentView === 'daily-ledger' && <DailyLedgerView />}
            {currentView === 'pnl-matrix' && <PnLAnalyticsView />}
            {currentView === 'resource-allocation' && <ResourceAllocationView />}
          </main>

          {/* New Project Modal */}
          {showNewProjectModal && (
            <NewProjectModal onClose={() => setShowNewProjectModal(false)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default function LandscapingProjectsApp() {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
}
