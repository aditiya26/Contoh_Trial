import { createFileRoute } from "@tanstack/react-router";
import { InventoryModule } from "@/components/inventory-module";

export const Route = createFileRoute("/_app/bahan-baku")({
  head: () => ({ meta: [{ title: "Bahan Baku — ADSAN" }] }),
  component: () => <InventoryModule moduleKey="bahan-baku" />,
});