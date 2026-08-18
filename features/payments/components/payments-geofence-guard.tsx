"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { checkGeofence } from "@/hooks/use-geofence";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPinOff, RefreshCw, ShieldAlert, MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface PaymentsGeofenceGuardProps {
  children: ReactNode;
}

export function PaymentsGeofenceGuard({ children }: PaymentsGeofenceGuardProps) {
  const [checking, setChecking] = useState(true);
  const [isWithin, setIsWithin] = useState<boolean | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const verifyLocation = useCallback(() => {
    setChecking(true);
    setErrorMsg(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setChecking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const result = checkGeofence(userCoords);
        setIsWithin(result.isWithinFence);
        setDistanceText(result.formattedDistance);
        setChecking(false);
      },
      (err) => {
        let msg = "Failed to retrieve your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings to access Payments.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable. Please check your network/GPS connection.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please click re-verify to try again.";
        }
        setErrorMsg(msg);
        setIsWithin(false);
        setChecking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    verifyLocation();
  }, [verifyLocation]);

  if (checking) {
    return (
      <div className="w-full min-h-[350px] flex flex-col items-center justify-center p-8 border rounded-xl bg-card space-y-4 text-center">
        <Spinner className="h-8 w-8 text-primary" />
        <div className="space-y-1">
          <h3 className="font-bold text-base text-foreground">
            Verifying Campus Location...
          </h3>
          <p className="text-xs text-muted-foreground">
            Checking your GPS coordinates against the CCIS campus geofence boundary.
          </p>
        </div>
      </div>
    );
  }

  if (!isWithin) {
    return (
      <div className="w-full max-w-2xl mx-auto py-8 px-4 space-y-6">
        <Card className="border-destructive/30 shadow-md">
          <CardHeader className="text-center pb-4 space-y-3">
            <div className="mx-auto rounded-full bg-destructive/10 p-4 text-destructive w-fit">
              <MapPinOff className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="destructive" className="font-mono text-[10px] uppercase">
                  Geofence Restriction
                </Badge>
              </div>
              <CardTitle className="text-xl font-black text-foreground">
                Outside Designated Payments Geofence
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground max-w-md mx-auto">
                Payment collection, merchandise management, and transaction records require physical presence within the campus boundary (400m radius of CCIS office).
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {errorMsg ? (
              <div className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive font-medium flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Current Distance from Campus:</span>
                </div>
                <span className="font-mono font-bold text-foreground">
                  {distanceText || "Outside boundary"}
                </span>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center pt-2">
            <Button
              onClick={verifyLocation}
              className="h-13.5 px-6 font-semibold text-xs gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Re-verify My Location
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
