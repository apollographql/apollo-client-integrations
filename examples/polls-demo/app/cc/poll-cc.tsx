"use client";

import { Suspense } from "react";
import {
  QueryRef,
  useBackgroundQuery,
  useMutation,
  useReadQuery,
} from "@apollo/client/react";
import { Poll as PollInner } from "@/components/poll";

import { useState, useCallback } from "react";

import {
  AnswerPollDocument,
  GetPollDocument,
  GetPollQuery,
} from "@/components/poll/documents.generated";

export const PollWrapper = () => {
  const [queryRef] = useBackgroundQuery(GetPollDocument, {
    variables: { id: "1", delay: 0 },
  });

  return (
    <Suspense fallback={<>Loading...</>}>
      <Poll queryRef={queryRef} />
    </Suspense>
  );
};

const Poll = ({ queryRef }: { queryRef: QueryRef<GetPollQuery> }) => {
  const { data } = useReadQuery(queryRef);
  const [showResults, setShowResults] = useState(false);
  const [mutate, { loading: mutationLoading }] =
    useMutation(AnswerPollDocument);

  const handleClick = useCallback(
    async (answerId: string) => {
      await mutate({
        variables: { pollId: "1", answerId },
      });

      setShowResults(true);
    },
    [mutate]
  );

  return (
    <PollInner
      poll={(data as any).poll}
      loading={mutationLoading}
      onClick={handleClick}
      showResults={showResults}
    />
  );
};
