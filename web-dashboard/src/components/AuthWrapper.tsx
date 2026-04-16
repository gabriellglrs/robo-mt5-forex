"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (pathname === '/login') {
      if (token) {
        router.push('/');
      } else {
        setAuthorized(true);
      }
      return;
    }

    if (!token) {
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (!authorized) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If we are on login page, don't show the sidebar/layout stuff (handled in RootLayout)
  return <>{children}</>;
}
