import { AtSign, FireExtinguisher, Gauge, Home } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SmartSearchBar } from "./smartSearchBar";
import { ColorToggle } from "./themeSwitcher";
import { Link } from "@tanstack/react-router";
import { ForwardRefExoticComponent, ReactNode } from "preact/compat";
import { FontPicker } from "./fontPicker";
import { NavUser } from "./auth/navUser";

type BaseMenuItem = {
  url: string;
};

type IconMenuItem = BaseMenuItem & {
  type: "icon";
  title: string;
  icon: ForwardRefExoticComponent<any>;
  className?: string;
};

type ComponentMenuItem = BaseMenuItem & {
  type: "component";
  component: ReactNode;
};

type MenuItem = IconMenuItem | ComponentMenuItem;

// Menu items.
const items: MenuItem[] = [
  {
    type: "icon",
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    type: "icon",
    title: "Jetstream",
    url: "/jetstream",
    icon: FireExtinguisher,
  },
  {
    type: "icon",
    title: "Counter",
    url: "/counter",
    icon: Gauge,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <SidebarHeader className="-my-4">
          <div className="flex items-center text-3xl px-2 pt-4">
            <AtSign className="text-blue-500 mr-1 mt-1" height={36} />
            tools
          </div>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>
            Search{" "}
            <div className="text-xs ml-1 text-center bg-muted-foreground text-muted rounded-full aspect-square h-4 w-4">
              ?
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SmartSearchBar isKeybindEnabled={true} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="-my-4">
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) =>
                item.type === "component" ? (
                  <SidebarMenuItem key={item.url}>
                    <Link to={item.url}>{item.component}</Link>
                  </SidebarMenuItem>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={item.className}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
        <div className="flex min-w-full">
          <FontPicker />
          <ColorToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
