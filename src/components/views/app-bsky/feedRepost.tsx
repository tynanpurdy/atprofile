// literally just a feedPost but maybe with a "Reposted by" thing at the top. will need to get the original post!

import { AppBskyFeedRepost } from "@atcute/client/lexicons";
import { CollectionViewComponent, CollectionViewProps } from "../getView";
import { BlueskyPostWithoutEmbed } from "./embed";
import { Repeat2 } from "lucide-react";

export const AppBskyFeedRepostView: CollectionViewComponent<
  CollectionViewProps
> = ({ data, repoData }: CollectionViewProps) => {
  const post = data.value as AppBskyFeedRepost.Record;

  return (
    <>
      <p className="py-1 text-muted-foreground">
        {" "}
        <Repeat2 className="inline mb-0.5 mr-1" /> {repoData?.handle} reposted{" "}
      </p>
      <BlueskyPostWithoutEmbed showEmbeddedPost uri={post.subject.uri} />
    </>
  );
};
