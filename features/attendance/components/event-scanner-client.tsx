"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { checkGeofence } from "@/hooks/use-geofence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  User,
  ArrowRight,
  ArrowLeft,
  Clock,
  Keyboard,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { GetStudentScanStatus, RecordAttendance } from "../actions/attendance";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface EventScannerClientProps {
  event: {
    id: string;
    name: string;
    requires_time_out: boolean;
    start_date: Date;
    end_date: Date;
  };
  initialLogs?: ScanLogEntry[];
}

interface ScanLogEntry {
  id: string;
  studentId: string;
  studentName: string;
  type: "in" | "out";
  time: Date;
}

function playBeep(type: "success" | "error" | "warning") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "warning") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn("Audio feedback play blocked or failed:", e);
  }
}

export function EventScannerClient({
  event,
  initialLogs = [],
}: EventScannerClientProps) {
  const router = useRouter();

  const [locError, setLocError] = React.useState<string | null>(null);
  const [checkingGeofence, setCheckingGeofence] = React.useState(true);
  const [isWithin, setIsWithin] = React.useState<boolean | null>(null);
  const [distanceText, setDistanceText] = React.useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [manualStudentId, setManualStudentId] = React.useState("");

  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [studentInfo, setStudentInfo] = React.useState<any | null>(null);
  const [lastAttendance, setLastAttendance] = React.useState<any | null>(null);
  const [loadingStatus, setLoadingStatus] = React.useState(false);
  const [submittingAttendance, setSubmittingAttendance] = React.useState(false);

  const [sessionLogs, setSessionLogs] =
    React.useState<ScanLogEntry[]>(initialLogs);

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
          msg =
            "Location permission denied. Please allow location access to continue.";
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
          window.location.pathname,
        )}&error=${encodeURIComponent(locError || "You are outside the permitted scanning range.")}&distance=${encodeURIComponent(distanceText || "")}`,
      );
    }
  }, [isWithin, locError, checkingGeofence, distanceText, router]);

  const handleScan = React.useCallback(
    async (result: string) => {
      if (!result) return;
      setLoadingStatus(true);

      try {
        const res = await GetStudentScanStatus(event.id, result);

        if (!res.ok) {
          playBeep("error");
          toast.error(res.error || "Failed to find student.");
          setLoadingStatus(false);
          return;
        }

        playBeep("success");
        setStudentInfo(res.student);
        setLastAttendance(res.lastAttendance);
        setIsConfirmOpen(true);
      } catch (err) {
        playBeep("error");
        toast.error("Failed to query student scan status.");
      } finally {
        setLoadingStatus(false);
      }
    },
    [event.id],
  );

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId.trim()) return;

    const idToQuery = manualStudentId.trim();
    setIsDrawerOpen(false);
    setManualStudentId("");

    await handleScan(idToQuery);
  };

  const handleRecordAttendance = async (type: "in" | "out") => {
    if (!studentInfo) return;
    setSubmittingAttendance(true);

    const toastId = toast.loading(
      `Recording ${type === "in" ? "Time In" : "Time Out"}...`,
    );

    try {
      const result = await RecordAttendance(event.id, studentInfo.id, type);

      if (!result.ok) {
        playBeep("error");
        toast.error(result.error || "Failed to record attendance.", {
          id: toastId,
        });
        setSubmittingAttendance(false);
        return;
      }

      playBeep("success");
      toast.success(result.message || "Attendance recorded successfully.", {
        id: toastId,
      });

      const newEntry: ScanLogEntry = {
        id: result.record?.id || Math.random().toString(),
        studentId: studentInfo.student_id,
        studentName: `${studentInfo.first_name} ${studentInfo.last_name}`,
        type: type,
        time: result.record?.time ? new Date(result.record.time) : new Date(),
      };

      setSessionLogs((prev) => [newEntry, ...prev].slice(0, 10));
      setIsConfirmOpen(false);
      setStudentInfo(null);
      setLastAttendance(null);
    } catch (err) {
      playBeep("error");
      toast.error("An unexpected error occurred while saving.", {
        id: toastId,
      });
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const formattedLastAttendanceTime = lastAttendance?.time
    ? new Date(lastAttendance.time).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const renderRecentScansList = () => {
    if (sessionLogs.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
          <Clock className="size-8 stroke-1.5 opacity-50 mb-2" />
          <p className="text-xs font-semibold">No scans recorded yet</p>
          <p className="text-[10px] opacity-80 mt-1">
            Logs will appear here live as scans complete.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sessionLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between border border-muted p-2.5 rounded-lg text-left"
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground truncate max-w-35">
                {log.studentName}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {log.studentId}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={log.type === "in" ? "secondary" : "outline"}
                className={
                  log.type === "in"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                }
              >
                {log.type === "in" ? "IN" : "OUT"}
              </Badge>
              <span className="text-[9px] text-muted-foreground">
                {new Date(log.time).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (checkingGeofence || !isWithin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-medium">
          Verifying location ...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/attendance/events/${event.id}`} passHref>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-primary truncate max-w-50 sm:max-w-md">
            {event.name}
          </h1>
        </div>
        <div className="flex gap-2">
          {event.requires_time_out ? (
            <Badge
              variant="outline"
              className="border-warning text-warning-foreground"
            >
              Requires Time Out
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-success text-success-foreground"
            >
              Single-scan only
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <div className="relative w-full h-[calc(100vh-12rem)] min-h-100 lg:h-[calc(100vh-14rem)] overflow-hidden rounded-xl border border-border bg-black shadow-lg">
            <Scanner
              onScan={(result) => {
                if (result && result.length > 0) {
                  handleScan(result[0].rawValue);
                }
              }}
              constraints={{
                facingMode: "environment",
              }}
              components={{
                finder: false,
                torch: true,
              }}
              styles={{
                container: { width: "100%", height: "100%" },
                video: { width: "100%", height: "100%", objectFit: "cover" },
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-64 h-64 md:w-80 md:h-80 border-2 border-dashed border-white/40 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 md:w-5 md:h-5 border-t-2 border-l-2 border-white -mt-0.5 -ml-0.5" />
                <div className="absolute top-0 right-0 w-4 h-4 md:w-5 md:h-5 border-t-2 border-r-2 border-white -mt-0.5 -mr-0.5" />
                <div className="absolute bottom-0 left-0 w-4 h-4 md:w-5 md:h-5 border-b-2 border-l-2 border-white -mb-0.5 -ml-0.5" />
                <div className="absolute bottom-0 right-0 w-4 h-4 md:w-5 md:h-5 border-b-2 border-r-2 border-white -mb-0.5 -mr-0.5" />
              </div>
            </div>

            <div className="hidden md:block absolute bottom-4 right-4 z-10 w-80 bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-border">
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <Label
                  htmlFor="desktop-manual-student-id"
                  className="text-xs font-semibold"
                >
                  Manual Student ID Search
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="desktop-manual-student-id"
                    placeholder="251-12345"
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3">
                    Submit
                  </Button>
                </div>
              </form>
            </div>

            <div className="md:hidden absolute bottom-4 right-4 z-10">
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger
                  render={
                    <Button
                      size="icon"
                      className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    />
                  }
                >
                  <Keyboard className="size-5" />
                </DrawerTrigger>
                <DrawerContent className="p-6 space-y-6">
                  <DrawerHeader className="p-0 text-left">
                    <DrawerTitle className="text-lg font-bold">
                      Manual Search & Recent Scans
                    </DrawerTitle>
                    <DrawerDescription className="text-xs">
                      Search by student ID or view recent history.
                    </DrawerDescription>
                  </DrawerHeader>

                  <form onSubmit={handleManualSubmit} className="space-y-2">
                    <Label
                      htmlFor="mobile-manual-student-id"
                      className="text-sm font-medium"
                    >
                      Student ID / Student Number
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="mobile-manual-student-id"
                        placeholder="251-12345"
                        value={manualStudentId}
                        onChange={(e) => setManualStudentId(e.target.value)}
                        className="h-11"
                      />
                      <Button type="submit" className="h-11 px-4">
                        Submit
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent Event Scans
                    </h4>
                    <ScrollArea className="h-50 pr-2">
                      {renderRecentScansList()}
                    </ScrollArea>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          {loadingStatus && (
            <div className="flex items-center justify-center text-muted-foreground py-2 text-xs">
              <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              Resolving student scan status...
            </div>
          )}
        </div>

        <div className="hidden lg:block lg:col-span-1">
          <Card className="border-border h-full lg:h-[calc(100vh-14rem)] min-h-100 flex flex-col shadow-xs">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold">
                Recent Event Scans
              </CardTitle>
              <CardDescription className="text-xs">
                Latest scans recorded for this event.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-4 min-h-62.5 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 pr-2">
                {renderRecentScansList()}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2">
              <User className="size-5.5 text-primary" />
              Verify Attendance Record
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Confirm student credentials and select action to append logs.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {studentInfo && (
            <div className="space-y-5 py-4 w-full">
              <div className="bg-muted/40 p-4 rounded-xl border border-muted flex flex-col items-start gap-1 w-full text-left">
                <h4 className="text-base font-bold text-foreground">
                  {studentInfo.first_name} {studentInfo.last_name}
                </h4>
                <p className="text-xs text-muted-foreground font-mono">
                  Student ID:{" "}
                  <span className="text-foreground">
                    {studentInfo.student_id}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Program/Year:{" "}
                  <span className="text-foreground">
                    {studentInfo.program} - Year {studentInfo.year}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-start gap-1 w-full text-left border-l-3 pl-3 py-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Current Status
                </Label>
                {!lastAttendance ? (
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-500">
                    <Clock className="size-4" />
                    No Attendance logged today
                  </div>
                ) : lastAttendance.type === "in" ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-500">
                      <ArrowRight className="size-4" />
                      Timed In at {formattedLastAttendanceTime}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This student has already timed in.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-500">
                      <ArrowLeft className="size-4" />
                      Timed Out at {formattedLastAttendanceTime}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This student has already completed a Time In & Time Out
                      cycle.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter className="border-t pt-4 gap-2">
            <AlertDialogCancel
              disabled={submittingAttendance}
              onClick={() => {
                setIsConfirmOpen(false);
                setStudentInfo(null);
                setLastAttendance(null);
              }}
              className="cursor-pointer h-13.5"
            >
              Cancel
            </AlertDialogCancel>

            {studentInfo && (
              <>
                {!lastAttendance && (
                  <Button
                    disabled={submittingAttendance}
                    onClick={() => handleRecordAttendance("in")}
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white cursor-pointer h-13.5"
                  >
                    Confirm Time In
                  </Button>
                )}

                {lastAttendance?.type === "in" && (
                  <>
                    {event.requires_time_out ? (
                      <Button
                        disabled={submittingAttendance}
                        onClick={() => handleRecordAttendance("out")}
                        className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white cursor-pointer h-13.5"
                      >
                        Confirm Time Out
                      </Button>
                    ) : (
                      <Button
                        disabled={submittingAttendance}
                        onClick={() => handleRecordAttendance("in")}
                        variant="outline"
                        className="cursor-pointer h-13.5"
                      >
                        Time In Again
                      </Button>
                    )}
                  </>
                )}

                {lastAttendance?.type === "out" && (
                  <Button
                    disabled={submittingAttendance}
                    onClick={() => handleRecordAttendance("in")}
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white cursor-pointer h-13.5"
                  >
                    Time In Again
                  </Button>
                )}
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
