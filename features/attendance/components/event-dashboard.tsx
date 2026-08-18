"use client";

import * as React from "react";
import { CSSProperties } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  QrCode,
  TrendingUp,
  UserCheck,
  UserX,
  Scan,
  GraduationCap,
  LogIn,
  LogOut,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { format, isSameDay, addDays } from "date-fns";

const chartConfig = {
  checkIns: {
    label: "Time In",
    color: "oklch(0.707 0.176 49.9816)",
  },
  checkOuts: {
    label: "Time Out",
    color: "oklch(0.582 0.182 24.8035)",
  },
} satisfies ChartConfig;

interface EventDashboardProps {
  event: any;
  chartData?: Array<{ time: string; checkIns: number; checkOuts: number }>;
}

export function EventDashboard({ event }: EventDashboardProps) {
  const [selectedDay, setSelectedDay] = React.useState<string>("ALL");

  const eventDays = React.useMemo(() => {
    if (!event.start_date || !event.end_date) return [];
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    const days: Array<{ id: string; label: string; dateStr: string }> = [];
    let current = new Date(start);
    current.setHours(0, 0, 0, 0);

    const last = new Date(end);
    last.setHours(23, 59, 59, 999);

    let dayIndex = 1;
    while (current <= last) {
      const dateStr = format(current, "yyyy-MM-dd");
      const label = `Day ${dayIndex} (${format(current, "MMM d")})`;
      days.push({ id: dateStr, label, dateStr });
      current = addDays(current, 1);
      dayIndex++;
    }

    return days;
  }, [event.start_date, event.end_date]);

  const filteredAttendance = React.useMemo(() => {
    const list = event.attendance || [];
    if (selectedDay === "ALL") return list;
    return list.filter((a: any) => {
      const aDateStr = format(new Date(a.time), "yyyy-MM-dd");
      return aDateStr === selectedDay;
    });
  }, [event.attendance, selectedDay]);

  const checkInCount = React.useMemo(
    () => filteredAttendance.filter((a: any) => a.type === "in").length,
    [filteredAttendance]
  );

  const checkOutCount = React.useMemo(
    () => filteredAttendance.filter((a: any) => a.type === "out").length,
    [filteredAttendance]
  );

  const totalCount = filteredAttendance.length;

  const programStats = React.useMemo(() => {
    const map: Record<string, { timeIn: number; timeOut: number; total: number }> = {
      BSIT: { timeIn: 0, timeOut: 0, total: 0 },
      BSIS: { timeIn: 0, timeOut: 0, total: 0 },
      BSCS: { timeIn: 0, timeOut: 0, total: 0 },
    };

    filteredAttendance.forEach((a: any) => {
      const prog = a.student?.program;
      if (prog && map[prog]) {
        if (a.type === "in") {
          map[prog].timeIn += 1;
        } else if (a.type === "out") {
          map[prog].timeOut += 1;
        }
        map[prog].total += 1;
      }
    });

    return map;
  }, [filteredAttendance]);

  const timelineChartData = React.useMemo(() => {
    const hours24: Array<{ hourNum: number; label: string }> = [];
    for (let h = 0; h < 24; h++) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      const label = `${hour12.toString().padStart(2, "0")}:00 ${ampm}`;
      hours24.push({ hourNum: h, label });
    }

    const map = new Map<string, { time: string; checkIns: number; checkOuts: number }>();
    hours24.forEach((h) => {
      map.set(h.label, { time: h.label, checkIns: 0, checkOuts: 0 });
    });

    filteredAttendance.forEach((att: any) => {
      const formattedHour = format(new Date(att.time), "hh:00 a");
      if (map.has(formattedHour)) {
        const item = map.get(formattedHour)!;
        if (att.type === "in") {
          item.checkIns += 1;
        } else if (att.type === "out") {
          item.checkOuts += 1;
        }
      }
    });

    return Array.from(map.values());
  }, [filteredAttendance]);

  const PROGRAMS = [
    {
      code: "BSIT",
      name: "Information Technology",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      code: "BSIS",
      name: "Information Systems",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      code: "BSCS",
      name: "Computer Science",
      badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
  ] as const;

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const dateStr = React.useMemo(() => {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
      return format(start, "MMMM d, yyyy");
    }
    return `${format(start, "MMMM d, yyyy")} - ${format(end, "MMMM d, yyyy")}`;
  }, [event]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/dashboard/attendance/events" passHref>
          <Button variant="ghost" className="h-13.5 cursor-pointer gap-2 pl-2">
            <ChevronLeft className="size-4.5" />
            <span className="hidden sm:inline">Back to Events</span>
          </Button>
        </Link>
        <Link href={`/dashboard/attendance/scan/${event.id}`} passHref>
          <Button className="h-13.5 cursor-pointer gap-2">
            <QrCode className="size-4.5" />
            Scan Attendance
          </Button>
        </Link>
      </div>

      {eventDays.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap p-1.5 rounded-xl border bg-card text-xs">
          <span className="text-muted-foreground font-semibold px-2 flex items-center gap-1">
            <Calendar className="size-3.5" /> Filter Day:
          </span>
          <Button
            type="button"
            variant={selectedDay === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDay("ALL")}
            className="h-8 px-3 text-xs font-semibold"
          >
            All Days ({eventDays.length} Days)
          </Button>
          {eventDays.map((d) => (
            <Button
              key={d.id}
              type="button"
              variant={selectedDay === d.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDay(d.id)}
              className="h-8 px-3 text-xs font-semibold"
            >
              {d.label}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardDescription className="text-xs font-semibold">
                Total Scans {selectedDay !== "ALL" ? "(Selected Day)" : ""}
              </CardDescription>
              <CardTitle className="text-2xl font-black">
                {totalCount}
              </CardTitle>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Scan className="size-5" />
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardDescription className="text-xs font-semibold">
                Time In Logs
              </CardDescription>
              <CardTitle className="text-2xl font-black text-primary">
                {checkInCount}
              </CardTitle>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <UserCheck className="size-5" />
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardDescription className="text-xs font-semibold">
                Time Out Logs
              </CardDescription>
              <CardTitle className="text-2xl font-black text-destructive">
                {checkOutCount}
              </CardTitle>
            </div>
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <UserX className="size-5" />
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight">Program Attendance Overview</h3>
          <span className="text-xs text-muted-foreground font-medium">BSIT • BSIS • BSCS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROGRAMS.map((prog) => {
            const stats = programStats[prog.code] || { timeIn: 0, timeOut: 0, total: 0 };
            const inPercent = stats.total > 0 ? Math.round((stats.timeIn / stats.total) * 100) : 0;
            const outPercent = stats.total > 0 ? Math.round((stats.timeOut / stats.total) * 100) : 0;

            return (
              <Card key={prog.code} className="border-border relative overflow-hidden transition-all hover:shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <GraduationCap className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          {prog.code}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium">
                          {prog.name}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={`font-bold ${prog.badgeClass}`}>
                      {stats.total} {stats.total === 1 ? "Scan" : "Scans"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <LogIn className="size-3.5 text-emerald-500" />
                        <span>Time In</span>
                      </div>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {stats.timeIn}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <LogOut className="size-3.5 text-rose-500" />
                        <span>Time Out</span>
                      </div>
                      <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                        {stats.timeOut}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                      <span>Time In / Out Ratio</span>
                      <span>{stats.total > 0 ? `${inPercent}% / ${outPercent}%` : "No scans yet"}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted flex">
                      {stats.total > 0 ? (
                        <>
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${inPercent}%` }}
                          />
                          <div
                            className="bg-rose-500 h-full transition-all duration-500"
                            style={{ width: `${outPercent}%` }}
                          />
                        </>
                      ) : (
                        <div className="bg-muted-foreground/20 h-full w-full" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="w-full border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Attendance Flow Timeline</span>
            <Badge variant="secondary" className="font-semibold gap-1">
              <TrendingUp className="size-3" />
              12 AM - 11:59 PM (GMT+8)
            </Badge>
          </CardTitle>
          <CardDescription>
            Scan frequency check-ins/outs mapped 12:00 AM to 11:59 PM ({dateStr})
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {!mounted ? (
            <div className="h-96 w-full flex items-center justify-center bg-card/5 rounded-lg border border-dashed text-muted-foreground font-semibold">
              Loading timeline chart...
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="h-96 w-full aspect-auto"
            >
              <AreaChart
                accessibilityLayer
                data={timelineChartData}
                margin={{ top: 20, right: 10, bottom: 20, left: 40 }}
              >
                <defs>
                  <linearGradient
                    id="checkins-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-checkIns)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-checkIns)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id="checkouts-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-checkOuts)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-checkOuts)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} />

                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={1}
                  className="text-xs font-mono"
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs font-mono"
                  allowDecimals={false}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(label) => `Time Window: ${label}`}
                    />
                  }
                />

                <Area
                  dataKey="checkOuts"
                  type="natural"
                  fill="url(#checkouts-fill)"
                  fillOpacity={0.4}
                  stroke="var(--color-checkOuts)"
                  strokeWidth={2}
                  stackId="a"
                />
                <Area
                  dataKey="checkIns"
                  type="natural"
                  fill="url(#checkins-fill)"
                  fillOpacity={0.4}
                  stroke="var(--color-checkIns)"
                  strokeWidth={2}
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
