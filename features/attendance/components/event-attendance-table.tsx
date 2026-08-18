"use client";

import { useMemo, useState, Fragment, useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Search, Filter, Calendar, Clock, ChevronRight } from "lucide-react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { GetExportEventAttendanceData } from "@/features/attendance/actions/events";

export interface StudentAttendanceRow {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  year: number;
  status: string;
  scanType: "in" | "out" | "none";
  lastScanTime: Date | null;
  renderedTime: string;
  logs: { id: string; type: "in" | "out"; time: Date }[];
}

interface EventAttendanceTableProps {
  data: StudentAttendanceRow[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  eventId: string;
}

const filterItems = [
  { value: "BSCS", label: "BSCS", type: "program" },
  { value: "BSIT", label: "BSIT", type: "program" },
  { value: "BSIS", label: "BSIS", type: "program" },
  { value: 1, label: "1st Year", type: "year" },
  { value: 2, label: "2nd Year", type: "year" },
  { value: 3, label: "3rd Year", type: "year" },
  { value: 4, label: "4th Year", type: "year" },
  { value: 5, label: "5th Year", type: "year" },
  { value: "Absent", label: "Absent", type: "status" },
  { value: "Timed In", label: "Timed In", type: "status" },
  { value: "Timed Out", label: "Timed Out", type: "status" },
];

export function EventAttendanceTable({
  data,
  totalCount,
  pageSize,
  currentPage,
  eventId,
}: EventAttendanceTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") ?? "";
  const [inputSearch, setInputSearch] = useState(currentSearch);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await GetExportEventAttendanceData(eventId);
      if (!res.ok || !res.attendance) {
        toast.error(res.error || "Failed to fetch export data");
        return;
      }

      const headers = [
        "Student ID",
        "Last Name",
        "First Name",
        "Program",
        "Year",
        "Attendance Status",
        "Rendered Time",
        "Times In",
        "Times Out",
      ];

      const rows = res.attendance.map((row) => {
        const formatTime = (time: Date) => {
          return new Date(time).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          });
        };
        const timesInStr = `[${row.times_in.map(formatTime).map(t => `"${t}"`).join(", ")}]`;
        const timesOutStr = `[${row.times_out.map(formatTime).map(t => `"${t}"`).join(", ")}]`;

        return [
          row.student_id,
          row.last_name,
          row.first_name,
          row.program,
          row.year,
          row.status,
          row.renderedTime,
          timesInStr,
          timesOutStr,
        ];
      });

      const csvContent =
        "\uFEFF" +
        [
          headers.join(","),
          ...rows.map((row) =>
            row
              .map((val) => {
                const str = String(val ?? "");
                if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                  return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
              })
              .join(",")
          ),
        ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `${res.eventName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_attendance.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Attendance logs exported successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export attendance data.");
    } finally {
      setIsExporting(false);
    }
  };

  const [selectedStudent, setSelectedStudent] =
    useState<StudentAttendanceRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const [sorting, setSorting] = useState<SortingState>([]);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setInputSearch(currentSearch);
  }, [currentSearch]);

  const debouncedUpdateSearch = useDebouncedCallback((val: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        params.set("search", val);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputSearch(val);
    debouncedUpdateSearch(val);
  };

  const anchor = useComboboxAnchor();
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_VISIBLE = 1;

  const currentPrograms = useMemo(() => {
    return searchParams.get("program")?.split(",").map((p) => p.trim()).filter(Boolean) ?? [];
  }, [searchParams]);

  const currentYears = useMemo(() => {
    return searchParams
      .get("year")
      ?.split(",")
      .map((y) => parseInt(y.trim(), 10))
      .filter((y) => !isNaN(y)) ?? [];
  }, [searchParams]);

  const currentStatuses = useMemo(() => {
    return searchParams.get("status")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  }, [searchParams]);

  const selectedLabels = useMemo(() => {
    const labels: string[] = [];
    currentPrograms.forEach((p) => {
      const match = filterItems.find((item) => item.type === "program" && item.value === p);
      if (match) labels.push(String(match.label));
    });
    currentYears.forEach((y) => {
      const match = filterItems.find((item) => item.type === "year" && item.value === y);
      if (match) labels.push(String(match.label));
    });
    currentStatuses.forEach((s) => {
      const match = filterItems.find((item) => item.type === "status" && item.value === s);
      if (match) labels.push(String(match.label));
    });
    return labels;
  }, [currentPrograms, currentYears, currentStatuses]);

  const handleFilterChange = (labels: string[]) => {
    const programs: string[] = [];
    const years: number[] = [];
    const statuses: string[] = [];

    labels.forEach((label) => {
      const item = filterItems.find((f) => f.label === label);
      if (item) {
        if (item.type === "program") {
          programs.push(item.value as string);
        } else if (item.type === "year") {
          years.push(item.value as number);
        } else if (item.type === "status") {
          statuses.push(item.value as string);
        }
      }
    });

    const params = new URLSearchParams(searchParams.toString());

    if (programs.length > 0) {
      params.set("program", programs.join(","));
    } else {
      params.delete("program");
    }

    if (years.length > 0) {
      params.set("year", years.join(","));
    } else {
      params.delete("year");
    }

    if (statuses.length > 0) {
      params.set("status", statuses.join(","));
    } else {
      params.delete("status");
    }

    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleRowClick = (student: StudentAttendanceRow) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  const columns = useMemo<ColumnDef<StudentAttendanceRow>[]>(
    () => [
      {
        accessorKey: "student_id",
        id: "student_id",
        header: ({ column }) => (
          <DataGridColumnHeader title="Student ID" column={column} />
        ),
        enableSorting: true,
        size: 120,
      },
      {
        accessorKey: "last_name",
        id: "last_name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Last Name" column={column} />
        ),
        enableSorting: true,
        size: 150,
      },
      {
        accessorKey: "first_name",
        id: "first_name",
        header: ({ column }) => (
          <DataGridColumnHeader title="First Name" column={column} />
        ),
        enableSorting: true,
        size: 150,
      },
      {
        accessorKey: "program",
        id: "program",
        header: ({ column }) => (
          <DataGridColumnHeader title="Program" column={column} />
        ),
        enableSorting: true,
        size: 100,
      },
      {
        accessorKey: "year",
        id: "year",
        header: ({ column }) => (
          <DataGridColumnHeader title="Year" column={column} />
        ),
        enableSorting: true,
        size: 80,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Attendance Status" column={column} />
        ),
        cell: ({ row }) => {
          const { status, scanType, lastScanTime } = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <Badge
                variant={
                  scanType === "none"
                    ? "outline"
                    : scanType === "in"
                      ? "secondary"
                      : "default"
                }
                className={
                  scanType === "none"
                    ? "bg-muted/10 text-muted-foreground border-muted-foreground/20"
                    : scanType === "in"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                }
              >
                {status}
              </Badge>
              {lastScanTime && (
                <span className="text-[10px] text-muted-foreground pl-1 font-mono">
                  {new Date(lastScanTime).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}
            </div>
          );
        },
        enableSorting: true,
        size: 180,
      },
      {
        accessorKey: "renderedTime",
        id: "renderedTime",
        header: ({ column }) => (
          <DataGridColumnHeader title="Rendered Time" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.renderedTime}</span>
        ),
        enableSorting: true,
        size: 120,
      },
    ],
    [],
  );

  const handlePaginationChange = (updater: any) => {
    const nextState = typeof updater === "function"
      ? updater({ pageIndex: currentPage - 1, pageSize })
      : updater;

    const nextPage = nextState.pageIndex + 1;
    const nextLimit = nextState.pageSize;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    params.set("limit", String(nextLimit));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const table = useReactTable({
    columns,
    data,
    pageCount: Math.ceil(totalCount / pageSize),
    getRowId: (row: StudentAttendanceRow) => row.id,
    state: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
      sorting,
    },
    onPaginationChange: handlePaginationChange,
    manualPagination: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <Card className="border-border mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <span>Student Attendance List</span>
          </CardTitle>
          <CardDescription>
            Search and filter all students to verify check-in and check-out
            records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative md:w-100 h-fit w-full">
              <Input
                placeholder="Search by name or student ID"
                className="pl-4 pr-10 h-13.5 text-sm"
                value={inputSearch}
                onChange={handleSearchChange}
              />
              {isPending ? (
                <Spinner className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary" />
              ) : (
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="h-13.5 px-4"
              >
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
              <Combobox
                multiple
                autoHighlight
                items={filterItems}
                value={selectedLabels}
                onValueChange={handleFilterChange}
              >
                <div className="relative md:w-80 w-full py-0!">
                  <ComboboxChips
                    ref={anchor}
                    className={cn(
                      "border pr-7! py-0! w-full pl-2!",
                      isExpanded ? "min-h-13.5 h-auto py-1.5!" : "h-13.5!",
                    )}
                  >
                    <ComboboxValue>
                      {(values: string[] = []) => {
                        const visibleValues = isExpanded
                          ? values
                          : values.slice(0, MAX_VISIBLE);
                        const remainingCount = values.length - MAX_VISIBLE;

                        return (
                          <Fragment>
                            {visibleValues.map((value: string) => (
                              <ComboboxChip key={value}>{value}</ComboboxChip>
                            ))}

                            {values.length > MAX_VISIBLE && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsExpanded(!isExpanded);
                                }}
                                className="inline-flex items-center rounded-md border border-dashed border-muted-foreground/40 bg-transparent px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                              >
                                {isExpanded
                                  ? "Show Less"
                                  : `+${remainingCount} more`}
                              </button>
                            )}

                            <ComboboxChipsInput
                              placeholder={
                                values.length === 0
                                  ? "Filter by Program, Year, or Status"
                                  : ""
                              }
                              className={cn(
                                "py-0! text-base md:text-sm w-full",
                                isExpanded ? "h-9" : "h-13.5",
                              )}
                            />
                          </Fragment>
                        );
                      }}
                    </ComboboxValue>
                  </ComboboxChips>

                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Filter className="h-4 w-4" />
                  </div>
                </div>
                <ComboboxContent anchor={anchor}>
                  <ComboboxEmpty>No items found.</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem
                        key={item.label}
                        value={item.label}
                        className="py-4"
                      >
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          <DataGrid
            table={table}
            recordCount={totalCount}
            onRowClick={handleRowClick}
            tableLayout={{
              columnsPinnable: false,
              columnsResizable: false,
              columnsMovable: false,
              columnsVisibility: false,
            }}
            tableClassNames={{
              bodyRow: "h-13.5",
              headerRow: "h-13.5",
            }}
          >
            <div className="w-full space-y-3">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <DataGridContainer>
                  <DataGridScrollArea className="w-full overflow-hidden">
                    <DataGridTable />
                  </DataGridScrollArea>
                </DataGridContainer>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden space-y-3">
                {table.getRowModel().rows.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl bg-card text-muted-foreground text-sm">
                    No student attendance records found.
                  </div>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const record = row.original;
                    const status = record.status;
                    const timesIn = record.logs.filter((l) => l.type === "in");
                    const timesOut = record.logs.filter((l) => l.type === "out");
                    const lastIn = timesIn.length > 0
                      ? new Date(timesIn[timesIn.length - 1].time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                      : "N/A";
                    const lastOut = timesOut.length > 0
                      ? new Date(timesOut[timesOut.length - 1].time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                      : "N/A";
                    return (
                      <div
                        key={record.id}
                        onClick={() => handleRowClick(record)}
                        className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs hover:border-primary/50 transition-colors space-y-3 cursor-pointer"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono font-bold uppercase"
                              >
                                ID: {record.student_id}
                              </Badge>
                              <Badge
                                variant={
                                  status === "COMPLETED"
                                    ? "default"
                                    : status === "CHECKED_IN"
                                      ? "secondary"
                                      : "outline"
                                }
                                className={
                                  status === "COMPLETED"
                                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                                    : status === "CHECKED_IN"
                                      ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                      : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                }
                              >
                                {status.replace("_", " ")}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-sm text-foreground mt-1">
                              {record.first_name} {record.last_name}
                            </h4>
                          </div>

                          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground">
                            Logs <ChevronRight className="size-3.5" />
                          </Button>
                        </div>

                        {/* Card Body */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t">
                          <div>
                            <span className="text-muted-foreground">Program & Year:</span>
                            <p className="font-medium text-foreground mt-0.5">
                              {record.program} - Year {record.year}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rendered Time:</span>
                            <p className="font-mono text-foreground mt-0.5">
                              {record.renderedTime}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Latest Check-in:</span>
                            <p className="font-mono text-foreground mt-0.5">
                              {lastIn}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Latest Check-out:</span>
                            <p className="font-mono text-foreground mt-0.5">
                              {lastOut}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <DataGridPagination />
            </div>
          </DataGrid>
        </CardContent>
      </Card>

      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        swipeDirection={isMobile ? "down" : "right"}
      >
        <DrawerContent className="h-[85vh] md:h-full">
          <DrawerHeader className="text-left border-b pb-4">
            <DrawerTitle className="text-xl font-bold">
              Student Event Logs
            </DrawerTitle>
            <DrawerDescription>
              Detailed check-in/out timestamps and total rendered duration.
            </DrawerDescription>
          </DrawerHeader>
          {selectedStudent && (
            <div className="p-4 space-y-6">
              <div className="bg-muted/40 p-4 rounded-xl border flex flex-col gap-1 text-left">
                <h3 className="text-base font-bold text-foreground">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Student ID:{" "}
                  <span className="text-foreground">
                    {selectedStudent.student_id}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Program & Year:{" "}
                  <span className="text-foreground">
                    {selectedStudent.program} - Year {selectedStudent.year}
                  </span>
                </p>
                <p className="text-xs mt-2 flex items-center gap-1.5 font-semibold text-primary">
                  Total Rendered Time:{" "}
                  <span className="text-sm font-bold bg-primary/10 px-2 py-0.5 rounded text-primary">
                    {selectedStudent.renderedTime}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-left">
                  All Recorded Scans ({selectedStudent.logs.length})
                </h4>
                <ScrollArea className="h-60 pr-2 border rounded-lg p-2.5 bg-background">
                  {selectedStudent.logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                      <Clock className="size-8 stroke-1.5 opacity-50 mb-2" />
                      <p className="text-xs font-semibold">No scans recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[...selectedStudent.logs]
                        .sort(
                          (a, b) =>
                            new Date(a.time).getTime() -
                            new Date(b.time).getTime(),
                        )
                        .map((log, index) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between text-left text-xs border-b pb-2 last:border-b-0 last:pb-0"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  log.type === "in" ? "secondary" : "default"
                                }
                                className={
                                  log.type === "in"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                }
                              >
                                {log.type === "in" ? "TIME IN" : "TIME OUT"}
                              </Badge>
                              <span className="text-muted-foreground font-medium">
                                Scan #{index + 1}
                              </span>
                            </div>
                            <span className="font-mono text-muted-foreground">
                              {new Date(log.time).toLocaleTimeString(
                                undefined,
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
          <DrawerFooter className="border-t pt-4 pb-6">
            <DrawerClose
              render={
                <Button variant="outline" className="w-full h-13.5">
                  Close
                </Button>
              }
            />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
