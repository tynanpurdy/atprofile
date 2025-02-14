import { AppSidebar } from "@/components/sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { QtProvider } from "@/providers/qtprovider";
import { ThemeProvider } from "@/providers/themeProvider";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

// It's the layout component
export const Route = createRootRoute({
  component: () => (
    <>
      <ThemeProvider>
        <QtProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <SidebarTrigger className="size-10 sticky top-0" />
              <Outlet />
            </SidebarInset>
          </SidebarProvider>
        </QtProvider>
      </ThemeProvider>
      {process.env.NODE_ENV === "development" && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </>
  ),
});
