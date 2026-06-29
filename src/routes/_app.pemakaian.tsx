import { createFileRoute } from "@tanstack/react-router";
import { InventoryModule } from "@/components/inventory-module";

export const Route = createFileRoute("/_app/pemakaian")({
  head: () => ({ meta: [{ title: "Pemakaian — ADSAN" }] }),
  component: () => <InventoryModule moduleKey="pemakaian" />,
});