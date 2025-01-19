import ShowError from "@/components/error";
import { RenderJson } from "@/components/renderJson";
import { SplitText } from "@/components/segmentedText";
import { Loader } from "@/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import getView from "@/components/views/getView";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
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

  useDocumentTitle(
    repoInfo
      ? `${repoInfo?.handle ? `${repoInfo.handle} | ` : ""}${collection} | atp.tools`
      : "atp.tools",
  );

  if (error) {
    return <ShowError error={error} />;
  }

  if (isLoading && !data) {
    return <Loader className="min-h-screen" />;
  }

  if (data === undefined) return <div>No data</div>;

  // doing 'as any' here but $type is guaranteed to be on here.
  const View = getView((data.value as any).$type);

  return (
    <div className="flex flex-row justify-center w-full min-h-screen">
      <div className="max-w-2xl w-screen p-4 md:mt-16 space-y-2">
        <Link
          to={`/at:/$handle`}
          params={{
            handle: repoInfo?.did || "",
          }}
          className=""
        >
          <div>
            <h1 className="text-2xl md:text-3xl text-muted-foreground font-normal">
              @{repoInfo?.handle}
              {repoInfo?.handleIsCorrect ? "" : " (invalid handle)"}
            </h1>
            <code>{identity?.id}</code>
          </div>
        </Link>
        <div>
          PDS: {identity?.pds.hostname.includes("bsky.network") && "🍄"}{" "}
          {identity?.pds.hostname}
        </div>
        {!View && (
          <div className="text-muted-foreground text-xs">
            if you see this message please bug me to add a custom view for this
            repo type
          </div>
        )}
        <div className="border-b" />
        <Tabs defaultValue={View ? "view" : "json"} className="w-full">
          <TabsList>
            {View && <TabsTrigger value="view">View</TabsTrigger>}
            <TabsTrigger value="json">Json</TabsTrigger>
            <TabsTrigger value="text">Json (Text)</TabsTrigger>
          </TabsList>
          {View && (
            <TabsContent value="view" className="w-full overflow-x-auto">
              <View data={data} repoData={repoInfo} />
            </TabsContent>
          )}
          <TabsContent value="json" className="w-full overflow-x-auto">
            <RenderJson data={data} did={identity?.id ?? ""} />
          </TabsContent>
          <TabsContent value="text" className="w-full overflow-x-auto">
            <div className="whitespace-pre-wrap font-mono">
              <SplitText text={JSON.stringify(data, null, 4)} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
