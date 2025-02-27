import ShowError from "@/components/error";
import { Loader } from "@/components/ui/loader";
import { QtContext } from "@/providers/qtprovider";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useContext, useEffect, useState } from "preact/hooks";

export const Route = createLazyFileRoute("/auth/callback")({
  component: RouteComponent,
});

function RouteComponent() {
  let qt = useContext(QtContext);
  const [error, setError] = useState<Error | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);
  if (!qt) return null;
  // do this once
  useEffect(() => {
    const handleAuthorization = async () => {
      try {
        const params = new URLSearchParams(location.hash.slice(1));
        if (params) {
          await qt.client.finalizeAuthorization(params);
        }
      } catch (error) {
        console.error(error);
        setError(error as Error);
      } finally {
        setIsDone(true);
        setTimeout(() => {
          // get location from local storage
          const previousUrl = localStorage.getItem("previousUrl");
          if (previousUrl) {
            const [url, timestamp] = previousUrl.split(":");
            if (Date.now() - parseInt(timestamp) < 5000) {
              console.log(`Redirecting to previous URL: ${url}`);
              localStorage.removeItem("previousUrl");
              window.location.href = url;
            } else {
              console.log(`Previous URL expired`);
              localStorage.removeItem("previousUrl");
              window.location.href = "/";
            }
          } else {
            window.location.href = "/";
          }
        }, 200);
      }
    };
    handleAuthorization();
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {error ? (
        <ShowError error={error} />
      ) : isDone ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <Check className="text-green-500" height={64} width="full" />
          <p className="text-lg">Done! Redirecting shortly...</p>
        </div>
      ) : (
        <Loader />
      )}
    </div>
  );
}
