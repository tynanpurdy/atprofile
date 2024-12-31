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
        return (
          <a
            className="text-blue-700 dark:text-blue-400"
            href={"/" + props.data}
          >
            {props.data}
          </a>
        );
      } else if (props.data.startsWith("did:")) {
        return (
          <a
            className="text-blue-700 dark:text-blue-400"
            href={"/at://" + props.data}
          >
            {props.data}
          </a>
        );
      }
    }

    return <span>{props.data}</span>;
  }
  // if the data is an object we have a custom component for, use that instead
  if (props.data.$type) {
    const Component = getComponent(props.data.$type);
    if (Component) {
      return (
        <div style={{ marginLeft: `${20}px` }}>
          {props.data.$type}: <Component did={props.did} {...props.data} />
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
