import { MapPinOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <MapPinOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        The page you’re looking for doesn’t exist, or may have moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Button href="/">Back to home</Button>
        <Button href="/map" variant="outline">
          Explore the map
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Looking for a specific report?{" "}
        <Link href="/track" className="font-medium text-primary-700 hover:underline">
          Track it here
        </Link>
        .
      </p>
    </div>
  );
}
