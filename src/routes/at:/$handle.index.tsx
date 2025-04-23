import AllBacklinksViewer from "@/components/allBacklinksViewer";
import ShowError from "@/components/error";
import { RenderJson } from "@/components/renderJson";
import RepoIcons from "@/components/repoIcons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import Shadcn accordion components
import ClickToCopy from "@/components/ui/click-to-copy";
import { Loader } from "@/components/ui/loader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useStoredState } from "@/hooks/useStoredState"; // Import the hook
import getDidDoc from "@/lib/getDidDoc";
import { QtClient } from "@/providers/qtprovider";
import "@atcute/bluesky/lexicons";
import {
  AppBskyActorGetProfile,
  ComAtprotoRepoDescribeRepo,
} from "@atcute/client/lexicons";
import { DidDocument } from "@atcute/client/utils/did";
import {
  AuthorizationServerMetadata,
  IdentityMetadata,
  resolveFromIdentity,
} from "@atcute/oauth-browser-client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AtSign } from "lucide-react";
import { useState, useEffect } from "preact/compat";

interface RepoData {
  data?: ComAtprotoRepoDescribeRepo.Output;
  blueSkyData?: AppBskyActorGetProfile.Output | null;
  identity?: {
    identity: IdentityMetadata;
    metadata: AuthorizationServerMetadata;
  };
  isLoading: boolean;
  didDoc?: DidDocument;
  error: Error | null;
}

function useRepoData(handle: string): RepoData {
  //const xrpc = useXrpc();
  const [state, setState] = useState<RepoData>({
    data: undefined,
    isLoading: true,
    error: null,
  });

  useDocumentTitle(
    state.data?.handle ? `${state.data.handle} | atp.tools` : "atp.tools",
  );

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchRepoData() {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null })); // Reset error state

        let id;
        try {
          id = await resolveFromIdentity(handle);
        } catch (err: any) {
          throw new Error("Unable to resolve identity: " + err.message);
        }
        // we dont use the main authenticated client here
        const rpc = new QtClient(id.identity.pds);
        // get the PDS
        const response = await rpc
          .getXrpcClient()
          .get("com.atproto.repo.describeRepo", {
            params: { repo: id.identity.id },
            signal: abortController.signal,
          });
        let doc;
        try {
          doc = await getDidDoc(id.identity.id);
        } catch (error) {
          console.error("Failed to fetch DID document:", error);
          // Don't throw here, allow the rest of the data to load
        }
        // can we get bsky data?
        if (response.data.collections.includes("app.bsky.actor.profile")) {
          // Fetch Bluesky profile data using a public client
          const bskyData = await new QtClient(
            new URL("https://public.api.bsky.app"),
          )
            .getXrpcClient()
            .get("app.bsky.actor.getProfile", {
              params: { actor: id.identity.id },
              signal: abortController.signal, // Pass signal here too
            });

          setState({
            blueSkyData: bskyData.data,
            data: response.data,
            identity: id,
            isLoading: false,
            didDoc: doc,
            error: null,
          });
        } else {
          setState({
            blueSkyData: null,
            data: response.data,
            identity: id,
            isLoading: false,
            didDoc: doc,
            error: null,
          });
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;

        console.error("Failed to fetch repo data:", err); // Log the error for debugging
        setState({
          data: undefined,
          blueSkyData: undefined, // Clear blueSkyData on error
          identity: undefined, // Clear identity on error
          isLoading: false,
          didDoc: undefined, // Clear didDoc on error
          error:
            err instanceof Error ? err : new Error("An unknown error occurred"),
        });
      }
    }

    fetchRepoData();

    return () => {
      abortController.abort();
    };
  }, [handle]); // Removed xrpc dependency as it's not directly used in effect logic

  return state;
}

