import { JSX } from "preact/jsx-runtime";
import AppBskyFeedPostView from "./appBsky/feedPost";
import {
  ComAtprotoRepoDescribeRepo,
  ComAtprotoRepoGetRecord,
} from "@atcute/client/lexicons";
import { AppBskyFeedRepostView } from "./appBsky/feedRepost";
import { AppBskyFeedLikeView } from "./appBsky/feedLike";
import { AppBskyActorProfileView } from "./appBsky/actorProfile";
import CommunityLexiconCalendarEventView from "./CommunityLexicon/calendarEvent";
import EventsSmokesignalCalendarEventView from "./eventsSmokesignal/calendarEvent";

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
  "community.lexicon.calendar.event": CommunityLexiconCalendarEventView,
  "events.smokesignal.calendar.event": EventsSmokesignalCalendarEventView,
};

const getView = (
  type: string,
): CollectionViewComponent<CollectionViewProps> | null => {
  return viewMap[type] || null;
};

export default getView;
