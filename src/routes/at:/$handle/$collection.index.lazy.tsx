import ShowError from "@/components/error";
import { Loader } from "@/components/ui/loader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QtClient } from "@/providers/qtprovider";
import { RenderJson } from "@/components/renderJson";
import {
  ComAtprotoRepoGetRecord,
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

// State to hold fetched data for the *currently* hovered card
interface HoveredRecordState {
  uri: string | null; // Which URI is being hovered/fetched for
  data: ComAtprotoRepoGetRecord.Output | null;
  loading: boolean;
  error: Error | null;
}

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

  // State for the *single* actively fetched/displayed hover card
  const [hoveredRecordState, setHoveredRecordState] =
    useState<HoveredRecordState>({
      uri: null,
      data: null,
      loading: false,
      error: null,
    });
  // Ref to prevent fetching multiple times if hover is rapid
  const fetchTimeoutRef = useRef<number | null>(null);

  useDocumentTitle(records ? `${collection} | atp.tools` : "atp.tools");

  // Function to fetch single record data (triggered by HoverCard)
  const fetchHoverRecordData = async (recordUri: string) => {
    if (!identity || hoveredRecordState.uri === recordUri) return; // Don't refetch if already fetched/fetching for this URI

    // Clear previous fetch timeout if any
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set loading state for the new URI
    setHoveredRecordState({
      uri: recordUri,
      data: null,
      loading: true,
      error: null,
    });

    // Use a timeout to delay the actual fetch slightly
    fetchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const rpc = new QtClient(identity.pds);
        const recordParts = recordUri.replace("at://", "").split("/");
        if (recordParts.length !== 3) throw new Error("Invalid record URI");

        const response = await rpc
          .getXrpcClient()
          .get("com.atproto.repo.getRecord", {
            params: {
              repo: recordParts[0],
              collection: recordParts[1],
              rkey: recordParts[2],
            },
          });

        // Update state only if the URI still matches the one we started fetching for
        setHoveredRecordState(
          (prev) =>
            prev.uri === recordUri
              ? { ...prev, data: response.data, loading: false, error: null }
              : prev, // Ignore if URI changed during fetch
        );
      } catch (err: any) {
        console.error("Failed to fetch record on hover:", err);
        // Update state only if the URI still matches
        setHoveredRecordState(
          (prev) =>
            prev.uri === recordUri
              ? {
                  ...prev,
                  data: null,
                  loading: false,
                  error:
                    err instanceof Error
                      ? err
                      : new Error("Failed to fetch record"),
                }
              : prev, // Ignore if URI changed during fetch
        );
      } finally {
        fetchTimeoutRef.current = null;
      }
    }, 150); // ~150ms delay before fetching starts
  };

  const resetHoverState = () => {
    // Clear fetch timeout if card closes before fetch starts
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    // Optionally reset state immediately, or let HoverCard handle closing visual
    // setHoveredRecordState({ uri: null, data: null, loading: false, error: null });
  };

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
    // No relative positioning needed on the parent here
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

        <h2 className="text-2xl">{collection} collections:</h2>
        <div>
          <ul className="list-none p-0 m-0">
            {records?.map((r) => (
              <li key={r.uri} className="py-1">
                {" "}
                {/* Remove hover styling/handlers from li */}
                <HoverCard
                  openDelay={200} // Standard delay before opening
                  closeDelay={100} // Standard delay before closing
                  onOpenChange={(isOpen) => {
                    if (isOpen) {
                      fetchHoverRecordData(r.uri);
                    } else {
                      resetHoverState();
                    }
                  }}
                >
                  <HoverCardTrigger asChild>
                    {/* The Link component itself triggers the hover card */}
                    <Link
                      className="text-blue-600 dark:text-blue-400 hover:underline" // Add underline on hover for affordance
                      to="/at:/$handle/$collection/$rkey"
                      params={{
                        handle: handle, // or identity?.raw ?? handle
                        collection: collection,
                        rkey: r.uri.split("/").pop() ?? "",
                      }}
                    >
                      {r.uri.split("/").pop()}
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-auto max-w-lg max-h-96 overflow-auto text-xs" // Adjust width/styling as needed
                    // Optional: Add side="top|bottom|left|right" align="start|center|end" for positioning
                    side="right"
                    align="start"
                  >
                    {/* Render content based on the shared hover state, *if* the URI matches */}
                    {hoveredRecordState.uri === r.uri ? (
                      <>
                        {hoveredRecordState.loading && <Loader />}
                        {hoveredRecordState.error && (
                          <ShowError error={hoveredRecordState.error} />
                        )}
                        {hoveredRecordState.data && identity && (
                          <RenderJson
                            data={hoveredRecordState.data.value}
                            did={identity.id}
                            pds={identity.pds.toString()}
                          />
                        )}
                      </>
                    ) : (
                      // Can show a mini-loader here too if desired while waiting for fetchHoverRecordData to set loading state
                      <Loader />
                    )}
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
