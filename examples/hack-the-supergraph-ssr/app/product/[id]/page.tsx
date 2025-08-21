"use client";

import ReviewRating from "@/components/ReviewRating";

// import SubmitReview from '../components/SubmitReview';

import {
  Flex,
  HStack,
  Heading,
  Image,
  Skeleton,
  Stack,
  StackDivider,
  Text,
} from "@chakra-ui/react";
import { gql, TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";

const GET_PRODUCT_DETAILS: TypedDocumentNode<{
  product: {
    id: string;
    title: string;
    description: string;
    mediaUrl: string;
    averageRating?: number;
    reviews?: {
      content: string;
      rating: number;
    }[];
  };
}> = gql`
  fragment ProductFragment on Product {
    averageRating
    reviews {
      content
      rating
    }
  }

  query GetProductDetails($productId: ID!) {
    product(id: $productId) {
      id
      title
      description
      mediaUrl
      ...ProductFragment @defer
    }
  }
`;

export default function Product({
  params: { id },
}: {
  params: { id: string };
}) {
  const { data, error } = useSuspenseQuery(GET_PRODUCT_DETAILS, {
    variables: { productId: decodeURIComponent(id) },
    // if the cache data from SSR is only partial, this will still trigger a network request
    fetchPolicy: "cache-first",
  });
  if (error) {
    // we want not only the initial error to throw towards a suspense boundary,
    // but also errors coming in later to trigger the same boundary
    throw error;
  }

  const { title, description, mediaUrl, reviews, averageRating } = data.product;

  return (
    <Stack direction="column" px="12" spacing="6" mb="12">
      <Heading as="h1" size="lg">
        {title}
      </Heading>
      <Skeleton isLoaded={reviews !== undefined} w="192px">
        <HStack>
          {averageRating && (
            <ReviewRating isHalf size={16} rating={averageRating || 0} />
          )}
          <div>({reviews?.length || "-"})</div>
        </HStack>
      </Skeleton>
      <Stack direction="column" spacing="6">
        <Image
          src={mediaUrl}
          alt={title}
          objectFit="contain"
          width="100%"
          height="500px"
          borderRadius="12"
        />
        <Flex direction="column" justify="space-between">
          <Heading as="h2" py="4" size="md" mb="2">
            About this product
          </Heading>
          <Text fontWeight="regular" mr="1">
            {description}
          </Text>
        </Flex>
      </Stack>
      <Flex direction="row">
        <Stack flex="1" direction="column" spacing="12">
          <Stack
            direction="column"
            spacing="4"
            divider={<StackDivider borderColor="gray.200" />}
          >
            <Heading as="h2" size="md" mb="2" marginTop={8}>
              What other users have to say
            </Heading>
            <Skeleton isLoaded={reviews !== undefined} h="100px">
              {reviews?.length === 0 ? (
                <Text>No reviews yet</Text>
              ) : (
                reviews?.map(({ content, rating }, i) => (
                  <Stack
                    direction="column"
                    spacing="1"
                    key={`${i}-${rating}`}
                    py="8"
                  >
                    <ReviewRating size={16} rating={rating} />
                    <Text py="2">{content}</Text>
                  </Stack>
                ))
              )}
            </Skeleton>
          </Stack>
        </Stack>
      </Flex>
    </Stack>
  );
}
