/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { RemoveMultipartDirectivesLink } from "./RemoveMultipartDirectivesLink";
import { fromPartial } from "@total-typescript/shoehorn";
import type { DocumentNode } from "@apollo/client";
import { gql, Observable } from "@apollo/client";
import { print } from "graphql";
import { it, expect } from "vitest";

const queryWithDefer = gql`
  query myQuery {
    fastField
    ... @defer {
      slowField1
    }
    ... @defer {
      slowField2
    }
  }
`;
const queryWithDeferAndDontStripAnnotation = gql`
  query myQuery {
    fastField
    ... @defer(label: "SsrDontStrip1") {
      slowField1
    }
    ... @defer(label: "SsrDontStrip2") {
      slowField2
    }
    ... @defer {
      slowField3
    }
  }
`;
const queryWithDeferAndStripAnnotation = gql`
  query myQuery {
    fastField
    ... @defer(label: "SsrStrip1") {
      slowField1
    }
    ... @defer(label: "SsrStrip2") {
      slowField2
    }
    ... @defer {
      slowField3
    }
  }
`;

it("removes fields with a @defer directive", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: true,
  });
  let resultingQuery: DocumentNode;
  link.request(fromPartial({ query: queryWithDefer }), function (operation) {
    resultingQuery = operation.query;
    return Observable.of({});
  });
  expect(print(resultingQuery!)).toMatchInlineSnapshot(`
  "query myQuery {
    fastField
  }"
  `);
});

it("`stripDefer` defaults to `true`", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: true,
  });
  let resultingQuery: DocumentNode;
  link.request(fromPartial({ query: queryWithDefer }), function (operation) {
    resultingQuery = operation.query;
    return Observable.of({});
  });
  expect(print(resultingQuery!)).toMatchInlineSnapshot(`
    "query myQuery {
      fastField
    }"
    `);
});

it("preserves @defer fields with a `SsrDontStrip` label", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: true,
  });
  let resultingQuery: DocumentNode;
  link.request(
    fromPartial({ query: queryWithDeferAndDontStripAnnotation }),
    function (operation) {
      resultingQuery = operation.query;
      return Observable.of({});
    }
  );
  expect(print(resultingQuery!)).toMatchInlineSnapshot(`
    "query myQuery {
      fastField
      ... @defer(label: "SsrDontStrip1") {
        slowField1
      }
      ... @defer(label: "SsrDontStrip2") {
        slowField2
      }
    }"
  `);
});

it("can be configured to not remove @defer fields", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: false,
  });
  let resultingQuery: DocumentNode;
  link.request(fromPartial({ query: queryWithDefer }), function (operation) {
    resultingQuery = operation.query;
    return Observable.of({});
  });
  expect(print(resultingQuery!)).toMatchInlineSnapshot(`
    "query myQuery {
      fastField
      ... @defer {
        slowField1
      }
      ... @defer {
        slowField2
      }
    }"
  `);
});

it("even with `stripDefer: false`, certain fields can be marked for stripping", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: false,
  });
  let resultingQuery: DocumentNode;
  link.request(
    fromPartial({ query: queryWithDeferAndStripAnnotation }),
    function (operation) {
      resultingQuery = operation.query;
      return Observable.of({});
    }
  );
  expect(print(resultingQuery!)).toMatchInlineSnapshot(`
    "query myQuery {
      fastField
      ... @defer {
        slowField3
      }
    }"
  `);
});
