import { ReactNode } from "react";
import { AdminBottomNav } from "./admin-bottom-nav";
import { Header } from "./header";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AdminLayout({ children, title = "Admin Panel" }: AdminLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 ios-viewport">
      <Header title={title} />
      <main className="flex-1 container max-w-md mx-auto px-4 pb-20 pt-4 md:pt-6">
        {children}
      </main>
      <AdminBottomNav />
    </div>
  );
}