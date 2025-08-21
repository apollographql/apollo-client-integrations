import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import { resetApolloClientSingletons } from "@apollo/client-integration-nextjs";

afterEach(resetApolloClientSingletons);

test("loads data", async () => {
  await act(() => {
    render(<App />);
  });

  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(
    await screen.findByText("Soft Warm Apollo Beanie")
  ).toBeInTheDocument();
  expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
});

test("is interactive", async () => {
  await act(() => {
    render(<App />);
  });

  const counter = await screen.findByTestId("counter");
  expect(counter.textContent).toBe("0");

  await userEvent.click(screen.getByText("increment"));

  expect(counter.textContent).toBe("1");
});
