import { Link } from "@tanstack/react-router";
import {
  ClipboardPaste,
  File,
  MessageSquare,
  Pen,
  ShieldQuestionIcon,
  Star,
  ThumbsUp,
  Waves,
} from "lucide-react";

import { siBluesky, siMediafire, siReddit } from "simple-icons";

interface IconMapping {
  // The icon to display, a url to an image or a component (Lucide icon)
  icon: string | React.ReactNode;
  // The label to display on icon hover
  label: string;
  // The link template to use for this icon. will find and replace {handle} or {did}.
  // e.g. https://bsky.app/profile/{handle/did}
  linkTemplate?: string;
}

function svgB64ify(svg: string) {
  return "data:image/svg+xml;base64," + btoa(svg);
}

const iconMappings: Record<string, IconMapping> = {
  "app.bsky": {
    icon: svgB64ify(siBluesky.svg),
    label: "Bluesky",
    linkTemplate: "https://bsky.app/profile/{did}",
  },
  "blue.zio.atfile": {
    icon: <File />,
    label: "Atfile",
  },
  "com.shinolabs.pinksea": {
    icon: <img src="/assets/services/pinksea.svg" alt="Frontpage" />,
    label: "Pinksea",
  },
  "com.whtwnd.blog": { icon: <Pen />, label: "WhiteWind" },
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
  "link.pastesphere": { icon: <ClipboardPaste />, label: "Pastesphere" },
  "my.skylights": { icon: <Star />, label: "Skylights" },
  "social.psky": { icon: <MessageSquare />, label: "Psky" },
  "xyz.statusphere": { icon: <ThumbsUp />, label: "Statusphere example app" },
};

function getIconForCollection(collection: string) {
  // Find matching key in iconMappings
  const matchingKey = Object.keys(iconMappings).find((key) =>
    collection.includes(key),
  );
  return matchingKey ? iconMappings[matchingKey] : null;
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
      .map((collection) => ({
        id: collection,
        Icon: getIconForCollection(collection)?.icon ?? <ShieldQuestionIcon />,
        displayName: getIconForCollection(collection)?.label ?? "Unknown",
        linkTemplate: getIconForCollection(collection)?.linkTemplate,
      }))
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
    >
      <div className="w-8 h-8 p-1 mr-2 rounded-full bg-neutral-500 text-white">
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
