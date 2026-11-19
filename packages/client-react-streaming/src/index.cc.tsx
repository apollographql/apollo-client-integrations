"use client";

import * as React from "react";

let RealPreloadQueryRef: typeof import("./PreloadQueryRef.cc.js").default;
/**
 * Hydrates a pre-created `TransportedQueryRef` into Apollo Client's suspense cache.
 *
 * This is the lower-level primitive used by `PreloadQuery`. Use it when you
 * already created a `queryRef` with `createTransportedQueryPreloader`.
 *
 * @public
 */
export const PreloadQueryRef: typeof import("./PreloadQueryRef.cc.js").default =
  (props) => {
    if (!RealPreloadQueryRef) {
      RealPreloadQueryRef = React.lazy(
        () => import("./PreloadQueryRef.cc.js")
      );
    }
    return <RealPreloadQueryRef {...props} />;
  };
