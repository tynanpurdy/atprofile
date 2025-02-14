import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { QtContext, resolveBskyUser } from "@/providers/qtprovider";
import { ChevronRight, Trash2, User, User2, Users } from "lucide-react";
import { useContext, useEffect, useState } from "preact/hooks";
import { Button } from "../ui/button";
import { Link } from "@tanstack/react-router";

export function UserSwitcher() {
  const { isMobile } = useSidebar();
  let qt = useContext(QtContext);
  if (!qt) return null;

  const [userList, setUserList] = useState<
    { name: string; did: string; avatar: string }[]
  >([]);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemoveAccount = async (did: string) => {
    if (!qt?.client) return;
    setIsDeleting(true);
    try {
      await qt.client.logout(did as `did:${string}`);
    } catch (error) {
      console.error("Failed to remove account:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshUserList = async () => {
    setUserList([]);
    if (!qt?.client?.currentAgent?.sub) return;

    try {
      qt.accounts.forEach(async (did) => {
        let { data } = await resolveBskyUser(did, qt);
        if (data && data.displayName)
          setUserList((ulist) => [
            ...(ulist || []),
            {
              name: data.displayName || "",
              did: did,
              avatar: data.avatar || "",
            },
          ]);
      });
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  useEffect(() => {
    refreshUserList();
  }, [qt]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <User />
            Switch Accounts
          </div>
          <ChevronRight />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          {userList.map((user) => (
            <DropdownMenuItem
              key={user.did}
              onClick={() => {
                qt.client.switchAccount(user.did as `did:${string}`);
              }}
            >
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
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isDeleting}
                onClick={() => handleRemoveAccount(user.did)}
                aria-label={`Remove account ${user.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={(event) => {
              event.preventDefault();
              qt.openManagementModal();
              console.log("Opening mgmt modal");
            }}
          >
            <User2 />
            Manage Accounts
          </DropdownMenuItem>
          <Link to="/auth/login" className="flex items-center gap-2">
            <DropdownMenuItem>
              <Users />
              Log in to another account
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
