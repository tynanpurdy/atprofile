import { JSX } from "preact/jsx-runtime";
import AppBskyFeedPostView from "./app-bsky/feedPost";
import {
  ComAtprotoRepoDescribeRepo,
  ComAtprotoRepoGetRecord,
} from "@atcute/client/lexicons";

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
};

const getView = (
  type: string,
): CollectionViewComponent<CollectionViewProps> | null => {
  return viewMap[type] || null;
};

export default getView;
