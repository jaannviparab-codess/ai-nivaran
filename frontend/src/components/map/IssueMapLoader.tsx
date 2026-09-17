"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import type { IssueMapProps } from "./IssueMap";

const IssueMap = dynamic(() => import("./IssueMap").then((m) => m.IssueMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

export function IssueMapLoader(props: IssueMapProps) {
  return <IssueMap {...props} />;
}
