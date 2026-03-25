import { Toaster } from "react-hot-toast";
import { Sidebar } from "@/src/components/layout/Sidebar";
import { BottomNav } from "@/src/components/layout/BottomNav";
import { Navbar } from "@/src/components/layout/Navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 px-4 py-6 md:px-8 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomNav />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "0.75rem",
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />
    </>
  );
}
