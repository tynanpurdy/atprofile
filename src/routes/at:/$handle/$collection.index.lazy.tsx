import ShowError from "@/components/error";
import { Loader } from "@/components/ui/loader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QtClient } from "@/providers/qtprovider";
import { RenderJson } from "@/components/renderJson";
import {
  // ComAtprotoRepoGetRecord, // Removed as it's no longer needed for hover
  ComAtprotoRepoListRecords,
} from "@atcute/client/lexicons";
import {
  IdentityMetadata,
  resolveFromIdentity,
} from "@atcute/oauth-browser-client";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "preact/hooks";
// Import HoverCard components
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export const Route = createLazyFileRoute("/at:/$handle/$collection/")({
  component: RouteComponent,
});

interface CollectionRecords {
  identity?: IdentityMetadata;
  records?: ComAtprotoRepoListRecords.Output["records"];
  cursor?: ComAtprotoRepoListRecords.Output["cursor"];
  isLoading: boolean;
  fetchMore: (cursor: string) => Promise<void>;
  error: Error | null;
}

// State for hovered record removed

function useCollectionRecords(
  handle: string,
  collection: string,
): CollectionRecords {
  // (Keep the existing useCollectionRecords hook as is)
  const [state, setState] = useState<CollectionRecords>({
    isLoading: false,
    error: null,
    fetchMore: async () => {},
  });

  async function fetchRepoData(cursor?: string) {
    try {
      if (state.isLoading) return;

      setState((prev) => ({ ...prev, isLoading: true }));

      let id;
      try {
        id = await resolveFromIdentity(handle);
      } catch (err: any) {
        throw new Error("Unable to resolve identity: " + err.message);
      }
      // QtClient is still needed here for listRecords
      const rpc = new QtClient(id.identity.pds);

      const response = await rpc
        .getXrpcClient()
        .get("com.atproto.repo.listRecords", {
          params: {
            repo: id.identity.id,
            collection,
            limit: 100,
            cursor,
          },
        });

      setState((prev) => ({
        ...prev,
        records: cursor
          ? [...(prev.records || []), ...response.data.records]
          : response.data.records,
        identity: id.identity,
        cursor: response.data.cursor,
        isLoading: false,
        error: null,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          err instanceof Error
            ? err
            : new Error("Unable to resolve identity: " + err.message),
      }));
    }
  }

  const fetchMore = async (cursor: string) => {
    if (cursor && !state.isLoading) {
      await fetchRepoData(cursor);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRepoData();
  }, [handle, collection]);

  return { ...state, fetchMore };
}

function RouteComponent() {
  const { handle, collection } = Route.useParams();
  const { records, identity, isLoading, error, fetchMore, cursor } =
    useCollectionRecords(handle, collection);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Removed hoveredRecordState and fetchTimeoutRef

  useDocumentTitle(records ? `${collection} | atp.tools` : "atp.tools");

  // Removed fetchHoverRecordData function
  // Removed resetHoverState function

  useEffect(() => {
    // (Intersection Observer logic remains the same)
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoading && cursor) {
          fetchMore(cursor);
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [cursor, isLoading, fetchMore]);

  if (error) {
    return <ShowError error={error} />;
  }

  if ((isLoading && !cursor) || !records) {
    return <Loader className="max-h-[calc(100vh-5rem)] h-screen" />;
  }

  return (
    <div className="flex flex-row justify-center w-full min-h-[calc(100vh-5rem)]">
      <div className="max-w-md lg:max-w-2xl w-[90vw] mx-4 md:mt-16 space-y-2">
        {/* Header Link and PDS info */}
        <Link
          to="/at:/$handle"
          params={{ handle: identity?.raw ?? "" }}
          className=""
        >
          <div>
            <h1 className="text-2xl md:text-3xl text-muted-foreground font-normal">
              @{identity?.raw}
            </h1>
            <code>{identity?.id}</code>
          </div>
        </Link>
        <div>
          PDS: {identity?.pds.hostname.includes("bsky.network") && "🍄"}{" "}
          {identity?.pds.hostname}
        </div>

        <h2 className="text-2xl">{collection} records:</h2>
        <div>
          <ul className="list-none p-0 m-0">
            {records?.map((r) => (
              <li key={r.uri} className="py-1">
                <HoverCard
                  openDelay={100}
                  closeDelay={100}
                  // Removed onOpenChange handler
                >
                  <HoverCardTrigger asChild>
                    <Link
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      to="/at:/$handle/$collection/$rkey"
                      params={{
                        handle: handle,
                        collection: collection,
                        rkey: r.uri.split("/").pop() ?? "",
                      }}
                    >
                      {r.uri.split("/").pop()}
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-auto max-w-lg max-h-96 overflow-auto text-xs bg-background/40 backdrop-blur-md"
                    side="bottom"
                    align="start"
                  >
                    <RenderJson
                      data={r.value}
                      did={identity?.id!}
                      pds={identity?.pds.toString()!}
                    />
                  </HoverCardContent>
                </HoverCard>
              </li>
            ))}
          </ul>

          {/* Infinite scroll loader */}
          <div
            ref={loaderRef}
            className="flex flex-row justify-center h-10 -pt-16"
          >
            {isLoading && (
              <div className="text-center text-sm text-muted-foreground mx-10">
                Loading more...
              </div>
            )}
            {!isLoading && !cursor && (
              <div className="text-center text-sm text-muted-foreground mx-10 mt-2">
                that's all, folks!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
