import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ADSAN — Enterprise ERP" },
      { name: "description", content: "Aplikasi ERP lokal ADSAN untuk manajemen bahan baku, barang jadi, dan proses produksi." },
    ],
  }),
  component: Index,
});

function Index() {
  const currentUserId = useAuth((s) => s.currentUserId);
  return <Navigate to={currentUserId ? "/dashboard" : "/login"} />;
}
