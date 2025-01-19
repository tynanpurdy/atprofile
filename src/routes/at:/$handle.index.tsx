import ShowError from "@/components/error";
import RepoIcons from "@/components/repoIcons";
import { Loader } from "@/components/ui/loader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { QtClient, useXrpc } from "@/providers/qtprovider";
import "@atcute/bluesky/lexicons";
import {
  AppBskyActorGetProfile,
  ComAtprotoRepoDescribeRepo,
} from "@atcute/client/lexicons";
import {
  IdentityMetadata,
  resolveFromIdentity,
} from "@atcute/oauth-browser-client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AtSign } from "lucide-react";
import { useState, useEffect } from "preact/compat";

interface RepoData {
  data?: ComAtprotoRepoDescribeRepo.Output;
  blueSkyData?: AppBskyActorGetProfile.Output | null;
  identity?: IdentityMetadata;
  isLoading: boolean;
  error: Error | null;
}

function useRepoData(handle: string): RepoData {
  const xrpc = useXrpc();
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
        setState((prev) => ({ ...prev, isLoading: true }));

        const id = await resolveFromIdentity(handle);
        // we dont use the main authenticated client here
        const rpc = new QtClient(id.identity.pds);
        // get the PDS
        const response = await rpc
          .getXrpcClient()
          .get("com.atproto.repo.describeRepo", {
            params: { repo: id.identity.id },
            signal: abortController.signal,
          });
        // can we get bsky data?
        if (response.data.collections.includes("app.bsky.actor.profile")) {
          // reuse client dumbass
          const bskyData = await new QtClient(
            new URL("https://public.api.bsky.app"),
          )
            .getXrpcClient()
            .get("app.bsky.actor.getProfile", {
              params: { actor: id.identity.id },
            });

          setState({
            blueSkyData: bskyData.data,
            data: response.data,
            identity: id.identity,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            blueSkyData: null,
            data: response.data,
            identity: id.identity,
            isLoading: false,
            error: null,
          });
        }
        // todo: actual errors
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

export const Route = createFileRoute("/at:/$handle/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { handle } = Route.useParams();
  const { blueSkyData, data, identity, isLoading, error } = useRepoData(handle);
  if (error) {
    return <ShowError error={error} />;
  }

  if (isLoading && !blueSkyData) {
    return <Loader className="min-h-screen" />;
  }

  return (
    <div className="flex flex-row justify-center w-full min-h-screen">
      <div className="max-w-2xl w-screen p-4 md:mt-16 space-y-2">
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
          ) : (
            <img src={blueSkyData?.avatar} className="w-32 h-32 rounded-full" />
          )
        ) : (
          <div className="w-32 h-32 bg-neutral-500 rounded-full grid place-items-center">
            <AtSign className="w-16 h-16" />
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold">
          {blueSkyData?.displayName}{" "}
          <span className="text-muted-foreground font-normal">
            @{data?.handle}
            {data?.handleIsCorrect ? "" : " (invalid handle)"}
          </span>
        </h1>

        {data?.collections && (
          <div className="flex flex-row pb-2">
            <RepoIcons
              collections={data?.collections}
              handle={data?.handle}
              did={identity?.id}
            />
          </div>
        )}
        <code>{data?.did}</code>
        <br />

        <div>
          PDS: {identity?.pds.hostname.includes("bsky.network") && "🍄"}{" "}
          {identity?.pds.hostname}
        </div>

        <div>
          <h2 className="text-xl font-bold">Collections</h2>
          <ul>
            {data?.collections.map((c) => (
              <li key={c} className="text-blue-500">
                <Link
                  to="/at:/$handle/$collection"
                  params={{
                    handle: handle,
                    collection: c,
                  }}
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
