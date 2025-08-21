/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { fromPartial } from "@total-typescript/shoehorn";
import type { DocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import { print } from "graphql";
import { test } from "node:test";
import assert from "node:assert";
import { of } from "rxjs";

const { RemoveMultipartDirectivesLink } = await import("#bundled");

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

test("removes fields with a @defer directive", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: true,
  });
  let resultingQuery: DocumentNode;
  link.request(fromPartial({ query: queryWithDefer }), function (operation) {
    resultingQuery = operation.query;
    return of({});
  });
  assert.equal(
    print(resultingQuery!),
    `
query myQuery {
  fastField
}`.trim()
  );
});

test("`stripDefer` defaults to `true`", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: true,
  });
  let resultingQuery: DocumentNode;
  link.request(fromPartial({ query: queryWithDefer }), function (operation) {
    resultingQuery = operation.query;
    return of({});
  });
  assert.equal(
    print(resultingQuery!),
    `
query myQuery {
  fastField
}`.trim()
  );
});

test("preserves @defer fields with a `SsrDontStrip` label", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: true,
  });
  let resultingQuery: DocumentNode;
  link.request(
    fromPartial({ query: queryWithDeferAndDontStripAnnotation }),
    function (operation) {
      resultingQuery = operation.query;
      return of({});
    }
  );
  assert.equal(
    print(resultingQuery!),
    `
query myQuery {
  fastField
  ... @defer(label: "SsrDontStrip1") {
    slowField1
  }
  ... @defer(label: "SsrDontStrip2") {
    slowField2
  }
}`.trim()
  );
});

test("can be configured to not remove @defer fields", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: false,
  });
  let resultingQuery: DocumentNode;
  link.request(fromPartial({ query: queryWithDefer }), function (operation) {
    resultingQuery = operation.query;
    return of({});
  });
  assert.equal(
    print(resultingQuery!),
    `
query myQuery {
  fastField
  ... @defer {
    slowField1
  }
  ... @defer {
    slowField2
  }
}`.trim()
  );
});

test("even with `stripDefer: false`, certain fields can be marked for stripping", () => {
  const link = new RemoveMultipartDirectivesLink({
    stripDefer: false,
  });
  let resultingQuery: DocumentNode;
  link.request(
    fromPartial({ query: queryWithDeferAndStripAnnotation }),
    function (operation) {
      resultingQuery = operation.query;
      return of({});
    }
  );
  assert.equal(
    print(resultingQuery!),
    `
query myQuery {
  fastField
  ... @defer {
    slowField3
  }
}`.trim()
  );
});
