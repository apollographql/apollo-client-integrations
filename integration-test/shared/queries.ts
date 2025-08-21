import { type TypedDocumentNode, gql } from "@apollo/client";

export interface DynamicProductResult {
  products: {
    id: string;
    title: string;
  }[];
  env: string;
}
export const QUERY: TypedDocumentNode<
  DynamicProductResult,
  { someArgument?: string }
> = gql`
  query dynamicProducts($someArgument: String) {
    products(someArgument: $someArgument) {
      id
      title
    }
    env
  }
`;

export interface DeferredDynamicProductResult {
  products: {
    __typename: "Product";
    id: string;
    title: string;
    rating: undefined | { __typename: "Rating"; value: string; env: string };
  }[];
  env: string;
}
export const DEFERRED_QUERY: TypedDocumentNode<
  DeferredDynamicProductResult,
  { someArgument?: string; delayDeferred: number }
> = gql`
  query dynamicProducts($delayDeferred: Int!, $someArgument: String) {
    products(someArgument: $someArgument) {
      id
      title
      ... @defer {
        rating(delay: $delayDeferred) {
          value
          env
        }
      }
    }
    env
  }
`;

export const RATING_FRAGMENT: TypedDocumentNode<
  {
    __typename: "Product";
    rating: { __typename: "Rating"; value: string; env: string };
  },
  { delayDeferred: number }
> = gql`
  fragment RatingFragment on Product {
    rating(delay: $delayDeferred) {
      value
      env
    }
  }
`;

export const DEFERRED_QUERY_WITH_FRAGMENT: TypedDocumentNode<
  DeferredDynamicProductResult,
  { someArgument?: string; delayDeferred: number }
> = gql`
  query dynamicProducts($delayDeferred: Int!, $someArgument: String) {
    products(someArgument: $someArgument) {
      id
      title
      ...RatingFragment @defer
    }
    env
  }

  ${RATING_FRAGMENT}
`;
