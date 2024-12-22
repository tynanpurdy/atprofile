import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QtClient, QtContext } from "@/providers/qtprovider";
import { ThemeProvider } from "@/providers/themeProvider";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

// It's the layout component
export const Route = createRootRoute({
  component: () => (
    <>
      <ThemeProvider>
        <QtContext.Provider value={new QtClient()}>
          <SidebarProvider>
            <AppSidebar />
            <Outlet />
          </SidebarProvider>
        </QtContext.Provider>
      </ThemeProvider>
      <TanStackRouterDevtools />
    </>
  ),
});
