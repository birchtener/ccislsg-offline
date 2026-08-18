"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { Spinner } from "@/components/ui/spinner";
import { filterItems } from "../schema/master-list";
import { ManualImportStudent } from "./manual-import-student";
import { BulkImportStudent } from "./bulk-import-student";

export function MasterListToolbar() {
  const anchor = useComboboxAnchor();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showManualAdd, setShowManualAdd] = React.useState(false);
  const [showBulkImport, setShowBulkImport] = React.useState(false);
  const MAX_VISIBLE = 1;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = React.useTransition();
  const currentSearch = searchParams.get("search") ?? "";
  const [inputSearch, setInputSearch] = React.useState(currentSearch);

  React.useEffect(() => {
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

  const currentPrograms = React.useMemo(() => {
    return searchParams.get("program")?.split(",").map((p) => p.trim()).filter(Boolean) ?? [];
  }, [searchParams]);

  const currentYears = React.useMemo(() => {
    return searchParams
      .get("year")
      ?.split(",")
      .map((y) => parseInt(y.trim(), 10))
      .filter((y) => !isNaN(y)) ?? [];
  }, [searchParams]);

  const selectedLabels = React.useMemo(() => {
    const labels: string[] = [];
    currentPrograms.forEach((p) => {
      const match = filterItems.find((item) => item.type === "program" && item.value === p);
      if (match) labels.push(String(match.label));
    });
    currentYears.forEach((y) => {
      const match = filterItems.find((item) => item.type === "year" && item.value === y);
      if (match) labels.push(String(match.label));
    });
    return labels;
  }, [currentPrograms, currentYears]);

  const handleFilterChange = (labels: string[]) => {
    const programs: string[] = [];
    const years: number[] = [];

    labels.forEach((label) => {
      const item = filterItems.find((f) => f.label === label);
      if (item) {
        if (item.type === "program") {
          programs.push(item.value as string);
        } else if (item.type === "year") {
          years.push(item.value as number);
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

    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex justify-between mt-8 md:flex-row flex-col gap-4">
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
        <Combobox
          multiple
          autoHighlight
          items={filterItems}
          value={selectedLabels}
          onValueChange={handleFilterChange}
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
                          className="inline-flex items-center rounded-md border border-dashed border-muted-foreground/40 bg-transparent px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                        >
                          {isExpanded ? "Show Less" : `+${remainingCount} more`}
                        </button>
                      )}

                      <ComboboxChipsInput
                        placeholder={
                          values.length === 0 ? "Filter by Program or Year" : ""
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
        <DropdownMenu>
          <DropdownMenuTrigger
            className="text-base md:text-sm px-4"
            render={
              <Button variant="default" size="default" className="h-13.5" />
            }
          >
            Add Student
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setShowManualAdd(true)}
                className="py-4 px-2"
              >
                Add Manually
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowBulkImport(true)}
                className="py-4 px-2"
              >
                Bulk Import
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ManualImportStudent show={showManualAdd} setShow={setShowManualAdd} />
      <BulkImportStudent show={showBulkImport} setShow={setShowBulkImport} />
    </div>
  );
}
