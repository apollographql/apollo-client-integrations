import { ApolloWrapper } from "@/app/cc/ApolloWrapper";
import { ClientChild } from "../../PreloadQuery/queryRef-useReadQuery/ClientChild";
import { QUERY } from "@integration-test/shared/queries";
import { createTransportedQueryPreloader } from "@apollo/client-react-streaming";
import { Suspense } from "react";
import { getClient, PreloadQueryRef } from "../../../client";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams?: any }) {
  const preloader = createTransportedQueryPreloader(await getClient(), {
    notTransportedOptionOverrides: { fetchPolicy: "no-cache" },
  });
  const queryRef = preloader(QUERY, {
    context: {
      delay: 1000,
      error: (await searchParams)?.errorIn || undefined,
    },
  });

  return (
    <ApolloWrapper>
      <PreloadQueryRef queryRef={queryRef}>
        <Suspense fallback={<>loading</>}>
          <ClientChild queryRef={queryRef} />
        </Suspense>
      </PreloadQueryRef>
    </ApolloWrapper>
  );
}
