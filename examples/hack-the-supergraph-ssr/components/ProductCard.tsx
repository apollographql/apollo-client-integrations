import Button from "./Button";
import ReviewRating from "./ReviewRating";
import {
  Box,
  Flex,
  Heading,
  Image,
  Text,
  usePrefersReducedMotion,
} from "@chakra-ui/react";
import Link from "next/link";
import { TypedDocumentNode, gql } from "@apollo/client";
import { useFragment } from "@apollo/client/react";

const ProductCardProductFragment: TypedDocumentNode<{
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  averageRating: number;
}> = gql`
  fragment ProductCardProductFragment on Product {
    id
    title
    description
    mediaUrl
    ... @defer {
      averageRating
    }
  }
`;

function ProductCard({ id }: { id: string }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const { data } = useFragment({
    fragment: ProductCardProductFragment,
    from: `Product:${id}`,
  });

  const zoomAnimation = prefersReducedMotion
    ? {}
    : {
        transform: "scale(1.1)",
        opacity: "100%",
      };

  return (
    <Box role="group" as={Link} href={`/product/${id}`} prefetch={false}>
      <Image
        transition="0.3s all ease-in-out"
        opacity={"95%"}
        _groupHover={zoomAnimation}
        _groupFocus={zoomAnimation}
        src={data?.mediaUrl}
        alt={data?.title}
        objectFit="contain"
        maxHeight="250px"
      />
      <Flex direction="column" p="3" justify="space-between" minH="120px">
        <Heading as="h2" size="md" my="4">
          {data?.title}
        </Heading>
        {data?.averageRating ? (
          <Flex direction="column" minH="100px" justify="space-between">
            <Text as="i" noOfLines={2}>{`"${data?.description}"`}</Text>
            <Flex direction="row" py="4" justify="space-between">
              <ReviewRating isHalf rating={data?.averageRating} size={20} />
              <Button>Read More</Button>
            </Flex>
          </Flex>
        ) : (
          <Flex direction="row" justify="right">
            <Button>Leave a Review</Button>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

ProductCard.fragments = {
  ProductCardProductFragment,
};
export default ProductCard;
