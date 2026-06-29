import { createFileRoute } from "@tanstack/react-router";
import { InventoryModule } from "@/components/inventory-module";

export const Route = createFileRoute("/_app/barang-jadi")({
  head: () => ({ meta: [{ title: "Barang Jadi — ADSAN" }] }),
  component: () => <InventoryModule moduleKey="barang-jadi" />,
});