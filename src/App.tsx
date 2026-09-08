import React, { useState } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { DemoBar } from './components/DemoBar';
import { ToastContainer } from './components/ToastContainer';
import { MorningBriefingModal } from './components/MorningBriefingModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { Field } from './types/agro';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPage } from './pages/FarmsPage';
import { FieldDetailPage } from './pages/FieldDetailPage';
import { MapPage } from './pages/MapPage';
import { CropHealthPage } from './pages/CropHealthPage';
import { ObservationsPage } from './pages/ObservationsPage';
import { MediaPage } from './pages/MediaPage';
import { ProblemsPage } from './pages/ProblemsPage';
import { TasksPage } from './pages/TasksPage';
import { RemindersPage } from './pages/RemindersPage';
import { WeatherPage } from './pages/WeatherPage';
import { FarmMemoryPage } from './pages/FarmMemoryPage';
import { AssistantPage } from './pages/AssistantPage';
import { DevicePage } from './pages/DevicePage';
import { SettingsPage } from './pages/SettingsPage';

// Mobile Bottom Navigation icons
import {
  LayoutDashboard,
  MapPin,
  Camera,
  Bot,
  CheckSquare
} from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDemoBarOpen, setIsDemoBarOpen] = useState(false); // Closed by default for clean presentation
  const [selectedFieldForDetail, setSelectedFieldForDetail] = useState<Field | null>(null);

  const handleSelectField = (field: Field) => {
    setSelectedFieldForDetail(field);
  };

  const handleBackFromFieldDetail = () => {
    setSelectedFieldForDetail(null);
  };

  const navigateToPage = (page: PageId) => {
    setSelectedFieldForDetail(null);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col font-sans">
      {/* 1. Interactive Demo Mode Hardware Simulator Banner */}
      <DemoBar isOpen={isDemoBarOpen} onClose={() => setIsDemoBarOpen(false)} />

      <div className="flex flex-1">
        {/* 2. Left Sidebar Navigation */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={navigateToPage}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* 3. Main Content Area */}
        <div className={`flex-1 lg:pl-72 flex flex-col min-w-0 ${(currentPage === 'assistant' || currentPage === 'map') ? 'h-screen overflow-hidden' : ''}`}>
          {/* Header */}
          <Header
            onOpenSidebar={() => setIsSidebarOpen(true)}
            isDemoOpen={isDemoBarOpen}
            setIsDemoOpen={setIsDemoBarOpen}
          />

          {/* Page Routing */}
          <main className={`flex-1 ${(currentPage === 'assistant' || currentPage === 'map') ? 'p-2 sm:p-3 flex flex-col min-h-0 overflow-hidden' : 'p-4 sm:p-6 lg:p-8'}`}>
            {selectedFieldForDetail ? (
              <FieldDetailPage
                field={selectedFieldForDetail}
                onBack={handleBackFromFieldDetail}
                onOpenMap={() => navigateToPage('map')}
              />
            ) : (
              <>
                {currentPage === 'dashboard' && <DashboardPage onNavigate={navigateToPage} />}
                {currentPage === 'farms' && (
                  <FarmsPage onSelectField={handleSelectField} onNavigate={navigateToPage} />
                )}
                {currentPage === 'map' && <MapPage />}
                {currentPage === 'crop-health' && <CropHealthPage />}
                {currentPage === 'observations' && <ObservationsPage />}
                {currentPage === 'media' && <MediaPage />}
                {currentPage === 'problems' && <ProblemsPage />}
                {currentPage === 'tasks' && <TasksPage />}
                {currentPage === 'reminders' && <RemindersPage />}
                {currentPage === 'weather' && <WeatherPage />}
                {currentPage === 'farm-memory' && <FarmMemoryPage />}
                {currentPage === 'assistant' && <AssistantPage />}
                {currentPage === 'device' && <DevicePage />}
                {currentPage === 'settings' && <SettingsPage />}
              </>
            )}
          </main>

          {/* Mobile Bottom Navigation Bar (Master Prompt Section 2 & 23) */}
          <div className="lg:hidden sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
            <button
              onClick={() => navigateToPage('dashboard')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                currentPage === 'dashboard' ? 'text-forest-700' : 'text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => navigateToPage('map')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                currentPage === 'map' ? 'text-forest-700' : 'text-slate-400'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span>Map</span>
            </button>

            <button
              onClick={() => navigateToPage('media')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                currentPage === 'media' ? 'text-forest-700' : 'text-slate-400'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>Media</span>
            </button>

            <button
              onClick={() => navigateToPage('tasks')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                currentPage === 'tasks' ? 'text-forest-700' : 'text-slate-400'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span>Tasks</span>
            </button>

            <button
              onClick={() => navigateToPage('assistant')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
                currentPage === 'assistant' ? 'text-forest-700' : 'text-slate-400'
              }`}
            >
              <Bot className="w-5 h-5 text-emerald-600" />
              <span>AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Modals & Notifications */}
      <NotificationDrawer />
      <MorningBriefingModal />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <FarmProvider>
      <AppContent />
    </FarmProvider>
  );
}

export default App;
