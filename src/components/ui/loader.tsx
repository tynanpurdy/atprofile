import React from "preact/compat";

const Loader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    keys: string[];
  }
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-200"></div>
      </div>
    </div>
  );
});

export { Loader };
