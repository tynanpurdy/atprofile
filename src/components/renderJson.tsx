import { Link } from "@tanstack/react-router";
import { getComponent } from "./json/getComponent";

// lazy dumb component. redo this ASAP
export function RenderJson(props: { data: any; depth?: number; did: string }) {
  if (!props.depth) {
    props.depth = 0;
  }
  // if data is not an object just render it
  if (typeof props.data !== "object") {
    if (typeof props.data === "string") {
      if (props.data.startsWith("at://")) {
        // have to do this b/c Link type safety.
        // there's only a set num of things it can be anyways
        let parts = props.data.replace("at://", "").split("/");
        switch (parts.length) {
          case 1:
            return (
              <Link
                className="text-blue-700 dark:text-blue-400"
                to={"/at:/$handle"}
                params={{
                  handle: parts[0],
                }}
              >
                {props.data}
              </Link>
            );
          case 2:
            return (
              <Link
                className="text-blue-700 dark:text-blue-400"
                to={"/at:/$handle/$collection"}
                params={{
                  handle: parts[0],
                  collection: parts[1],
                }}
              >
                {props.data}
              </Link>
            );
          case 3:
            return (
              <Link
                className="text-blue-700 dark:text-blue-400"
                to={"/at:/$handle/$collection/$rkey"}
                params={{
                  handle: parts[0],
                  collection: parts[1],
                  rkey: parts[2],
                }}
              >
                {props.data}
              </Link>
            );
        }
      } else if (props.data.startsWith("did:")) {
        return (
          <Link
            className="text-blue-700 dark:text-blue-400"
            to={"/at:/$handle"}
            params={{
              handle: props.data,
            }}
          >
            {props.data}
          </Link>
        );
      }
    }

    return <span>{props.data}</span>;
  }
  // if the data is an object we have a custom component for, use that instead
  if (props.data.$type) {
    const Component = getComponent(props.data.$type);
    if (Component) {
      console.log("props.data", props.data);
      return (
        <div style={{ marginLeft: `${20}px` }}>
          {props.data.$type}:{" "}
          <Component
            did={props.did}
            dollar_link={props.data.ref.$link || undefined}
            {...props.data}
          />
        </div>
      );
    }
  }
  return (
    <div>
      {Object.keys(props.data).map((k) => {
        return (
          <div style={{ marginLeft: `${20}px` }}>
            {k}:{" "}
            <RenderJson
              data={props.data[k]}
              depth={(props.depth ?? 0) + 1}
              did={props.did}
            />
          </div>
        );
      })}
    </div>
  );
}
