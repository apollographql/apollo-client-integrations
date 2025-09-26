import { createFileRoute } from "@tanstack/react-router";
import { schema } from "@integration-test/shared/schema";
import { apiRouteHandler } from "@integration-test/shared/apiRoute";

export const Route = createFileRoute("/api/graphql")({
  server: { handlers: { POST: apiRouteHandler({ schema }) } },
});
