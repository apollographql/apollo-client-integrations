"use client";

import ProductCard from "../components/ProductCard";
import { Heading, SimpleGrid, Stack, Text, VStack } from "@chakra-ui/react";
import { gql, TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";

const GET_LATEST_PRODUCTS: TypedDocumentNode<{
  products: { id: string }[];
}> = gql`
  query HomepageProducts {
    products {
      id
      ...ProductCardProductFragment
    }
  }
  ${ProductCard.fragments.ProductCardProductFragment}
`;
export default function HomePage() {
  const { data } = useSuspenseQuery(GET_LATEST_PRODUCTS, {
    fetchPolicy: "cache-first",
  });
  return (
    <Stack direction="column" spacing="12">
      <VStack direction="column" spacing="2" py="10">
        <Heading size="2xl">Find yourself in a galaxy far, far away</Heading>
        <Text fontSize="2xl">
          Let&apos;s find the right place for you! Check out what other
          cosmonauts are saying.
        </Text>
      </VStack>
      <Stack direction="column" spacing="4">
        <Heading as="h2" size="lg">
          Products
        </Heading>

        <SimpleGrid columns={[1, null, 2]} spacing={4}>
          {data?.products.map((product) => (
            <ProductCard key={product.id} id={product.id} />
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
