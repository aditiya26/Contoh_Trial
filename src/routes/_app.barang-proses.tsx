import { createFileRoute } from "@tanstack/react-router";
import { InventoryModule } from "@/components/inventory-module";

export const Route = createFileRoute("/_app/barang-proses")({
  head: () => ({ meta: [{ title: "Barang Dalam Proses — ADSAN" }] }),
  component: () => <InventoryModule moduleKey="barang-proses" />,
});