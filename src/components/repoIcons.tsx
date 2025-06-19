import { ShieldQuestionIcon } from "lucide-react";

interface IconMapping {
  // The icon to display, a url to an image or a component (Lucide icon)
  icon: string | React.ReactNode;
  // The label to display on icon hover
  label: string;
  // The link template to use for this icon. will find and replace {handle} or {did}.
  // e.g. https://bsky.app/profile/{handle/did}
  linkTemplate?: string;
}

// A mapping of collections to icons
// To add a new icon, the project must have a logo (svg), and a 'profile' url.
const iconMappings: Record<string, IconMapping> = {
  "app.bsky": {
    icon: (
      <img
        src="/assets/services/bluesky.png"
        className="mt-[2px]"
        alt="Bluesky"
      />
    ),
    label: "Bluesky",
    linkTemplate: "https://bsky.app/profile/{did}",
  },
  // "blue.zio.atfile": {
  //   icon: <File />,
  //   label: "Atfile",
  // },
  "com.shinolabs.pinksea": {
    icon: <img src="/assets/services/pinksea.svg" alt="Pinksea" />,
    label: "Pinksea",
    linkTemplate: "https://pinksea.art/{did}",
  },
  "com.whtwnd.blog": {
    icon: <img src="/assets/services/whtwnd.svg" alt="WhiteWind" />,
    label: "WhiteWind",
    linkTemplate: "https://whtwnd.com/{handle}",
  },
  "fyi.unravel.frontpage": {
    icon: <img src="/assets/services/frontpage.svg" alt="Frontpage" />,
    label: "Frontpage",
    linkTemplate: "https://frontpage.fyi/profile/{handle}",
  },
  "events.smokesignal": {
    icon: (
      <img
        src="/assets/services/smokesignal.png"
        className="rounded-full"
        alt="Frontpage"
      />
    ),
    label: "Smokesignal",
    linkTemplate: "https://smokesignal.events/{did}",
  },
  //"link.pastesphere": { icon: <ClipboardPaste />, label: "Pastesphere" },
  //"my.skylights": { icon: <Star />, label: "Skylights" },
  //"social.psky": { icon: <MessageSquare />, label: "Psky" },
  //"xyz.statusphere": { icon: <ThumbsUp />, label: "Statusphere example app" },
};

function getIconForCollection(collection: string) {
  // Find matching key in iconMappings
  const matchingKey = Object.keys(iconMappings).find((key) =>
    collection.includes(key),
  );
  return matchingKey ? iconMappings[matchingKey] : null;
}

function reverseDomain(collection: string) {
  // Split by dot, reverse, join with dot
  return collection.split(".").reverse().join(".");
}

function RepoIcons({
  collections,
  did,
  handle,
}: {
  collections: string[];
  did?: string;
  handle?: string;
}) {
  let uniqueTypes = Array.from(
    collections
      .map((collection) => {
        const iconObj = getIconForCollection(collection);
        return {
          id: collection,
          Icon: iconObj?.icon ?? <ShieldQuestionIcon />,
          displayName: iconObj?.label ?? "Unknown",
          // If linkTemplate exists, use it; else generate URL from reversed domain
          linkTemplate:
            iconObj?.linkTemplate ??
            `https://${reverseDomain(collection)}/{did}`,
        };
      })
      .reduce((acc, current) => {
        if (
          !Array.from(acc.values()).some(
            (item) => item.displayName === current.displayName,
          )
        ) {
          acc.set(current.displayName, current);
        }
        return acc;
      }, new Map())
      .values(),
  );
  // remove all unknowns
  uniqueTypes = uniqueTypes.filter(
    ({ displayName }) => displayName !== "Unknown",
  );

  console.log(uniqueTypes);
  return uniqueTypes.map(({ id, Icon, displayName, linkTemplate }) => (
    <a
      href={linkTemplate?.replace("{handle}", handle).replace("{did}", did)}
      key={id}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="w-8 h-8 p-1 mr-2 rounded-full dark:bg-neutral-800 border border-neutral-500/50 text-white">
        {typeof Icon === "string" ? (
          <img className="pt-[1px]" src={Icon} alt={displayName} />
        ) : (
          <>{Icon}</>
        )}
      </div>
    </a>
  ));
}

export default RepoIcons;