export const Route = createFileRoute("/at:/$handle/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { handle } = Route.useParams();
  const { blueSkyData, data, identity, isLoading, error, didDoc } =
    useRepoData(handle);

  // State for accordion collapse, using the handle in the key for uniqueness
  const [didDocOpenValue, setDidDocOpenValue] = useStoredState<string>(
    `did-doc-open-${handle}`, // Unique key per handle
    "", // Default to closed (empty string value)
  );

  if (error) {
    return <ShowError error={error} />;
  }

  // Show loader only if essential data (repo description) is still loading
  if (isLoading && !data) {
    return <Loader className="max-h-[calc(100vh-5rem)] h-screen" />;
  }

  // Handle case where repo description loaded but identity resolution failed earlier
  if (!identity && !isLoading) {
    return (
      <ShowError
        error={
          new Error("Failed to resolve identity or fetch repository data.")
        }
      />
    );
  }

  return (
    <div className="flex flex-row justify-center w-full min-h-[calc(100vh-5rem)]">
      <div className="max-w-md lg:max-w-2xl w-[90vw] mx-4 my-4 md:mt-8 space-y-2">
        {blueSkyData ? (
          blueSkyData?.banner ? (
            <div className="relative mb-12 md:mb-16">
              <img
                src={blueSkyData?.banner}
                className="w-full lg:h-52 rounded-lg scale-[108%] lg:scale-125 -z-10 border object-cover"
              />
              <img
                src={blueSkyData?.avatar}
                className="absolute -bottom-12 md:-bottom-16 w-24 lg:w-32 aspect-square rounded-full border"
              />
            </div>
          ) : blueSkyData.avatar ? (
            <img src={blueSkyData?.avatar} className="w-32 h-32 rounded-full" />
          ) : (
            <div className="w-32 h-32 bg-neutral-500 rounded-full grid place-items-center">
              <AtSign className="w-16 h-16" />
            </div>
          )
        ) : (
          <div className="w-32 h-32 bg-neutral-500 rounded-full grid place-items-center">
            <AtSign className="w-16 h-16" />
          </div>
        )}
        <ClickToCopy
          className="text-2xl md:text-3xl font-bold pt-2"
          value={data?.handle}
        >
          {blueSkyData?.displayName || data?.handle}{" "}
          <span className="text-muted-foreground font-normal block md:inline">
            @{data?.handle}
            {data?.handleIsCorrect === false && (
              <span className="text-orange-600 dark:text-orange-400">
                (unverified handle)
              </span>
            )}
          </span>
        </ClickToCopy>
        {data?.collections && identity && (
          <div className="flex flex-row pb-2 flex-wrap gap-0">
            <RepoIcons
              collections={data.collections}
              handle={data.handle}
              did={identity.identity.id}
            />
          </div>
        )}
        {data?.did && (
          <ClickToCopy
            className="block text-sm text-muted-foreground break-all"
            value={data.did}
          >
            {data.did}
          </ClickToCopy>
        )}
        {identity?.identity.pds && (
          <ClickToCopy
            className="text-sm"
            value={identity.identity.pds.hostname}
          >
            PDS:{" "}
            {identity.identity.pds.hostname.includes("bsky.network") && "🍄"}{" "}
            <a
              href={`https://${identity.identity.pds.hostname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {identity.identity.pds.hostname}
            </a>
          </ClickToCopy>
        )}
        {data?.collections && data.collections.length > 0 && (
          <div className="pt-2">
            <h2 className="text-xl font-bold mb-1">Collections</h2>
            <ul className="list-inside space-y-1">
              {data.collections.map((c) => (
                <li
                  key={c}
                  className="text-blue-500 hover:no-underline border-b hover:border-border border-transparent w-min"
                >
                  <Link
                    to="/at:/$handle/$collection"
                    params={{
                      handle: handle, // Use original handle for navigation consistency
                      collection: c,
                    }}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Collapsible DID Document Section */}
        {didDoc && identity && (
          <Accordion
            type="single"
            collapsible
            className="w-full pt-2"
            value={didDocOpenValue}
            onValueChange={setDidDocOpenValue}
          >
            <AccordionItem value="did-doc">
              <AccordionTrigger className="text-2xl font-semibold hover:no-underline py-2">
                DID Document
              </AccordionTrigger>
              <AccordionContent>
                <div className="w-full overflow-x-auto rounded-md border bg-muted/30 p-2 mt-1">
                  {" "}
                  {/* Added background and padding */}
                  <RenderJson
                    data={didDoc}
                    did={identity.identity.id}
                    pds={identity.identity.pds.toString()}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        {/* Backlinks Section */}
        {data?.did && (
          <div className="pt-4 pb-8 flex flex-col gap-2">
            <AllBacklinksViewer aturi={data.did} />
          </div>
        )}
      </div>
    </div>
  );
}
