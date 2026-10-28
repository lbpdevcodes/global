import { useEffect, useRef } from "react";

// globe.gl touches `window` on import, so it loads only in the browser.
export function GlobeView() {
  const container = useRef(null);

  useEffect(() => {
    let globe;
    import("globe.gl").then(({ default: Globe }) => {
      globe = new Globe(container.current).backgroundColor("#000000");
    });
    return () => globe?._destructor();
  }, []);

  return <div ref={container} className="h-dvh w-full" />;
}
