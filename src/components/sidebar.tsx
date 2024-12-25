import { AtSign, FireExtinguisher, Home } from "lucide-react";

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

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Firehose",
    url: "#",
    icon: FireExtinguisher,
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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
