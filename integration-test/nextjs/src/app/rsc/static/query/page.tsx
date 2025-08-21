import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import { query } from "../../client";

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

export const dynamic = "force-static";

export default async function Home() {
  const { data } = await query({ query: QUERY });
  return (
    <ul>{data?.products.map(({ id, title }) => <li key={id}>{title}</li>)}</ul>
  );
}
