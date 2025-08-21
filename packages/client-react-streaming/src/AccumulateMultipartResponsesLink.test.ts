/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Defer20220824Handler } from "@apollo/client/incremental";
import { ApolloLink, Observable, gql } from "@apollo/client";
import { test, mock } from "node:test";
import assert from "node:assert";
import { fromPartial } from "@total-typescript/shoehorn";
import type { SubscriptionObserver } from "zen-observable-ts";

const { DebounceMultipartResponsesLink: AccumulateMultipartResponsesLink } =
  await import("#bundled");

test("normal queries can resolve synchronously", () => {
  const query = gql`
    query {
      fastField
    }
  `;

  const link = new AccumulateMultipartResponsesLink({
    cutoffDelay: 1000,
  });
  const nextLink = getFinalLinkWithExposedObserver();

  const subscriptionStatus = trackSubscriptionStatus(
    ApolloLink.from([link, nextLink.link]).request(fromPartial({ query }))
  );
  assert(nextLink.observer);

  assert.deepStrictEqual(subscriptionStatus, {
    results: [],
    error: undefined,
    complete: false,
  });

  nextLink.observer.next({ data: { fastField: "fast" } });
  nextLink.observer.complete();
  assert.deepStrictEqual(subscriptionStatus, {
    results: [{ data: { fastField: "fast" } }],
    error: undefined,
    complete: true,
  });
});

test("deferred query will complete synchonously if maxDelay is 0", () => {
  const query = gql`
    query {
      fastField
      ... @defer {
        slowField
      }
    }
  `;
  const link = new AccumulateMultipartResponsesLink({
    cutoffDelay: 0,
  });
  const nextLink = getFinalLinkWithExposedObserver();

  const subscriptionStatus = trackSubscriptionStatus(
    ApolloLink.from([link, nextLink.link]).request(fromPartial({ query }))
  );
  assert(nextLink.observer);

  assert.deepStrictEqual(subscriptionStatus, {
    results: [],
    error: undefined,
    complete: false,
  });

  nextLink.observer.next({ data: { fastField: "fast" } });
  // no complete call here!
  assert.ok(nextLink.observer.closed);
  assert.deepStrictEqual(subscriptionStatus, {
    results: [{ data: { fastField: "fast" } }],
    error: undefined,
    complete: true,
  });
});

test("`next` call will be debounced and results will be merged together", () => {
  mock.timers.enable();

  const query = gql`
    query {
      fastField
      ... @defer {
        slowField
      }
      ... @defer {
        verySlowField
      }
    }
  `;
  const link = new AccumulateMultipartResponsesLink({
    cutoffDelay: 1000,
  });
  const nextLink = getFinalLinkWithExposedObserver();

  const subscriptionStatus = trackSubscriptionStatus(
    ApolloLink.from([link, nextLink.link]).request(fromPartial({ query }))
  );
  assert(nextLink.observer);

  assert.deepStrictEqual(subscriptionStatus, {
    results: [],
    error: undefined,
    complete: false,
  });

  mock.timers.tick(100);
  // initial response after 100ms
  nextLink.observer.next({ data: { fastField: "fast" } });

  mock.timers.tick(100);
  assert.ok(!nextLink.observer.closed);
  assert.deepStrictEqual(subscriptionStatus, {
    results: [],
    error: undefined,
    complete: false,
  });

  // incremental response after 200ms
  nextLink.observer.next({
    incremental: [
      {
        path: [],
        data: { slowField: "slow" },
      },
    ],
  });

  mock.timers.tick(899);
  // at 1099ms, 999ms after the initial response, we still don't have our final result
  assert.ok(!nextLink.observer.closed);
  assert.deepStrictEqual(subscriptionStatus, {
    results: [],
    error: undefined,
    complete: false,
  });

  mock.timers.tick(2);
  // after 1101ms, 1001ms after the initial response, we have our final result
  assert.ok(nextLink.observer.closed);
  assert.deepStrictEqual(subscriptionStatus, {
    results: [{ data: { fastField: "fast", slowField: "slow" } }],
    error: undefined,
    complete: true,
  });

  // more responses would be ignored
  nextLink.observer.next({
    incremental: [
      {
        path: [],
        data: { verySlowField: "very slow" },
      },
    ],
  });

  assert.ok(nextLink.observer.closed);
  assert.deepStrictEqual(subscriptionStatus, {
    results: [{ data: { fastField: "fast", slowField: "slow" } }],
    error: undefined,
    complete: true,
  });
});

function trackSubscriptionStatus(
  observable: Observable<Defer20220824Handler.Chunk> | null
) {
  assert(observable);

  const subscriptionStatus = {
    results: [] as ApolloLink.Result[],
    error: undefined as Error | undefined,
    complete: false,
  };

  observable.subscribe({
    next: (result) => {
      subscriptionStatus.results.push(result);
    },
    error: (err) => {
      subscriptionStatus.error = err;
    },
    complete: () => {
      subscriptionStatus.complete = true;
    },
  });
  return subscriptionStatus;
}

function getFinalLinkWithExposedObserver() {
  const returnValue = {
    observer: undefined as SubscriptionObserver<ApolloLink.Result> | undefined,
    link: new ApolloLink(() => {
      return new Observable((observer) => {
        returnValue.observer = observer;
      });
    }),
  };
  return returnValue;
}
