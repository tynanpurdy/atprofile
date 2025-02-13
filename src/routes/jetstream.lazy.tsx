import { createLazyFileRoute } from "@tanstack/react-router";
import { Collection, CommitEvent, Jetstream } from "@/lib/jetstream";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { RenderJson } from "@/components/renderJson";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  Trash,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { memo } from "preact/compat";

export const Route = createLazyFileRoute("/jetstream")({
  component: RouteComponent,
});

function useJetstreamManager() {
  const [records, setRecords] = useState<CommitEvent<Collection>[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [wantedCollections, setWantedCollections] = useState<string[]>([]);
  const [wantedDids, setWantedDids] = useState<string[]>([]);

  const jetstreamRef = useRef<Jetstream | null>(null);

  const addWantedCollection = useCallback(
    (collection: string) => {
      if (collection && !wantedCollections.includes(collection)) {
        setWantedCollections((prev) => [...prev, collection]);
        // Restart if connected
        if (isConnected) {
          stop();
          setTimeout(start, 0);
        }
      }
    },
    [wantedCollections, isConnected],
  );

  const removeWantedCollection = useCallback(
    (collection: string) => {
      setWantedCollections((prev) => prev.filter((c) => c !== collection));
      // Restart if connected
      if (isConnected) {
        stop();
        setTimeout(start, 0);
      }
    },
    [isConnected],
  );

  const addWantedDid = useCallback(
    (did: string) => {
      if (did && !wantedDids.includes(did)) {
        setWantedDids((prev) => [...prev, did]);
        // Restart if connected
        if (isConnected) {
          stop();
          setTimeout(start, 0);
        }
      }
    },
    [wantedDids, isConnected],
  );

  const removeWantedDid = useCallback(
    (did: string) => {
      setWantedDids((prev) => prev.filter((d) => d !== did));
      // Restart if connected
      if (isConnected) {
        stop();
        setTimeout(start, 0);
      }
    },
    [isConnected],
  );

  const start = useCallback(
    (cursor?: number) => {
      if (jetstreamRef.current) return;

      const jetstream = new Jetstream({
        wantedCollections: wantedCollections,
        wantedDids: wantedDids,
        cursor: cursor,
      });
      jetstreamRef.current = jetstream;

      jetstream.on("commit", (event) => {
        setRecords((r) => {
          return [event, ...r.slice(0, 30)];
        });
      });

      jetstream.start();
      setIsConnected(true);
    },
    [wantedCollections, wantedDids],
  );

  const stop = useCallback(() => {
    if (!jetstreamRef.current) return;

    jetstreamRef.current.close();
    jetstreamRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      if (jetstreamRef.current) {
        jetstreamRef.current.close();
      }
    };
  }, []);

  const clearRecords = () => {
    setRecords([]);
  };

  return {
    records,
    isConnected,
    start,
    stop,
    clearRecords,
    wantedCollections,
    addWantedCollection,
    removeWantedCollection,
    wantedDids,
    addWantedDid,
    removeWantedDid,
  };
}

const Suggestions = memo(function Suggestions({
  addItem,
  currentItems,
}: {
  addItem: (item: string) => void;
  currentItems: string[];
}) {
  const [randomSuggestions, setRandomSuggestions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  useEffect(() => {
    const suggestions = [
      { label: "Bluesky Posts", value: "app.bsky.feed.post" },
      { label: "Bluesky Follows", value: "app.bsky.graph.follow" },
      { label: "Bluesky Likes", value: "app.bsky.feed.like" },
      { label: "Bluesky Lists", value: "app.bsky.graph.list" },
      { label: "Bluesky Profiles", value: "app.bsky.actor.profile" },
      { label: "statusphere status", value: "xyz.statusphere.status" },
      { label: "bsky.app", value: "did:plc:z72i7hdynmk6r22z27h6tvur" },
      { label: "pfrazee.com", value: "did:plc:ragtjsm2j2vknwkz3zp4oxrd" },
      { label: "apenwarr.ca", value: "did:plc:7dudjk2uag3q4wb7l6vfe5yk" },
    ];

    const available = suggestions.filter(
      (item) => !currentItems.includes(item.value),
    );

    const random = [...available].sort(() => 0.5 - Math.random()).slice(0, 5);

    setRandomSuggestions(random);
  }, [currentItems]); // Only re-randomize when currentItems changes

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm text-foreground">Suggestions:</h3>
      <div className="flex flex-wrap gap-2">
        {randomSuggestions.map((suggestion) => (
          <button
            key={suggestion.value}
            onClick={() => {
              addItem(suggestion.value);
            }}
            className="text-sm px-2 py-1 bg-muted rounded-full hover:bg-muted/80"
          >
            {suggestion.label
              .split(" ")
              .map((m) =>
                m === "Bluesky" ? (
                  <img
                    src="/assets/services/bluesky.png"
                    className="inline h-4 -mt-1"
                  />
                ) : (
                  <span> {m}</span>
                ),
              )}
          </button>
        ))}
      </div>
    </div>
  );
});

