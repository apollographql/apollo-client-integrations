/* eslint-disable no-inner-declarations */
import { it } from "node:test";
import assert from "node:assert";
import { runInConditions } from "@internal/test-utils/runInConditions.js";
import { Writable } from "node:stream";
import { ApolloLink, gql } from "@apollo/client";

runInConditions("react-server");

const { registerApolloClient, ApolloClient, InMemoryCache } = await import(
  "#bundled"
);

type ReactServer = {
  renderToPipeableStream(
    model: React.ReactNode,
    webpackMap: unknown,
    options?: {
      environmentName?: string;
      onError?: (error: any) => void;
      onPostpone?: (reason: string) => void;
      identifierPrefix?: string;
    }
  ): {
    abort(reason: any): void;
    pipe<T extends Writable>(destination: T): T;
  };
};

const { renderToPipeableStream } = (await import(
  // @ts-expect-error close enough
  "react-server-dom-webpack/server"
)) as ReactServer;
const React = await import("react");

function drain(stream: ReturnType<typeof renderToPipeableStream>) {
  let result = "";
  return new Promise<string>((resolve) => {
    stream.pipe(
      new Writable({
        write(chunk, _encoding, callback) {
          result += chunk.toString();
          callback();
        },
        final(callback) {
          resolve(result);
          callback();
        },
      })
    );
  });
}

function makeClient() {
  return new ApolloClient({
    link: ApolloLink.empty(),
    cache: new InMemoryCache(),
  });
}

it("calling `getClient` outside of a React render creates a new instance every time", () => {
  const { getClient } = registerApolloClient(makeClient);

  const client1 = getClient();
  const client2 = getClient();
  assert.notStrictEqual(client1, client2);
});

it("calling `getClient` twice during the same React render will return the same instance", async () => {
  const { getClient } = registerApolloClient(makeClient);

  const clients: any[] = [];
  function App() {
    clients.push(getClient());
    clients.push(getClient());
    return <div></div>;
  }

  const stream = renderToPipeableStream(React.createElement(App), {});
  await drain(stream);

  assert.equal(clients.length, 2);
  assert.ok(clients[0] instanceof ApolloClient);
  assert.strictEqual(clients[0], clients[1]);
});

it("calling `getClient` twice during different React renders will return different instances", async () => {
  const { getClient } = registerApolloClient(makeClient);

  const clients: any[] = [];
  function App() {
    clients.push(getClient());
    return <div></div>;
  }

  {
    const stream = renderToPipeableStream(React.createElement(App), {});
    await drain(stream);
  }
  {
    const stream = renderToPipeableStream(React.createElement(App), {});
    await drain(stream);
  }

  assert.equal(clients.length, 2);
  assert.ok(clients[0] instanceof ApolloClient);
  assert.notStrictEqual(clients[0], clients[1]);
});

it("calling `getClient` with parameters results in an error", async () => {
  const { getClient } = registerApolloClient(makeClient);

  function App() {
    // @ts-expect-error yeah this is a bad idea, that's why we do it in a test
    getClient("argument");
    return <div></div>;
  }

  let error: undefined | Error;
  const stream = renderToPipeableStream(
    React.createElement(App),
    {},
    {
      onError(e) {
        error = e;
      },
    }
  );
  await drain(stream);
  assert.ok(
    /You cannot pass arguments into `getClient`./.test(error?.message || "")
  );
});

it("warns if `makeClient` calls that should return different `ApolloClient` instances return the same one (outside of React)", () => {
  const warn = console.warn;
  try {
    let warnArgs: unknown[] | undefined = undefined;
    console.warn = (...args) => (warnArgs = args);
    const same = makeClient();
    const { getClient } = registerApolloClient(() => same);

    getClient();
    // `console.warn` has not been called
    assert.equal(warnArgs, undefined);

    getClient();
    // `console.warn` has been called
    assert.ok(
      /Multiple calls to `getClient` for different requests returned the same client instance./i.test(
        String(warnArgs![0])
      )
    );
  } finally {
    console.warn = warn;
  }
});

it("warns if `makeClient` calls that should return different `ApolloClient` instances return the same one (in React)", async () => {
  const warn = console.warn;
  try {
    let warnArgs: unknown[] | undefined = undefined;
    console.warn = (...args) => (warnArgs = args);
    const same = makeClient();
    const { getClient } = registerApolloClient(() => same);

    function App() {
      getClient();
      // it should be perfectly fine and not cause any errors to call `getClient` in here as often as we want to
      getClient();
      getClient();
      return <div></div>;
    }

    {
      const stream = renderToPipeableStream(React.createElement(App), {});
      await drain(stream);
    }
    // we had only one request, `console.warn` has not been called
    assert.equal(warnArgs, undefined);

    {
      // second render - different request, but returns `same` ApolloClient as before
      const stream = renderToPipeableStream(React.createElement(App), {});
      await drain(stream);
    }

    assert.ok(
      /Multiple calls to `getClient` for different requests returned the same client instance./i.test(
        String(warnArgs![0])
      )
    );
  } finally {
    console.warn = warn;
  }
});

it("warns if calling `query` outside of a React tree, e.g. in a Server Action or Middleware", async () => {
  const warn = console.warn;
  try {
    let warnArgs: unknown[] | undefined = undefined;
    console.warn = (...args) => (warnArgs = args);

    const { query } = registerApolloClient(makeClient);
    await query({
      query: gql`
        query {
          hello
        }
      `,
    }).catch();
    assert.equal(
      warnArgs,
      `The \`query\` shortcut returned from \`registerApolloClient\` 
should not be used in Server Action or Middleware environments.

Calling it multiple times in those environments would 
create multiple independent \`ApolloClient\` instances.

Please create a single \`ApolloClient\` instance by calling 
\`getClient()\` at the beginning of your Server Action or Middleware 
function and then call \`client.query\` multiple times instead.`
    );
  } finally {
    console.warn = warn;
  }
});

it("does not warn about using `query` (even multiple times) inside of a React tree", async () => {
  const warn = console.warn;
  try {
    let warnArgs: unknown[] | undefined = undefined;
    console.warn = (...args) => (warnArgs = args);
    const queryDocument = gql`
      query {
        hello
      }
    `;
    const { query, getClient } = registerApolloClient(makeClient);
    getClient().cache.writeQuery({
      query: queryDocument,
      data: { hello: "world" },
    });

    async function App() {
      await query({
        query: queryDocument,
      });
      await query({
        query: queryDocument,
      });
      return <div></div>;
    }

    const stream = renderToPipeableStream(React.createElement(App), {});
    await drain(stream);

    assert.equal(warnArgs, undefined);
  } finally {
    console.warn = warn;
  }
});
