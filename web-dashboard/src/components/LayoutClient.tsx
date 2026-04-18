"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { AuthWrapper } from "@/components/AuthWrapper";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <AuthWrapper>{children}</AuthWrapper>;
  }

  return (
    <AuthWrapper>
      <div className="flex bg-background min-h-screen text-foreground overflow-x-hidden">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          <TopBar />
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
}
