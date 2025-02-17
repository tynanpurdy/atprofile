import ShowError from "@/components/error";
import { Loader } from "@/components/ui/loader";
import {
  createFileRoute,
  Link,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "preact/hooks";

export const Route = createFileRoute("/constellation/dids/$collection")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    console.log(search);
    return {
      target: String(search.target) || "",
      path: String(search.path) || "",
    };
  },
});

interface ConstellationLinkState {
  totalLinks: number;
  links: string[];
  cursor: string | null;
  error: Error | null;
  isLoading: boolean;
}

function useConstellationLink(
  collection: string,
  target: string,
  path: string,
) {
  const [link, setLink] = useState<ConstellationLinkState>({
    totalLinks: 0,
    links: [],
    cursor: null,
    error: null,
    isLoading: true,
  });

  const fetchLink = async (cursor?: string) => {
    // check for missing parameters
    if (!collection || !target || !path) {
      let missingParams = [];
      for (let param in [collection, target, path]) {
        if (!param) missingParams.push(param);
      }
      if (missingParams.length > 0) {
        setLink({
          ...link,
          error: new Error("Missing parameters: "),
          isLoading: false,
        });
        return;
      }
    }

    let response = await fetch(
      `https://constellation.microcosm.blue/links/distinct-dids?target=${target}&collection=${collection}&path=${path}${cursor ? `&cursor=${cursor}` : ""}`,
    );

    let data = await response.json();
    setLink((prev) => ({
      ...prev,
      totalLinks: data.total,
      links: [...(prev.links || []), ...data.linking_dids],
      cursor: data.cursor,
      error: data.error,
      isLoading: false,
    }));
  };

  useEffect(() => {
    fetchLink();
  }, [collection, target, path]);

  return {
    totalLinks: link.totalLinks,
    links: link.links,
    cursor: link.cursor,
    error: link.error,
    isLoading: link.isLoading,
    fetchMore: async (cursor?: string) => {
      if (!cursor) return;
      await fetchLink(cursor);
    },
  };
}

function RouteComponent() {
  // get route params
  const { collection } = useParams({
    from: "/constellation/dids/$collection",
  });
  // get query params
  const params = useSearch({
    from: "/constellation/dids/$collection",
  });

  const state = useConstellationLink(collection, params.target, params.path);

  const loaderRef = useRef<HTMLDivElement>(null);

  const { links, cursor, error, isLoading, fetchMore } = state;

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoading && cursor) {
          fetchMore(cursor);
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [cursor, isLoading, fetchMore]);

  if (error) {
    return <ShowError error={error} />;
  }

  if (isLoading && !links.length) {
    return <Loader />;
  }
  const splitColl = params.target.split("/");
  return (
    <div className="flex flex-row justify-center w-full min-h-screen">
      <div className="max-w-md lg:max-w-2xl w-[90vw] mx-4 md:mt-16 space-y-2">
        <h1 className="text-3xl font-bold">Links</h1>
        <div className="text-muted-foreground flex-inline">
          <span>View all dids mentioning </span>
          <span className="flex">
            <span>at://</span>
            <span className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {splitColl[2]}
            </span>
            /
            <span className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {splitColl[3]}
            </span>
            /<span>{splitColl[4]}</span>
          </span>
        </div>
        {links.map((link) => (
          <div className="w-min max-w-full">
            <Link
              key={link}
              to="/at:/$handle"
              params={{
                handle: link,
              }}
              className="flex text-blue-700 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              at://
              <span className="inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {link}
              </span>
              /
            </Link>
          </div>
        ))}

        <div
          ref={loaderRef}
          className="flex flex-row justify-center h-10 -pt-16"
        >
          {isLoading && (
            <div className="text-center text-sm text-muted-foreground mx-10">
              Loading more...
            </div>
          )}
          {!isLoading && !cursor && (
            <div className="text-center text-sm text-muted-foreground mx-10 mt-2">
              that's all, folks!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
