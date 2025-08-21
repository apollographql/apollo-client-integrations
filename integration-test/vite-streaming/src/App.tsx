import { Suspense, useState } from "react";
import "./App.css";
import { ApolloClient, InMemoryCache } from "@apollo/client-react-streaming";
import { SchemaLink } from "@apollo/client/link/schema";
import { gql, ApolloLink, Observable, TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { schema } from "./schema";
import { WrappedApolloProvider } from "./Transport";

const delayLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const handle = setTimeout(() => {
      forward(operation).subscribe(observer);
    }, 1000);

    return () => {
      clearTimeout(handle);
    };
  });
});

const makeClient = () => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link:
      // we do not even have a graphql endpoint in the browser, so if this works, streaming works
      typeof window === "undefined"
        ? delayLink.concat(new SchemaLink({ schema }))
        : undefined,
  });
};

function App() {
  return (
    <>
      <h1>Vite + React (patched) Streaming SSR + Apollo Client + Suspense</h1>
      <div className="card">
        <WrappedApolloProvider makeClient={makeClient}>
          <Suspense fallback={<div>Loading...</div>}>
            <Countries />
            <Counter />
          </Suspense>
        </WrappedApolloProvider>
      </div>
    </>
  );
}

const QUERY: TypedDocumentNode<{
  products: Array<{ id: string; title: string }>;
}> = gql`
  query {
    products {
      id
      title
    }
  }
`;

function Countries() {
  const { data } = useSuspenseQuery(QUERY);

  return (
    <ul>
      {data.products.map((product) => (
        <li key={product.id}>{product.title}</li>
      ))}
    </ul>
  );
}

/**
 * Counter components to test that the client has hydrated and is interactive.
 */
function Counter() {
  const [counter, setCounter] = useState(0);
  return (
    <>
      <div data-testid="counter">{counter}</div>
      <button onClick={() => setCounter((x) => x + 1)}>increment</button>
    </>
  );
}

export default App;
