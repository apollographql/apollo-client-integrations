import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import { getClient } from "../../client";

const QUERY: TypedDocumentNode<{
  products: {
    id: string;
    title: string;
  }[];
}> = gql`
  query dynamicProducts {
    products {
      id
      title
    }
  }
`;

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data } = await getClient().query({ query: QUERY });
  return (
    <ul>{data?.products.map(({ id, title }) => <li key={id}>{title}</li>)}</ul>
  );
}
