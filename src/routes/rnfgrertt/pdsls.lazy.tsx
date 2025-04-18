import ShowError from "@/components/error";
import { Loader } from "@/components/ui/loader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "preact/hooks";

export const Route = createLazyFileRoute("/rnfgrertt/pdsls")({
  component: RouteComponent,
});

export type SerializedState = {
  firehose: {
    cursor?: number;
    didWebs: Record<
      string,
      {
        errorAt?: number; // Assuming dateInt corresponds to number
        hash?: string;
        pds?: string;
        labeler?: string;
      }
    >;
  };
  plc: {
    cursor?: string;
  };
  pdses: Record<
    string,
    {
      errorAt?: number; // Assuming dateInt corresponds to number
      inviteCodeRequired?: boolean;
      version?: string | null;
    }
  >;
  labelers: Record<
    string,
    {
      errorAt?: number; // Assuming dateInt corresponds to number
      version?: string | null;
      did: string;
    }
  >;
};

const STATE_URL =
  "https://cdn.statically.io/gh/mary-ext/atproto-scraping/refs/heads/trunk/state.json";

function RouteComponent() {
  // fetch STATE_URL
  const [state, setState] = useState<SerializedState | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(STATE_URL)
      .then((response) => response.json())
      .then((data) => setState(data))
      .catch((error) => setError(error));
  }, []);

  if (error) {
    return <ShowError error={error} />;
  }

  if (!state) {
    return <Loader className="max-h-[calc(100vh-5rem)] h-screen" />;
  }

  return (
    <div className="max-h-[calc(100vh-5rem)] h-screen flex flex-col items-center gap-4">
      <div className="text-left max-w-2xl w-screen">
        <h1 className="text-2xl font-thin">PDS List</h1>
        <a
          className="text-blue-500 hover:border-b"
          href="https://github.com/mary-ext/atproto-scraping"
        >
          from github.com/mary-ext/atproto-scraping
        </a>
      </div>
      <Tabs defaultValue="pds" className="max-w-2xl w-screen">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pds">PDSes</TabsTrigger>
          <TabsTrigger value="labeler">Labellers</TabsTrigger>
        </TabsList>
        <TabsContent value="pds">
          <PDSList pdses={state.pdses} />
        </TabsContent>
        <TabsContent value="labeler">
          <LabelerList labelers={state.labelers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// TODO: add tanstack vtables
function PDSList({
  pdses,
}: {
  pdses: Record<
    string,
    { errorAt?: number; inviteCodeRequired?: boolean; version?: string | null }
  >;
}) {
  return (
    <table className="w-full max-w-2xl table-auto border-collapse text-sm mt-8">
      <thead className="border-b">
        <tr className="text-left">
          <th className="border-b border-gray-200 p-4 pt-0 pb-3 text-left font-medium text-gray-400 dark:border-gray-600 dark:text-gray-200">
            URL
          </th>
          <th className="border-b border-gray-200 max-w-sm p-4 pt-0 pb-3 text-left font-medium text-gray-400 dark:border-gray-600 dark:text-gray-200">
            Version
          </th>
          <th className="border-b border-gray-200 p-4 pt-0 pb-3 text-left font-medium text-gray-400 dark:border-gray-600 dark:text-gray-200">
            Invite?
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(pdses).map(([did, pds]) => (
          <tr key={did}>
            <td className="border-b border-gray-100 p-4 text-sky-600 dark:border-gray-700 dark:text-sky-400 hover:text-sky-500">
              <Link
                className="hover:border-b"
                to={`/pds/$url`}
                params={{ url: did }}
              >
                {did}
              </Link>
            </td>
            <td className="border-b border-gray-100 p-4 max-w-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {pds.version}
            </td>
            <td className="border-b border-gray-100 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {pds.inviteCodeRequired ? <Check /> : <X />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LabelerList({
  labelers,
}: {
  labelers: Record<
    string,
    { errorAt?: number; inviteCodeRequired?: boolean; version?: string | null }
  >;
}) {
  return (
    <table className="w-full max-w-2xl table-auto border-collapse text-sm mt-8">
      <thead className="border-b">
        <tr className="text-left">
          <th className="border-b border-gray-200 p-4 pt-0 pb-3 text-left font-medium text-gray-400 dark:border-gray-600 dark:text-gray-200">
            URL
          </th>
          <th className="border-b border-gray-200 max-w-sm p-4 pt-0 pb-3 text-left font-medium text-gray-400 dark:border-gray-600 dark:text-gray-200">
            Version
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(labelers).map(([did, l]) => (
          <tr key={did}>
            <td className="border-b border-gray-100 p-4 text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {did}
            </td>
            <td className="border-b border-gray-100 p-4 max-w-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {l.version}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
