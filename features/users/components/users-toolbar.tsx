"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

interface UsersToolbarProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  canCreate: boolean;
  onAddClick: () => void;
}

export function UsersToolbar({
  searchValue,
  setSearchValue,
  canCreate,
  onAddClick,
}: UsersToolbarProps) {
  return (
    <div className="w-full flex justify-between mt-8 md:flex-row flex-col gap-4">
      <div className="relative md:w-100 h-13.5 w-full">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or username"
          className="pr-8"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      {canCreate && (
        <div className="flex items-center gap-2">
          <Button onClick={onAddClick} className="h-13.5 px-4!">
            <Plus className="size-4" />
            Add User
          </Button>
        </div>
      )}
    </div>
  );
}
