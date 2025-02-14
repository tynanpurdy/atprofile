import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QtContext } from "@/providers/qtprovider";
import { createLazyFileRoute } from "@tanstack/react-router";
import { AtSign } from "lucide-react";
import { useContext, useState } from "preact/hooks";

export const Route = createLazyFileRoute("/auth/login")({
  component: RouteComponent,
});

function RouteComponent() {
  // get xrpc
  let qt = useContext(QtContext);
  let [user, setUser] = useState("");
  let [isResolving, setIsResolving] = useState(false);
  if (!qt) return null;
  const onRedirectIntent = async () => {
    setIsResolving(true);
    const resolved = await qt.client.resolveHandle(user);
    if (qt.accounts.includes(resolved.identity.id)) {
      // switch to user
      try {
        qt.client.switchAccount(resolved.identity.id);
        // redirect to dashboard
        window.location.href = "/";
        return;
      } catch (error) {
        console.error(error);
      }
    }
    const uri = await qt.client.getOAuthRedirectUri(resolved);
    window.location.href = uri.toString();
    setIsResolving(false);
  };
  return (
    <div className="max-h-[calc(100vh-5rem)] h-screen flex flex-col items-center justify-center">
      <div className="max-w-md w-screen bg-card border py-6 px-6 gap-4 flex flex-col rounded-lg">
        <AtSign height={64} width={64} className="text-blue-500" />
        <p className="text-lg">Log in with your ATProto account</p>
        <form
          onSubmitCapture={onRedirectIntent}
          className="flex flex-col items-end gap-4"
        >
          <Input
            placeholder="alice.bsky.social"
            value={user}
            onChange={(e: Event) => {
              const target = e.target as HTMLInputElement;
              setUser(target.value);
            }}
            onSubmitCapture={onRedirectIntent}
          />
          <Button onClick={onRedirectIntent} disabled={isResolving}>
            {isResolving ? "Loading..." : "Log In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
