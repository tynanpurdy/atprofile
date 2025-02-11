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
    type: "component",
    url: "#",
    component: (
      <div className="group/tooltip relative flex opacity-80 hover:opacity-90 transition-opacity duration-150">
        <div className="group-hover/tooltip:bg-muted flex w-full items-center gap-1 p-1 py-1.5 rounded-lg cursor-not-allowed">
          <div className="inline-flex items-center gap-1">
            <FireExtinguisher height={16} />
            <span>Firehose</span>
          </div>
        </div>
        {/* Tooltip */}
        <div className="invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 transition-all duration-200">
          <div className="bg-gray-800 text-white text-sm px-2 py-1 rounded-md whitespace-nowrap">
            Coming soon
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800"></div>
          </div>
        </div>
      </div>
    ),
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
        <ColorToggle />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
