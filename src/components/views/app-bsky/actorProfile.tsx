import { AppBskyActorProfile } from "@atcute/client/lexicons";
import { CollectionViewComponent, CollectionViewProps } from "../getView";
import { getBlueskyCdnLink } from "@/components/json/appBskyEmbedImages";
import { AtSign, Pin, Tag, WalletCards } from "lucide-react";
import { preprocessText } from "@/lib/preprocess";
import { BlueskyPostWithoutEmbed } from "./embed";
import { Link } from "@tanstack/react-router";

const StarterPackInfo = ({
  profile,
}: {
  profile: AppBskyActorProfile.Record;
}) => {
  if (!profile.joinedViaStarterPack) return null;

  const [, , handle, collection, rkey] =
    profile.joinedViaStarterPack.uri.split("/");

  return (
    <>
      <WalletCards height="1rem" className="inline" />
      <Link
        to="/at:/$handle/$collection/$rkey"
        params={{ handle, collection, rkey }}
        className="text-muted-foreground text-sm mt-4 mb-1"
      >
        Joined via starter pack: {profile.joinedViaStarterPack.uri}
      </Link>
    </>
  );
};

export const AppBskyActorProfileView: CollectionViewComponent<
  CollectionViewProps
> = ({ data, repoData }: CollectionViewProps) => {
  const profile = data.value as AppBskyActorProfile.Record;
  return (
    <>
      {profile ? (
        profile?.banner ? (
          <div className="relative">
            <img
              src={getBlueskyCdnLink(
                repoData?.did!,
                profile?.banner?.ref.$link,
                "jpeg",
              )}
              className="w-full rounded-lg -z-10 border object-cover -mb-16"
            />
            {profile.avatar ? (
              <img
                src={getBlueskyCdnLink(
                  repoData?.did!,
                  profile?.avatar?.ref.$link,
                  "jpeg",
                )}
                className="w-32 h-32 rounded-full object-cover ml-12"
              />
            ) : (
              <div className="w-32 h-32 bg-neutral-500 rounded-full grid place-items-center ml-12">
                <AtSign className="w-16 h-16" />
              </div>
            )}
          </div>
        ) : profile.avatar ? (
          <img
            src={getBlueskyCdnLink(
              repoData?.did!,
              profile?.avatar?.ref.$link,
              "jpeg",
            )}
            className="w-32 h-32 rounded-full object-cover ml-12"
          />
        ) : (
          <div className="w-32 h-32 bg-neutral-500 rounded-full grid place-items-center ml-12">
            <AtSign className="w-16 h-16" />
          </div>
        )
      ) : (
        <div> Nothing doing!</div>
      )}
      <div className="ml-12 mt-2">
        <h1 className="text-2xl">
          {profile.displayName}{" "}
          <span className="text-muted-foreground">
            {repoData?.handle && "@" + repoData.handle}
            {repoData?.handleIsCorrect ? "" : " (invalid)"}
          </span>
        </h1>
        <p>{profile.description && preprocessText(profile.description)}</p>
        {profile.labels && (
          <div className="text-muted-foreground text-sm mt-4 mb-1">
            <Tag height="1rem" className="inline" /> Labels
          </div>
        )}
        <StarterPackInfo profile={profile} />
        {profile.labels?.values.map((l) => (
          <div className="bg-blue-400 dark:bg-blue-700">{l.val}</div>
        ))}
        {profile.pinnedPost && (
          <>
            <div className="text-muted-foreground text-sm mt-4 mb-1">
              <Pin height="1rem" className="inline" />
              Pinned Post{" "}
            </div>
            <BlueskyPostWithoutEmbed
              uri={profile.pinnedPost.uri}
              showEmbeddedPost={true}
            />
          </>
        )}
      </div>
    </>
  );
};
