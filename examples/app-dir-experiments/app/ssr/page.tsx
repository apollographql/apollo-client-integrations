"use client";
import React, { Suspense } from "react";
import { useFragment, useQuery, useSuspenseQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { HtmlChangesObserver } from "@/components/HtmlChangesObserver";

export const dynamic = "force-dynamic";
// 'auto' | 'force-dynamic' | 'error' | 'force-static'

export default function Page() {
  return (
    <HtmlChangesObserver>
      <Suspense>
        <SuspenseQueryUser>
          <FragmentUser />
          <QueryUser />
        </SuspenseQueryUser>
        <FragmentUser />
        <QueryUser />
      </Suspense>
      <Suspense>
        <SuspenseQueryPosts>
          <QueryUser />
        </SuspenseQueryPosts>
        <QueryUser />
      </Suspense>
    </HtmlChangesObserver>
  );
}

function Result({ source, data }: { source: string; data: unknown }) {
  return (
    <div>
      <span>Source: {source}</span>
      <span>
        Data:
        {JSON.stringify(data)}
      </span>
    </div>
  );
}

const userFragment = gql`
  fragment UserFragment on User {
    id
    name
  }
`;

const userQuery = gql`
  query {
    getUser(id: "1") {
      ...UserFragment
    }
  }
  ${userFragment}
`;

const postsQuery = gql`
  query {
    getPosts {
      id
      title
    }
  }
`;

function SuspenseQueryUser({ children }: React.PropsWithChildren) {
  const result = useSuspenseQuery(userQuery, { fetchPolicy: "cache-first" });
  return (
    <>
      <Result source="useSuspenseQuery(userQuery)" data={result.data} />
      <React.Fragment key="children">{children}</React.Fragment>
    </>
  );
}

function SuspenseQueryPosts({ children }: React.PropsWithChildren) {
  const result = useSuspenseQuery(postsQuery, { fetchPolicy: "cache-first" });
  return (
    <>
      <Result source="useSuspenseQuery(postsQuery)" data={result.data} />
      <React.Fragment key="children">{children}</React.Fragment>
    </>
  );
}

function FragmentUser({ children }: React.PropsWithChildren) {
  const result = useFragment({
    fragment: userFragment,
    from: { __typename: "User", id: "1" },
  });
  return (
    <>
      <Result source="useFragment(userFragment)" data={result.data} />
      <React.Fragment key="children">{children}</React.Fragment>
    </>
  );
}

function QueryUser({ children }: React.PropsWithChildren) {
  const result = useQuery(userQuery, { fetchPolicy: "cache-first" });
  return (
    <>
      <Result source="useQuery(userQuery)" data={result.data} />
      <React.Fragment key="children">{children}</React.Fragment>
    </>
  );
}
