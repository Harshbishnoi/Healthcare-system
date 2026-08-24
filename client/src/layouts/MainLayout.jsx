import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { AiSearchAssistantDrawer } from '../components/ai/AiSearchAssistantDrawer';

export const MainLayout = () => {
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar onOpenAiSearch={() => setAiDrawerOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />

      {/* Global AI Assistant Drawer */}
      <AiSearchAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />
    </div>
  );
};
