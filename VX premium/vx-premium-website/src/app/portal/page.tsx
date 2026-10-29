import type { Metadata } from "next";
import PortalDashboard from "@/components/portal/PortalDashboard";

export const metadata: Metadata = {
  title: "Your playlists | VX Premium",
  description:
    "Manage the Xtream and M3U playlists assigned to your player.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalPage() {
  return <PortalDashboard />;
}
