import { QtContext, resolveBskyUser } from "@/providers/qtprovider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";
import { useContext, useState, useEffect } from "preact/hooks";
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
export function AccountsManagementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const qt = useContext(QtContext);
  const [userList, setUserList] = useState<
    Array<{
      name: string;
      did: string;
      avatar: string;
    }>
  >([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle user list fetching
  useEffect(() => {
    async function fetchUsers() {
      if (!qt?.accounts.length) return;

      setUserList([]); // Reset list before fetching

      for (const did of qt.accounts) {
        try {
          const { data } = await resolveBskyUser(did, qt);
          if (data && data.displayName) {
            setUserList((prev) => [
              ...prev,
              {
                name: data.displayName || "",
                did: did,
                avatar: data.avatar || "",
              },
            ]);
          }
        } catch (err) {
          console.error(`Failed to fetch user data for ${did}:`, err);
        }
      }
    }

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, qt?.accounts]);

  const handleRemoveAccount = async (did: string) => {
    if (!qt?.client) return;
    setIsDeleting(true);
    try {
      await qt.client.logout(did as `did:${string}:${string}`);
    } catch (error) {
      console.error("Failed to remove account:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isDeleting && !open) {
          onClose();
        }
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          if (isDeleting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Manage Accounts</DialogTitle>
          <DialogDescription>
            View and manage your connected accounts
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {userList.map((user) => (
            <div
              key={user.did}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-muted-foreground">{user.did}</span>
                </div>
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
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={isDeleting} onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
