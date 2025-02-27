import { Coffee } from "lucide-react";

const externalLinks = [
  {
    title: "Ko-fi",
    url: "https://ko-fi.com/uxieq",
    icon: <Coffee className="w-6 h-6" />,
  },
  {
    title: "GitHub",
    url: "https://github.com/espeon/atptools",
    icon: (
      <img
        src="/assets/invertocat.png"
        className="h-[1.35rem] mb-0.5 brightness-[10] dark:brightness-[999] hover:brightness-[999] dark:hover:brightness-[20] grayscale invert dark:invert-0"
        alt="Bluesky"
      />
    ),
  },
  {
    title: "Discord",
    url: "https://discord.gg/pgGM9n8ppf",
    icon: (
      <img
        src="/assets/discord.png"
        className="w-6 brightness-[2.2] hover:brightness-[999] dark:hover:brightness-200 grayscale hover:grayscale-0 invert dark:invert-0"
        alt="Bluesky"
      />
    ),
  },
  {
    title: "Bluesky",
    url: "https://bsky.app/profile/did:plc:k644h4rq5bjfzcetgsa6tuby",
    icon: (
      <img
        src="/assets/services/bluesky.png"
        className="w-6 brightness-[8.5] hover:brightness-[999] dark:hover:brightness-200 grayscale hover:grayscale-0 invert dark:invert-0"
        alt="Bluesky"
      />
    ),
  },
  // add more external links as desired
];

export function ExternalLinksRow() {
  return (
    <div className="flex flex-row justify-end items-center px-2 py-1 gap-4">
      {externalLinks.map((link) => (
        <a
          key={link.title}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 hover:text-primary hover:bg-muted-foreground/30 p-1 rounded-lg aspect-square *:transition-colors duration-200"
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
