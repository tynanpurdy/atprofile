import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QtClient } from "@/providers/qtprovider";
import { ComAtprotoRepoListRecords } from "@atcute/client/lexicons";
import {
  IdentityMetadata,
  resolveFromIdentity,
} from "@atcute/oauth-browser-client";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "preact/hooks";

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

function useCollectionRecords(
  handle: string,
  collection: string,
): CollectionRecords {
  const [state, setState] = useState<CollectionRecords>({
    isLoading: false,
    error: null,
    fetchMore: async () => {},
  });

  const fetchRepoData = async (cursor?: string) => {
    try {
      if (state.isLoading) return;

      setState((prev) => ({ ...prev, isLoading: true }));

      const id = await resolveFromIdentity(handle);
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
        error: err instanceof Error ? err : new Error("An error occurred"),
      }));
    }
  };

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

  useDocumentTitle(records ? `${collection} | atp.tools` : "atp.tools");

  useEffect(() => {
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
    return <div>Error: {error.message}</div>;
  }

  if ((isLoading && !cursor) || !records) {
    return (
      <div className="flex flex-row justify-center w-full min-h-screen">
        (throbber here)
      </div>
    );
  }

  return (
    <div className="flex flex-row justify-center w-full min-h-screen">
      <div className="max-w-2xl w-screen p-4 md:mt-16 space-y-2">
        <Link href={`/at:/${identity?.raw}`} className="">
          <h1 className="text-2xl md:text-3xl text-muted-foreground font-normal">
            @{identity?.raw}
          </h1>
          <code>{identity?.id}</code>
        </Link>
        <div>
          PDS: {identity?.pds.hostname.includes("bsky.network") && "🍄"}{" "}
          {identity?.pds.hostname}
        </div>

        <h2 className="text-2xl">{collection} collections:</h2>
        <div>
          <ul>
            {records?.map((r) => (
              <li key={r.uri} className="text-blue-500">
                <Link href={`/${r.uri}`}>{r.uri.split("/").pop()}</Link>
              </li>
            ))}
          </ul>

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
              <div className="text-center text-sm text-muted-foreground mx-10">
                that's all, folks!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
