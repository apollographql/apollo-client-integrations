import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { makeClient, QUERY } from "./App";
import {
  ApolloNextAppProvider,
  ApolloClient,
  resetApolloClientSingletons,
} from "@apollo/client-integration-nextjs";
import { Suspense } from "react";
import { useQuery } from "@apollo/client/react";

const wrapper = ({ children }) => (
  <ApolloNextAppProvider makeClient={makeClient}>
    <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
  </ApolloNextAppProvider>
);

afterEach(resetApolloClientSingletons);

/**
 * We test that jest is using the "browser" build.
 * This is important because the "browser" build will not try to transport
 * data from the server to the browser.
 */
test("uses the browser build", () => {
  let foundPrototype = false;
  let proto = ApolloClient;
  while (proto) {
    if (proto.name === "ApolloClientBrowserImpl") {
      foundPrototype = true;
      break;
    }
    proto = Object.getPrototypeOf(proto);
  }

  expect(foundPrototype).toBe(true);
});

/**
 * The SSR build would just skip all `useQuery` calls because their result
 * would never be able to be transported to the browser anyways.
 * In a SSR build, it would always render loading.
 */
test("`useQuery` renders", async () => {
  const Component = () => {
    const { data, loading } = useQuery(QUERY);
    return loading ? (
      <div>Loading...</div>
    ) : (
      <div>{data.products[0].title}</div>
    );
  };
  render(<Component />, { wrapper });

  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(
    await screen.findByText("Soft Warm Apollo Beanie")
  ).toBeInTheDocument();
  expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
});

test("will set up the data transport", () => {
  render(<></>, { wrapper });
  expect(globalThis[Symbol.for("ApolloSSRDataTransport")]).toBeDefined();
  expect(globalThis[Symbol.for("ApolloClientSingleton")]).toBeDefined();
});

test("resetApolloClientSingletons tears down global singletons", () => {
  render(<></>, { wrapper });
  // wrappers are now set up, see last test
  // usually, we do this in `afterEach`
  resetApolloClientSingletons();
  expect(globalThis[Symbol.for("ApolloSSRDataTransport")]).not.toBeDefined();
  expect(globalThis[Symbol.for("ApolloClientSingleton")]).not.toBeDefined();
});
