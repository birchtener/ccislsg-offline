"use client";

import * as React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

interface AuditLogEntry {
  id: string;
  user_id: string;
  log: string;
  type: "success" | "info" | "error" | "warn";
  category:
    | "authentication"
    | "inventory"
    | "payments"
    | "attendance"
    | "clearance"
    | "announcements"
    | "events"
    | "admin";
  created_at: Date;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    role: {
      name: string;
    };
  };
}

interface AuditLogsTableProps {
  initialData: AuditLogEntry[];
  showCategoryFilter?: boolean;
}

const filterItems = [
  { label: "Authentication", value: "authentication" },
  { label: "Inventory", value: "inventory" },
  { label: "Payments", value: "payments" },
  { label: "Attendance", value: "attendance" },
  { label: "Clearance", value: "clearance" },
  { label: "Announcements", value: "announcements" },
  { label: "Events", value: "events" },
  { label: "Admin", value: "admin" },
];

export function AuditLogsTable({
  initialData,
  showCategoryFilter = true,
}: AuditLogsTableProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [filterValue, setFilterValue] = React.useState<any[]>([]);

  const anchor = useComboboxAnchor();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const MAX_VISIBLE = 1;

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const filteredLogs = React.useMemo(() => {
    return initialData.filter((log) => {
      const search = searchValue.toLowerCase().trim();
      const matchesSearch =
        search === "" ||
        log.log.toLowerCase().includes(search) ||
        log.user.name.toLowerCase().includes(search) ||
        log.user.email.toLowerCase().includes(search);

      if (!matchesSearch) return false;

      if (filterValue.length === 0) return true;

      const selectedCategories = filterValue.map((val) => {
        if (val && typeof val === "object") {
          return val.value;
        }
        const matched = filterItems.find(
          (f) => f.label === val || f.value === val,
        );
        return matched ? matched.value : val;
      });

      return selectedCategories.includes(log.category);
    });
  }, [initialData, searchValue, filterValue]);

  const columns = React.useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <DataGridColumnHeader title="Timestamp" column={column} />
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("created_at"));
          return (
            <div className="flex flex-col text-left">
              <span className="font-semibold text-foreground text-sm">
                {format(date, "MMM dd, yyyy")}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {format(date, "hh:mm:ss a")}
              </span>
            </div>
          );
        },
        enableSorting: true,
        size: 180,
      },
      {
        accessorKey: "user",
        id: "user",
        header: ({ column }) => (
          <DataGridColumnHeader title="Operator" column={column} />
        ),
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div className="flex flex-col text-left">
              <span className="font-bold text-foreground text-sm">
                {user.name}
              </span>
              <span className="text-xs text-muted-foreground">
                @{user.username}
                <Badge
                  variant="default"
                  className="text-[10px] px-1.5 py-0.2 ml-2"
                >
                  {user.role?.name}
                </Badge>
              </span>
            </div>
          );
        },
        enableSorting: false,
        size: 200,
      },
      {
        accessorKey: "log",
        id: "log",
        header: ({ column }) => (
          <DataGridColumnHeader title="Action Detail" column={column} />
        ),
        cell: ({ row }) => (
          <div className="text-left font-medium text-foreground max-w-md wrap-break-word whitespace-normal leading-relaxed py-1">
            {row.getValue("log")}
          </div>
        ),
        enableSorting: false,
        size: 400,
      },
      {
        accessorKey: "category",
        id: "category",
        header: ({ column }) => (
          <DataGridColumnHeader title="Category" column={column} />
        ),
        cell: ({ row }) => {
          const cat = row.getValue("category") as string;
          return (
            <Badge
              variant="outline"
              className="capitalize text-xs font-semibold px-2 py-0.5 border-border bg-muted/40"
            >
              {cat}
            </Badge>
          );
        },
        enableSorting: true,
        size: 130,
      },
      {
        accessorKey: "type",
        id: "type",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          const statusColors: Record<string, string> = {
            success:
              "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
            info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
            warn: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
            error: "bg-destructive/10 text-destructive border-destructive/20",
          };
          return (
            <Badge
              variant="outline"
              className={cn(
                "capitalize text-xs font-bold px-2 py-0.5",
                statusColors[type] || "bg-muted text-muted-foreground",
              )}
            >
              {type}
            </Badge>
          );
        },
        enableSorting: true,
        size: 110,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns: columns as any,
    data: filteredLogs,
    pageCount: Math.ceil((filteredLogs.length || 0) / pagination.pageSize),
    getRowId: (row: any) => row.id,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col mt-8 sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-100">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search logs by action, name or email..."
            className="pr-9 text-base md:text-sm h-13.5"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {showCategoryFilter && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Combobox
              multiple
              autoHighlight
              items={filterItems}
              defaultValue={[]}
              onValueChange={(value) => {
                setFilterValue(value);
              }}
            >
              <div className="relative md:w-64 w-full py-0!">
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
                        <React.Fragment>
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
                              className="inline-flex items-center rounded-md border border-dashed border-muted-foreground/40 bg-transparent px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
                            >
                              {isExpanded
                                ? "Show Less"
                                : `+${remainingCount} more`}
                            </button>
                          )}

                          <ComboboxChipsInput
                            placeholder={
                              values.length === 0 ? "Filter by Category" : ""
                            }
                            className={cn(
                              "py-0! text-base md:text-sm w-full",
                              isExpanded ? "h-9" : "h-13.5",
                            )}
                          />
                        </React.Fragment>
                      );
                    }}
                  </ComboboxValue>
                </ComboboxChips>

                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Filter className="h-4 w-4" />
                </div>
              </div>
              <ComboboxContent anchor={anchor}>
                <ComboboxEmpty>No categories found.</ComboboxEmpty>
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
        )}
      </div>

      <DataGrid
        table={table}
        recordCount={filteredLogs.length || 0}
        tableLayout={{
          columnsPinnable: false,
          columnsResizable: false,
          columnsMovable: false,
          columnsVisibility: false,
        }}
        tableClassNames={{
          bodyRow: "h-16",
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
                No audit logs found.
              </div>
            ) : (
              table.getRowModel().rows.map((row) => {
                const log = row.original;
                const date = new Date(log.created_at);
                const type = log.type;
                const statusColors: Record<string, string> = {
                  success:
                    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
                  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                  error: "bg-destructive/10 text-destructive border-destructive/20",
                };
                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs space-y-3"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize text-xs font-bold px-2 py-0.5",
                              statusColors[type] || "bg-muted text-muted-foreground"
                            )}
                          >
                            {type}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="capitalize text-xs font-semibold px-2 py-0.5 border-border bg-muted/40"
                          >
                            {log.category}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-2">
                          {log.user.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          @{log.user.username}
                          {log.user.role && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0.2 ml-2">
                              {log.user.role.name}
                            </Badge>
                          )}
                        </p>
                      </div>

                      <div className="text-right text-xs">
                        <p className="font-semibold text-foreground">
                          {format(date, "MMM dd, yyyy")}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {format(date, "hh:mm:ss a")}
                        </p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="pt-2 border-t text-xs text-foreground/90 leading-relaxed">
                      {log.log}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DataGridPagination />
        </div>
      </DataGrid>
    </div>
  );
}
