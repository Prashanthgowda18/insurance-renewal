import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface LayoutProps {
  children: React.ReactNode;
  upcomingCount?: number;
  companyName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, upcomingCount = 0, companyName }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-app overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav upcomingCount={upcomingCount} companyName={companyName} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-app">
          {children}
        </main>
      </div>
    </div>
  );
};
