import { SmartSearchBar } from "@/components/smartSearchBar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { AtSign, Star } from "lucide-react";
import { useMemo } from "react";

const examples = [
  <Link
    key="danabra"
    to="/at:/$handle"
    params={{ handle: "danabra.mov" }}
    className="text-blue-500"
  >
    <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 hover:bg-muted/80 transition-colors">
      at://danabra.mov
    </div>
  </Link>,
  <Link
    key="kot-posts"
    to="/at:/$handle/$collection"
    params={{ handle: "kot.pink", collection: "app.bsky.feed.post" }}
    className="text-blue-500"
  >
    <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 hover:bg-muted/80 transition-colors">
      at://kot.pink/app.bsky.feed.post
    </div>
  </Link>,
  <Link
    key="robk"
    to="/at:/$handle"
    params={{ handle: "komaniecki.bsky.social" }}
    className="text-blue-500"
  >
    <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 hover:bg-muted/80 transition-colors">
      at://komaniecki.bsky.social
    </div>
  </Link>,
  <Link
    key="why-generator"
    to="/at:/$handle/$collection"
    params={{ handle: "why.bsky.team", collection: "app.bsky.feed.generator" }}
    className="text-blue-500"
  >
    <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 hover:bg-muted/80 transition-colors">
      at://why.bsky.team/app.bsky.feed.generator
    </div>
  </Link>,
  <Link
    key="jay"
    to="/at:/$handle"
    params={{ handle: "jay.bsky.social" }}
    className="text-blue-500"
  >
    <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 hover:bg-muted/80 transition-colors">
      at://jay.bsky.social
    </div>
  </Link>,
  <Link
    key="nobody-knows"
    to="/at:/$handle"
    params={{ handle: "pippy.bsky.social" }}
    className="text-blue-500"
  >
    <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 hover:bg-muted/80 transition-colors">
      at://pippy.bsky.social
    </div>
  </Link>,
  <Link
    key="jay"
    to="/at:/$handle/$collection"
    params={{ handle: "ngerakines.me", collection: "blue.badge.collection" }}
    className="text-blue-500"
  >
    <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 hover:bg-muted/80 transition-colors">
      at://ngerakines.me/blue.badge.collection
    </div>
  </Link>,
];

export const Route = createLazyFileRoute("/")({
  component: Index,
});

export default function Index() {
  useDocumentTitle("atp.tools");

  const randomExamples = useMemo(() => {
    return [...examples].sort(() => Math.random() - 0.5).slice(0, 2);
  }, []);

  return (
    <main className="h-screen relative max-h-[calc(100vh-5rem)]">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center md:min-h-[80vh]">
          {/* Header section */}
          <AtSign className="text-blue-500 mb-4" height={64} width={64} />
          <div className="text-center space-y-4 mb-4">
            <p className="text-xl text-muted-foreground md:max-w-[600px] mx-auto">
              Enter a user, collection, or repo to get started.
            </p>
          </div>
          {/* Search section */}
          <div className="w-full max-w-xl mx-auto">
            <SmartSearchBar />
          </div>
          <div className="flex flex-row items-center mt-6 gap-2 justify-center">
            <div className="flex items-center gap-x-2 text-muted-foreground">
              <Star className="h-4 w-4" /> Try:{" "}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm">
              {randomExamples}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
