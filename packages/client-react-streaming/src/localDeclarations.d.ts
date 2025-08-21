import "@apollo/client";
import type { Defer20220824Handler } from "@apollo/client/incremental";
declare module "@apollo/client" {
  export interface TypeOverrides
    extends GraphQLCodegenDataMasking.TypeOverrides,
      Defer20220824Handler.TypeOverrides {}
}
