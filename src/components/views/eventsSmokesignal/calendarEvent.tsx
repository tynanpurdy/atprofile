import { CollectionViewComponent, CollectionViewProps } from "../getView";

interface CalendarEventLexiconValue {
  mode: string;
  name: string;
  uris: Array<{
    uri: string;
    name: string;
    $type: string;
  }>;
  $type: string;
  status: string;
  startsAt: string;
  createdAt: string;
  description?: string;
  text?: string;
  location?: {
    name: string;
    street: string;
    locality: string;
    region: string;
  };
}

interface CalendarEventLexicon {
  uri: string;
  cid: string;
  value: CalendarEventLexiconValue;
}

const EventsSmokesignalCalendarEventView: CollectionViewComponent<
  CollectionViewProps
> = ({ data }: CollectionViewProps) => {
  const { value } = data as CalendarEventLexicon;

  // Helper function to format date strings
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const friendly = getFriendlyUntilDate(date);
      return (
        date.toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }) + (friendly !== "expired" ? " - " + friendly : "")
      );
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Helper function to extract the human-friendly part of status/mode
  const getFriendlyTerm = (term: string): string => {
    const parts = term.split("#");
    return parts.length > 1
      ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
      : term;
  };

  const statusColor = (status: string): string => {
    if (status.includes("scheduled")) return "green";
    if (status.includes("cancelled")) return "red";
    if (status.includes("postponed")) return "orange";
    return "#555"; // Default color
  };

  return (
    <div className="border p-6 py-3 rounded-md">
      <h2 className="text-2xl font-semibold mb-2 w-max">📅 {value.name}</h2>

      <div>
        <p>
          <strong>Starts:</strong> {formatDate(value.startsAt)}
        </p>
        <p>
          <strong>Status:</strong>
          <span
            className="px-1 mx-1 rounded-md border border-border"
            style={{ backgroundColor: statusColor(value.status) }}
          >
            {getFriendlyTerm(value.status)}
          </span>
        </p>
        <p>
          <strong>Where:</strong> {getFriendlyTerm(value.mode)}
          {value.location &&
            ` - ${value.location.name}: ${value.location.street}, ${value.location.locality}, ${value.location.region}`}
        </p>
      </div>

      <div>
        <h3 className="text-xl my-1 font-semibold">Description</h3>
        <p className="p-2 rounded-md border border-border">
          {(value.description || value.text)
            ?.split("\n")
            .map((t) => (t == "\n" ? <p></p> : <p className="mb-2">{t}</p>))}
        </p>
      </div>

      {value.uris && value.uris.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 className="text-xl pt-2 font-semibold">Links</h3>
          <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
            {value.uris.map((link, index) => (
              <li key={index} style={{ marginBottom: "5px" }}>
                <a
                  href={link.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 dark:text-blue-400"
                >
                  {link.name || link.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        style={{
          fontSize: "0.8em",
          color: "#7f8c8d",
          borderTop: "1px solid #ecf0f1",
          paddingTop: "10px",
          marginTop: "20px",
        }}
      >
        <p style={{ margin: "5px 0" }}>
          <em>Record Created: {formatDate(value.createdAt)}</em>
        </p>
      </div>
    </div>
  );
};

function getFriendlyUntilDate(date: Date) {
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();

  if (diffInMs <= 0) {
    return "expired";
  }

  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return `in ${diffInSeconds} second${diffInSeconds === 1 ? "" : "s"}`;
  } else if (diffInMinutes < 60) {
    return `in ${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"}`;
  } else if (diffInHours < 24) {
    const remainingMinutes = diffInMinutes % 60;
    let result = `in ${diffInHours} hour${diffInHours === 1 ? "" : "s"}`;
    if (remainingMinutes > 0) {
      result += ` and ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}`;
    }
    return result;
  } else if (diffInDays === 1) {
    return "tomorrow";
  } else if (diffInDays < 7) {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const weekday = days[date.getDay()];
    return `on ${weekday} (${diffInDays} days from now)`;
  } else if (diffInDays < 14) {
    return `next week (${diffInDays} days left)`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    const remainingDays = diffInDays % 7;
    let result = `in ${weeks} week${weeks > 1 ? "s" : ""}`;
    if (remainingDays > 0) {
      result += ` and ${remainingDays} day${remainingDays > 1 ? "s" : ""}`;
    }
    return result;
  } else {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `on ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} (${diffInDays} days from now)`;
  }
}

export default EventsSmokesignalCalendarEventView;
