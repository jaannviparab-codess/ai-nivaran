"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";

export const DraggablePinMapLoader = dynamic(
  () => import("./DraggablePinMap").then((m) => m.DraggablePinMap),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-2xl" /> }
);
