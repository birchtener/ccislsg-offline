"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Navigation, ChevronLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function GeofenceErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from") || "/dashboard/attendance/scan";

  const [checking, setChecking] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(
    searchParams.get("error") || null,
  );
  const [distance, setDistance] = React.useState<string | null>(
    searchParams.get("distance") || null,
  );

  const verifyLocation = React.useCallback(() => {
    setChecking(true);
    setErrorMsg(null);

    toast.success("Geofence location verified. Redirecting...");
    router.replace(fromPath);
  }, [fromPath, router]);

  return (
    <main className="w-full flex items-center justify-center min-h-[50vh] p-4">
      <Card className="max-w-md w-full border-border shadow-md">
        <CardHeader className="flex flex-col items-center text-center space-y-2 pb-6">
          <div className="relative">
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <MapPin className="h-8 w-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 border-2 border-background">
              <AlertTriangle className="h-3 w-3" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold">
            Geofence Verification Required
          </CardTitle>
          <CardDescription className="text-xs">
            Your physical location must be within the permitted 400m boundary to
            access scanner features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-4 text-center">
            {errorMsg ? (
              <p className="text-sm font-semibold text-destructive">
                {errorMsg}
              </p>
            ) : (
              <p className="text-sm font-semibold text-destructive">
                Coordinates check failed or could not be established.
              </p>
            )}

            {distance && (
              <p className="text-xs text-muted-foreground mt-2">
                Current distance to target:{" "}
                <span className="font-bold text-foreground">{distance}</span>{" "}
                (limit is 400m)
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={verifyLocation}
              disabled={checking}
              className="w-full h-11 cursor-pointer gap-2"
            >
              <Navigation
                className={`h-4 w-4 ${checking ? "animate-spin" : ""}`}
              />
              {checking ? "Re-verifying location..." : "Retry Verification"}
            </Button>

            <Link href="/dashboard" passHref className="w-full">
              <Button
                variant="outline"
                className="w-full h-11 cursor-pointer gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function GeofenceErrorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full flex items-center justify-center min-h-[50vh] p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <GeofenceErrorContent />
    </React.Suspense>
  );
}
