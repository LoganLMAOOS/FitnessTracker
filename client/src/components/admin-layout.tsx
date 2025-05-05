import { ReactNode } from "react";
import { AdminBottomNav } from "./admin-bottom-nav";
import { Header } from "./header";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AdminLayout({ children, title = "Admin Panel" }: AdminLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 ios-viewport pb-16">
      <Header title={title} />
      <main className="flex-1 container px-2 mx-auto pt-16 md:pt-20 pb-20 md:px-4 max-w-4xl">
        {children}
      </main>
      <AdminBottomNav />
    </div>
  );
}