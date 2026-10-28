"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  adminFetch,
  clearAdminToken,
  getAdminToken,
} from "@/lib/admin-client";
import type { AdminSessionView } from "@/lib/types";

type MeResponse = {
  admin: AdminSessionView;
  storage: string;
};

export default function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    adminFetch<MeResponse>("/api/admin/me")
      .then(setMe)
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Session expired");
        clearAdminToken();
        router.replace("/admin/login");
      });
  }, [router]);

  useEffect(() => {
    function onUnauthorized() {
      clearAdminToken();
      router.replace("/admin/login");
    }
    window.addEventListener("vx:unauthorized", onUnauthorized);
    return () => window.removeEventListener("vx:unauthorized", onUnauthorized);
  }, [router]);

  if (!me) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#05070d]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-cyan-300/25 border-t-cyan-300" />
          <p className="mt-4 text-sm text-slate-400">
            {error || "Checking your session..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminShell admin={me.admin} storage={me.storage}>
      {children}
    </AdminShell>
  );
}
