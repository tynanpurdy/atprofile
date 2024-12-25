import { useState, useEffect } from "preact/compat";

// lazy dumb component. redo this ASAP
export function RenderJson(props: { data: any; depth?: number }) {
  if (!props.depth) {
    props.depth = 0;
  }
  // if data is not an object just render it
  if (typeof props.data !== "object") {
    if (typeof props.data === "string" && props.data.startsWith("at://")) {
      return (
        <a className="text-blue-700 dark:text-blue-400" href={"/" + props.data}>
          {props.data}
        </a>
      );
    }

    return <span>{props.data}</span>;
  }
  return (
    <div>
      {Object.keys(props.data).map((k) => {
        return (
          <div style={{ marginLeft: `${(props.depth ?? 0) * 20}px` }}>
            {k}:{" "}
            <RenderJson data={props.data[k]} depth={(props.depth ?? 0) + 1} />
          </div>
        );
      })}
    </div>
  );
}
