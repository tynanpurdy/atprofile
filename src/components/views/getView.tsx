import { JSX } from "preact/jsx-runtime";
import AppBskyFeedPostView from "./app-bsky/feedPost";
import {
  ComAtprotoRepoDescribeRepo,
  ComAtprotoRepoGetRecord,
} from "@atcute/client/lexicons";
import { AppBskyFeedRepostView } from "./app-bsky/feedRepost";
import { AppBskyFeedLikeView } from "./app-bsky/feedLike";
import { AppBskyActorProfileView } from "./app-bsky/actorProfile";

export type CollectionViewComponent<T = {}> = (
  props: React.HTMLAttributes<HTMLDivElement> & T,
) => JSX.Element;

export interface CollectionViewProps
  extends React.HTMLAttributes<HTMLDivElement> {
  data: ComAtprotoRepoGetRecord.Output;
  repoData?: ComAtprotoRepoDescribeRepo.Output;
}

const viewMap: Record<
  string,
  CollectionViewComponent<CollectionViewProps> | undefined
> = {
  "app.bsky.feed.post": AppBskyFeedPostView,
  "app.bsky.feed.repost": AppBskyFeedRepostView,
  "app.bsky.feed.like": AppBskyFeedLikeView,
  "app.bsky.actor.profile": AppBskyActorProfileView,
};

const getView = (
  type: string,
): CollectionViewComponent<CollectionViewProps> | null => {
  return viewMap[type] || null;
};

export default getView;
