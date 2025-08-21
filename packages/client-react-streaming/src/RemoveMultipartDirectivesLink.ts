import type { DocumentNode } from "@apollo/client";
import { ApolloLink } from "@apollo/client";
import { removeDirectivesFromDocument } from "@apollo/client/utilities/internal";
import type { DirectiveNode } from "graphql";
import { of } from "rxjs";

interface RemoveMultipartDirectivesConfig {
  /**
   * Whether to strip fragments with `@defer` directives
   * from queries before sending them to the server.
   *
   * Defaults to `true`.
   *
   * Can be overwritten by adding a label starting
   * with either `"SsrDontStrip"` or `"SsrStrip"` to the
   * directive.
   */
  stripDefer?: boolean;
}

function getDirectiveArgumentValue(directive: DirectiveNode, argument: string) {
  return directive.arguments?.find((arg: any) => arg.name.value === argument)
    ?.value;
}
/**
 * This link will (if called with `stripDefer: true`) strip all `@defer` fragments from your query.
 *
 * This is used to prevent the server from doing additional work in SSR scenarios where multipart responses cannot be handled anyways.
 *
 * You can exclude certain fragments from this behavior by giving them a label starting with `"SsrDontStrip"`.
 * The "starting with" is important, because labels have to be unique per operation. So if you have multiple directives where you want to override the default stipping behaviour,
 * you can do this by annotating them like
 * ```graphql
 * query myQuery {
 *   fastField
 *   ... @defer(label: "SsrDontStrip1") {
 *     slowField1
 *   }
 *   ... @defer(label: "SsrDontStrip2") {
 *     slowField2
 *   }
 * }
 * ```
 *
 * You can also use the link with `stripDefer: false` and mark certain fragments to be stripped by giving them a label starting with `"SsrStrip"`.
 *
 * @example
 * ```ts
 * new RemoveMultipartDirectivesLink({
 *   // Whether to strip fragments with `@defer` directives
 *   // from queries before sending them to the server.
 *   //
 *   // Defaults to `true`.
 *   //
 *   // Can be overwritten by adding a label starting
 *   // with either `"SsrDontStrip"` or `"SsrStrip"` to the
 *   // directive.
 *   stripDefer: true,
 * });
 * ```
 *
 * @public
 */
export class RemoveMultipartDirectivesLink extends ApolloLink {
  private stripDirectives: string[] = [];
  constructor(config: RemoveMultipartDirectivesConfig) {
    super();

    if (config.stripDefer !== false) this.stripDirectives.push("defer");
  }

  request(
    operation: ApolloLink.Operation,
    forward?: ApolloLink.ForwardFunction
  ) {
    if (!forward) {
      throw new Error("This is not a terminal link!");
    }
    const { query } = operation;

    let modifiedQuery: DocumentNode | null = query;
    modifiedQuery = removeDirectivesFromDocument(
      this.stripDirectives
        .map<Parameters<typeof removeDirectivesFromDocument>[0][0]>(
          (directive) => ({
            test(node) {
              let shouldStrip =
                node.kind === "Directive" && node.name.value === directive;
              const label = getDirectiveArgumentValue(node, "label");
              if (
                label?.kind === "StringValue" &&
                label.value.startsWith("SsrDontStrip")
              ) {
                shouldStrip = false;
              }
              return shouldStrip;
            },
            remove: true,
          })
        )
        .concat({
          test(node) {
            if (node.kind !== "Directive") return false;
            const label = getDirectiveArgumentValue(node, "label");
            return (
              label?.kind === "StringValue" &&
              label.value.startsWith("SsrStrip")
            );
          },
          remove: true,
        }),
      modifiedQuery
    );

    if (modifiedQuery === null) {
      return of({});
    }

    operation.query = modifiedQuery;

    return forward(operation);
  }
}
