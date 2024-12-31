import { RenderJson } from "@/components/renderJson";
import { QtClient, useXrpc } from "@/providers/qtprovider";
import "@atcute/bluesky/lexicons";
import {
  ComAtprotoRepoDescribeRepo,
  ComAtprotoRepoGetRecord,
} from "@atcute/client/lexicons";
import {
  IdentityMetadata,
  resolveFromIdentity,
} from "@atcute/oauth-browser-client";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "preact/compat";

interface RepoData {
  data?: ComAtprotoRepoGetRecord.Output;
  repoInfo?: ComAtprotoRepoDescribeRepo.Output;
  identity?: IdentityMetadata;
  isLoading: boolean;
  error: Error | null;
}

function useRepoData(
  handle: string,
  collection: string,
  rkey: string,
): RepoData {
  const xrpc = useXrpc();
  const [state, setState] = useState<RepoData>({
    data: undefined,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchRepoData() {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const id = await resolveFromIdentity(handle);
        // we dont use the main authenticated client here
        const rpc = new QtClient(id.identity.pds);
        // get the PDS
        const response = await rpc
          .getXrpcClient()
          .get("com.atproto.repo.getRecord", {
            params: { repo: id.identity.id, collection, rkey },
            signal: abortController.signal,
          });
        // get the if we don't have it
        const record = await rpc
          .getXrpcClient()
          .get("com.atproto.repo.describeRepo", {
            params: { repo: id.identity.id },
            signal: abortController.signal,
          });
        // todo: actual errors
        setState({
          data: response.data,
          repoInfo: record.data,
          identity: id.identity,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        if (err.name === "AbortError") return;

        setState({
          data: undefined,
          isLoading: false,
          error: err instanceof Error ? err : new Error("An error occurred"),
        });
      }
    }

    fetchRepoData();

    return () => {
      abortController.abort();
    };
  }, [handle, xrpc]);

  return state;
}

export const Route = createLazyFileRoute("/at:/$handle/$collection/$rkey")({
  component: RouteComponent,
});

function RouteComponent() {
  const { handle, collection, rkey } = Route.useParams();
  const { data, repoInfo, identity, isLoading, error } = useRepoData(
    handle,
    collection,
    rkey,
  );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading && !data) {
    return (
      <div className="flex flex-row justify-center align-middle w-full h-full min-h-screen">
        (throbber here)
      </div>
    );
  }

  return (
    <div className="flex flex-row justify-center w-full min-h-screen">
      <div className="max-w-2xl w-screen p-4 md:mt-16 space-y-2">
        <Link href={`/at:/${identity?.raw}`} className="">
          <h1 className="text-2xl md:text-3xl text-muted-foreground font-normal">
            @{repoInfo?.handle}
            {repoInfo?.handleIsCorrect ? "" : " (invalid handle)"}
          </h1>
          <code>{identity?.id}</code>
        </Link>
        <div>
          PDS: {identity?.pds.hostname.includes("bsky.network") && "🍄"}{" "}
          {identity?.pds.hostname}
        </div>
        <div className="text-muted-foreground text-xs">
          if you see this message please bug me to add a custom view for this
          repo type
        </div>
        <div className="border-b" />
        <div className="w-full overflow-x-auto">
          <RenderJson data={data} did={identity?.id ?? ""} />
        </div>
      </div>
    </div>
  );
}
