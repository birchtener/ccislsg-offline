"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  ScanQrCode,
  XCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface ScanClientProps {
  events: Array<{
    id: string;
    name: string;
    requires_time_out: boolean;
    start_date: Date;
    end_date: Date;
  }>;
}

export function ScanClient({ events }: ScanClientProps) {
  const router = useRouter();

  const [locError, setLocError] = React.useState<string | null>(null);
  const [checkingGeofence, setCheckingGeofence] = React.useState(true);
  const [isWithin, setIsWithin] = React.useState<boolean | null>(null);
  const [distanceText, setDistanceText] = React.useState<string | null>(null);

  const verifyLocation = React.useCallback(() => {
    setCheckingGeofence(true);
    setLocError(null);

    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setCheckingGeofence(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const check = checkGeofence(userCoords);
        setIsWithin(check.isWithinFence);
        setDistanceText(check.formattedDistance);
        setCheckingGeofence(false);
      },
      (error) => {
        let msg = "Unable to retrieve device location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access to continue.";
        }
        setLocError(msg);
        setCheckingGeofence(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  React.useEffect(() => {
    verifyLocation();
  }, [verifyLocation]);

  React.useEffect(() => {
    if (checkingGeofence) return;

    if (!isWithin || locError) {
      router.replace(
        `/dashboard/attendance/geofence-error?from=${encodeURIComponent(
          window.location.pathname
        )}&error=${encodeURIComponent(locError || "You are outside the permitted scanning range.")}&distance=${encodeURIComponent(distanceText || "")}`
      );
    }
  }, [isWithin, locError, checkingGeofence, distanceText, router]);

  if (checkingGeofence || !isWithin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-medium">
          Verifying location clearance...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full mt-8 flex flex-col gap-6">
      {events.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <XCircle className="h-10 w-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">No Active Events</p>
            <p className="text-sm text-muted-foreground">
              There are currently no active attendance events scheduled for today.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">
            Select Active Event to Scan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => {
              const now = new Date();
              const start = new Date(event.start_date);
              const end = new Date(event.end_date);

              const isOngoing = now >= start && now <= end;
              const isUpcoming = now < start;

              return (
                <Card
                  key={event.id}
                  className="border-border flex flex-col h-full hover:shadow-xs transition-shadow"
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold">
                          {event.name}
                        </CardTitle>
                        <Badge
                          variant={isOngoing ? "default" : isUpcoming ? "secondary" : "outline"}
                          className={isOngoing ? "bg-emerald-500 hover:bg-emerald-600 text-white font-bold" : ""}
                        >
                          {isOngoing ? "Active Today" : isUpcoming ? "Upcoming" : "Past Event"}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1.5 text-xs">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {new Date(event.start_date).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                        {event.start_date !== event.end_date && (
                          <span>
                            {" - "}
                            {new Date(event.end_date).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric", year: "numeric" },
                            )}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="rounded-full bg-primary/5 p-2.5 text-primary border border-primary/10">
                      <ScanQrCode className="size-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <div className="flex gap-2">
                      <Badge variant="secondary">Time In</Badge>
                      {event.requires_time_out && (
                        <Badge variant="outline">Time Out</Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t">
                    <Link
                      href={`/dashboard/attendance/scan/${event.id}`}
                      passHref
                      className="w-full"
                    >
                      <Button className="w-full h-10 cursor-pointer gap-2">
                        <ScanQrCode className="size-4" />
                        Start Scanner
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
