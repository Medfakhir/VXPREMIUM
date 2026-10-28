import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VX Admin",
  description: "VX Premium control center.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-[#05070d] text-white">{children}</div>;
}
