import { useEffect, useState } from "preact/hooks";
import { CollectionViewComponent, CollectionViewProps } from "../getView";
import {
  AppBskyActorGetProfile,
  AppBskyFeedPost,
} from "@atcute/client/lexicons";
import { QtClient } from "@/providers/qtprovider";
import { SegmentedText } from "@/components/segmentedText";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import BlueskyEmbed from "./embed";

const AppBskyFeedPostView: CollectionViewComponent<CollectionViewProps> = ({
  data,
  repoData,
}: CollectionViewProps) => {
  const post = data.value as AppBskyFeedPost.Record;
  // get actor repo data for Bluesky pfp
  const actorProfile = useAppBskyActorProfile(repoData?.did);

  return (
    <div className="border p-6 py-3 rounded-md">
      {post.reply?.root && post.reply?.root.uri !== post.reply.parent.uri && (
        <div className="text-sm text-muted-foreground">
          Root post:{" "}
          <Link href={"/" + post.reply?.root.uri}>{post.reply?.root.uri}</Link>
        </div>
      )}
      {post.reply?.parent && (
        <div className="text-sm text-muted-foreground mb-3">
          Parent post:{" "}
          <Link href={"/" + post.reply?.parent.uri}>
            {post.reply?.parent.uri}
          </Link>
        </div>
      )}
      <div className="flex items-center">
        {actorProfile === undefined ? (
          <div className="w-14 h-1 rounded-full mr-3 bg-gray-500 animate-pulse" />
        ) : (
          <div className="flex flex-row items-start">
            <img
              src={actorProfile?.avatar}
              alt={actorProfile?.displayName + "'s avatar"}
              className="w-14 h-14 rounded-full mr-3 transition-opacity duration-300"
            />
            <div className="flex flex-col">
              <div className="font-bold">
                {actorProfile?.displayName}{" "}
                <span className="font-normal text-gray-500">
                  @{actorProfile?.handle}
                </span>
              </div>
              <SegmentedText text={post.text} facets={post.facets ?? []} />
              {post.embed && (
                <Link className="mt-2">
                  <BlueskyEmbed embed={post.embed} did={repoData?.did || ""} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-500 mt-3 pl-[4.25rem]">
        <a
          href={`https://bsky.app/profile/${repoData?.did}/post/${data.uri.split("/").pop()}`}
        >
          View on{" "}
          <img
            src="/assets/services/bluesky.png"
            className="mb-1 inline h-4 pl-0.5 grayscale"
            alt="Bluesky"
          />{" "}
          Bluesky
          <ArrowRight height="1rem" className="inline-block mb-0.5" />
        </a>
      </div>
    </div>
  );
};

export default AppBskyFeedPostView;

function useAppBskyActorProfile(did: string | undefined) {
  const [repoData, setRepoData] = useState<AppBskyActorGetProfile.Output>();

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchRepoData() {
      try {
        if (did) {
          const rpc = new QtClient(new URL("https://public.api.bsky.app"));
          const response = await rpc
            .getXrpcClient()
            .get("app.bsky.actor.getProfile", {
              params: { actor: did },
              signal: abortController.signal,
            });
          setRepoData(response.data);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;

        setRepoData(undefined);
      }
    }

    fetchRepoData();

    return () => {
      abortController.abort();
    };
  }, [did]);

  return repoData;
}
