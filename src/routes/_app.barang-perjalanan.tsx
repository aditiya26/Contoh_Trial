import { createFileRoute } from "@tanstack/react-router";
import { InventoryModule } from "@/components/inventory-module";

export const Route = createFileRoute("/_app/barang-perjalanan")({
  head: () => ({ meta: [{ title: "Barang Dalam Perjalanan — ADSAN" }] }),
  component: () => <InventoryModule moduleKey="barang-perjalanan" />,
});