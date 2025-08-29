import { createAPIFileRoute } from "@tanstack/start/api";
import { schema } from "@integration-test/shared/schema";
import { apiRouteHandler } from "@integration-test/shared/apiRoute";

export const APIRoute = createAPIFileRoute("/api/graphql")({
  POST: apiRouteHandler({ schema }),
});
