// literally just a feedPost but maybe with a "Reposted by" thing at the top. will need to get the original post!

import { AppBskyFeedRepost } from "@atcute/client/lexicons";
import { CollectionViewComponent, CollectionViewProps } from "../getView";
import { BlueskyPostWithoutEmbed } from "./embed";
import { Heart, TriangleAlert } from "lucide-react";

export const AppBskyFeedLikeView: CollectionViewComponent<
  CollectionViewProps
> = ({ data, repoData }: CollectionViewProps) => {
  const post = data.value as AppBskyFeedRepost.Record;

  return (
    <>
      <p className="py-1 text-muted-foreground">
        {" "}
        <Heart
          fill="#ba5678"
          stroke="#ba5678"
          className="inline mb-0.5 mr-1"
        />{" "}
        {repoData?.handle} liked
      </p>
      <BlueskyPostWithoutEmbed showEmbeddedPost uri={post.subject.uri} />
      <div className="mt-4 text-muted-foreground text-sm flex align-center gap-2 border p-2 rounded-lg">
        {" "}
        <TriangleAlert
          height="1.5rem"
          className="self-center text-yellow-500"
        />{" "}
        <p>
          Likes are typically not visible on Bluesky.
          <br />
          Treat the information presented with respect and care.
        </p>
      </div>
    </>
  );
};
