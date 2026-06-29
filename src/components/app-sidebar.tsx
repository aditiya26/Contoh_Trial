import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  PackageCheck,
  Cog,
  Truck,
  ClipboardList,
  BarChart3,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/bahan-baku", label: "Bahan Baku", icon: Package },
  { to: "/barang-jadi", label: "Barang Jadi", icon: PackageCheck },
  { to: "/barang-proses", label: "Barang Dalam Proses", icon: Cog },
  { to: "/barang-perjalanan", label: "Barang Dalam Perjalanan", icon: Truck },
  { to: "/pemakaian", label: "Pemakaian", icon: ClipboardList },
  { to: "/laporan", label: "Laporan", icon: BarChart3 },
  { to: "/setting", label: "Setting", icon: Settings },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sidebar-primary-foreground"
            style={{ background: "var(--gradient-accent)" }}
          >
            A
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-sidebar-foreground">ADSAN</span>
            <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              Enterprise ERP
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modul</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((n) => {
                const active = path === n.to || path.startsWith(n.to + "/");
                return (
                  <SidebarMenuItem key={n.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={n.label}>
                      <Link to={n.to} className="flex items-center gap-2">
                        <n.icon className="h-4 w-4" />
                        <span>{n.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}