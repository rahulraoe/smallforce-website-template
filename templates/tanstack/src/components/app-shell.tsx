import { Link } from "@tanstack/react-router"
import { BoxIcon, LayoutDashboardIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const navigation = [
  {
    label: "Workspace",
    to: "/" as const,
    icon: LayoutDashboardIcon,
  },
]

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      aria-label="Toggle color theme"
      className="w-full justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-2"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      type="button"
      variant="ghost"
    >
      <SunIcon className="dark:hidden" />
      <MoonIcon className="hidden dark:block" />
      <span className="group-data-[collapsible=icon]:hidden">Theme</span>
    </Button>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link
            className="flex h-9 items-center gap-2 rounded-lg px-2 font-medium outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            to="/"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BoxIcon className="size-4" />
            </span>
            <span className="truncate group-data-[collapsible=icon]:hidden">
              Application
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <Link
                        activeProps={{ "data-active": true }}
                        activeOptions={{ exact: true }}
                        to={item.to}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <ThemeToggle />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />
          <p className="text-sm font-medium">Workspace</p>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
