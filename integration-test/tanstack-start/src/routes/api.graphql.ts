import { createServerFileRoute } from "@tanstack/react-start/server";
import { schema } from "@integration-test/shared/schema";
import { apiRouteHandler } from "@integration-test/shared/apiRoute";

export const ServerRoute = createServerFileRoute("/api/graphql").methods({
  POST: apiRouteHandler({ schema }),
});
