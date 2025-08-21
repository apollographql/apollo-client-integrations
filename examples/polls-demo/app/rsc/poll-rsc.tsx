"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Poll as PollInner } from "@/components/poll";
import { useMutation } from "@apollo/client/react";
import { AnswerPollDocument } from "@/components/poll/documents.generated";

export const Poll = ({
  poll,
}: {
  poll: {
    id: string;
    question: string;
    totalVotes: number;
    answers: {
      id: string;
      votes: number;
      percentage: number;
      text: string;
    }[];
  };
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const showResults = useSearchParams().get("results") === "true";

  const [loading, setLoading] = useState(false);

  const [mutate] = useMutation(AnswerPollDocument);

  const handleClick = useCallback(
    async (answerId: string) => {
      setLoading(true);

      await mutate({
        variables: { pollId: poll.id, answerId },
      });

      router.push(`${pathname}?results=true`);

      // this doesn't wait for the page to be reloaded
      // but it's fine for this demo
      setLoading(false);
    },
    [mutate, poll.id, router, pathname]
  );

  return (
    <PollInner
      poll={poll}
      loading={loading}
      onClick={handleClick}
      showResults={showResults}
    />
  );
};
