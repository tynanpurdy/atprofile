import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { KbdKey } from "./ui/kbdKey";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "./ui/button";

// function determineRouteType(input: string) {
//   if (input.startsWith("at://")) {
//     return "at url";
//   } else if (input.startsWith("https://")) {
//     return "pds";
//   } else {
//     return "handle";
//   }
//   return "unknown";
// }

export function isOnMac() {
  return navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

export function SmartSearchBar({
  isKeybindEnabled = false,
}: {
  isKeybindEnabled?: boolean;
}) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (value && value !== "@") {
      // replace at:// with / to match the route correctly
      if (value.includes("bsky.app") || value.includes("main.bsky.dev")) {
        try {
          const url = new URL(value);
          const pathParts = url.pathname.split("/");

          if (pathParts[1] === "profile") {
            const handle = pathParts[2];

            if (pathParts[3] === "post") {
              // Post URL: /profile/handle/post/postid
              navigate({
                to: `/at:/${handle}/app.bsky.feed.post/${pathParts[4]}`,
              });
            } else if (pathParts[3] === "lists") {
              // List URL: /profile/handle/lists/listid
              navigate({
                to: `/at:/${handle}/app.bsky.graph.list/${pathParts[4]}`,
              });
            } else {
              // Profile URL: /profile/handle
              navigate({
                to: `/at:/${handle}`,
              });
            }
          }
        } catch (e) {
          console.error("Invalid Bluesky URL:", e);
        }
      } else if (value.startsWith("pds/") || value.startsWith("https:/")) {
        navigate({
          to: "/pds/$url",
          params: {
            url: value.replace("https:/", "").replace("pds/", ""),
          },
        });
      } else if (value === "typing") {
        navigate({ to: "/rnfgrertt/typing" });
      } else {
        // Allow handle lookups to start with @
        navigate({
          to: `/at:/${value.replace("at:/", "").replace(/^@/, "")}`,
        });
      }
      setOpen(false);
    }
  };

  useEffect(() => {
    if (isMobile()) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "k" &&
        isKeybindEnabled === true
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="relative w-full justify-start text-muted-foreground"
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          {!isMobile() && (
            <div className="md:flex items-center -mr-2 hidden">
              <KbdKey keys={[isOnMac() ? "cmd" : "ctrl", "k"]} />
            </div>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[800px] p-0 border-0 rounded-full bg-transparent">
        <form
          onSubmit={handleSubmit}
          className="relative backdrop-blur-3xl rounded-full"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter a handle, at url, or PDS url"
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            className="border focus-visible:ring-0 focus-visible:ring-offset-0 pl-12 py-6 text-lg rounded-xl shadow-lg dark:shadow-slate-950"
            autoCorrect="off"
            autoCapitalize="none"
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-x-2">
            {!isMobile() && <KbdKey keys={["esc"]} />}
            <X
              className="h-4 w-4 text-muted-foreground"
              onClick={() => setOpen(false)}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
