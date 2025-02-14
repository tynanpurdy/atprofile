import { AtSign, BadgeCheck, ChevronsUpDown, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { QtContext, resolveBskyUser } from "@/providers/qtprovider";
import { useContext, useEffect, useState } from "preact/hooks";
import { Link, redirect } from "@tanstack/react-router";
import { UserSwitcher } from "./userSwitcher";

export function NavUser() {
  const { isMobile } = useSidebar();
  let qt = useContext(QtContext);
  if (!qt) return null;

  const [user, setUser] = useState({
    name: "John Doe",
    did: "",
    avatar: "https://example.com/avatar.jpg",
  });

  useEffect(() => {
    async function fetchUser() {
      if (!qt?.client?.currentAgent) return;

      try {
        const { data } = await resolveBskyUser(qt.client.currentAgent.sub, qt);
        setUser({
          name: data.displayName || data.handle,
          did: data.did,
          avatar: data.avatar || "",
        });
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    }

    fetchUser();
  }, [qt]);

  if (!user.did)
    return (
      <Link to="/auth/login">
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border"
        >
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">
              <AtSign height={18} width={18} />
            </AvatarFallback>
          </Avatar>
          Log in to @tools
        </SidebarMenuButton>
      </Link>
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border"
          >
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-muted-foreground">{user.did}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-muted-foreground">
                  {user.did}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link to="/at:/$handle" params={{ handle: user.did }}>
              <DropdownMenuItem className="cursor-pointer">
                <BadgeCheck />
                Profile
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuItem>
            <UserSwitcher />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              qt.client.logout(user.did as `did:${string}`);
              redirect({ to: "/" });
              // force reload in 250ms to avoid rollback
              setTimeout(() => window.location.reload(), 250);
            }}
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