function RouteComponent() {
  const jet = useJetstreamManager();

  const [newAddition, setNewAddition] = useState("");
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );
  const [isMoreExpanded, setMoreExpanded] = useState<boolean>(false);
  const [cursorInput, setCursorInput] = useState<number | undefined>();

  const addItem = async (item: string) => {
    item = item.trim();

    // Set loading state for this specific item
    setLoadingStates((prev) => ({ ...prev, [item]: true }));

    try {
      if (item.startsWith("did:")) {
        jet.addWantedDid(item);
      } else if ((item.match(/\./g) || []).length < 2) {
        // Handle handle resolution
        try {
          const response = await fetch(
            `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${item}`,
          );
          if (!response.ok) throw new Error("Failed to resolve handle");
          const data = await response.json();
          jet.addWantedDid(data.did);
        } catch (error) {
          // If handle resolution fails, try as collection
          jet.addWantedCollection(item);
        }
      } else {
        jet.addWantedCollection(item);
      }
    } finally {
      // Clear loading state for this item
      setLoadingStates((prev) => ({ ...prev, [item]: false }));
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const items = newAddition
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    // Process items sequentially
    for (const item of items) {
      await addItem(item);
    }
    setNewAddition("");
  };
  const currentItems = useMemo(
    () => [...jet.wantedDids, ...jet.wantedCollections],
    [jet.wantedDids, jet.wantedCollections],
  );
  const loading = Object.values(loadingStates).some(Boolean);
  return (
    <main className="h-screen w-full relative max-h-[calc(100vh-5rem)]">
      <div className="w-full max-w-screen-xl mx-auto py-16 gap-4 flex flex-col">
        <div className="px-4 lg:px-8 gap-4 flex flex-col w-full">
          <div className="flex flex-col md:flex-row">
            <div className="flex flex-row gap-4">
              <h1 className="text-4xl">Jetstream</h1>
              <div className="flex flex-row gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() =>
                    jet.isConnected ? jet.stop() : jet.start(cursorInput)
                  }
                >
                  {jet.isConnected ? <Pause /> : <Play />}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => jet.clearRecords()}
                  disabled={jet.records.length < 1}
                >
                  <Trash />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="flex md:hidden"
                  onClick={() => setMoreExpanded(!isMoreExpanded)}
                >
                  <ChevronRight
                    className={`${isMoreExpanded ? "md:rotate-180 -rotate-90" : "rotate-90 md:rotate-0"} transition-all`}
                  />
                </Button>
              </div>
            </div>
            <div className="flex items-center">
              <div
                className={`
                overflow-hidden transition-all duration-200 ease-in-out md:ml-2 pb-0.5
                ${isMoreExpanded ? "w-[200px] opacity-100 h-auto mt-2 md:mt-auto pr-2" : "w-0 h-0 opacity-0"}
              `}
              >
                <Input
                  type="number"
                  placeholder="Cursor"
                  value={cursorInput || ""}
                  onChange={(e) =>
                    setCursorInput(Number(e.currentTarget.value))
                  }
                  className="h-9"
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="hidden md:flex aspect-square h-0 md:h-auto"
                onClick={() => setMoreExpanded(!isMoreExpanded)}
              >
                <ChevronRight
                  className={`${isMoreExpanded ? "md:rotate-180 -rotate-90" : "rotate-90 md:rotate-0"} transition-all`}
                />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
            <Input
              placeholder="Add collection or DID to filter"
              value={newAddition}
              onChange={(e) => setNewAddition(e.currentTarget.value)}
            />
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => handleSubmit(e)}
              className="aspect-square"
              disabled={newAddition.length < 1 || loading}
            >
              {loading ? <LoaderCircle /> : <Plus />}
            </Button>
          </form>

          <Suggestions addItem={addItem} currentItems={currentItems} />

          {jet.wantedCollections.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm text-muted-foreground">
                Filtered collections:
              </h3>
              <div className="flex flex-wrap gap-1">
                {jet.wantedCollections.map((collection) => (
                  <div
                    key={collection}
                    className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
                  >
                    <span>{collection}</span>
                    <button
                      onClick={() => jet.removeWantedCollection(collection)}
                      className="hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {jet.wantedDids.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm text-muted-foreground">Filtered DIDs:</h3>
              <div className="flex flex-wrap gap-2">
                {jet.wantedDids.map((did) => (
                  <div
                    key={did}
                    className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
                  >
                    <span className="text-sm">{did}</span>
                    <button
                      onClick={() => jet.removeWantedDid(did)}
                      className="hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-full max-w-2xl overflow-x-auto lg:px-4">
          {jet.records.map((r) => (
            <div className="max-w-min text-wrap mb-8">
              <RenderJson pds="" did={r.did} data={r} />
            </div>
          ))}
          <div className="px-4 lg:px-8 ">
            {jet.records.length} records in cache.
          </div>
        </div>
        {jet.records.length < 1 && (
          <div className="px-4 lg:px-8 ">Nothing here. Start to see stuff.</div>
        )}
      </div>
    </main>
  );
}
