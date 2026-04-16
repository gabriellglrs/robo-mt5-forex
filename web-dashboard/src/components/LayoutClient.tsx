"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { AuthWrapper } from "@/components/AuthWrapper";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <AuthWrapper>{children}</AuthWrapper>;
  }

  return (
    <AuthWrapper>
      <div className="flex bg-background min-h-screen text-foreground overflow-x-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 flex flex-col">
          <TopBar />
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </AuthWrapper>
  );
}
