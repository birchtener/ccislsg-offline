"use client";

import { useState } from "react";
import { Student } from "@/lib/generated/prisma/client";
import { MasterListToolbar } from "./master-list-toolbar";
import { MasterListTable } from "./master-list-table";
import { EditStudentDrawer } from "./edit-student-drawer";
import { DeleteStudent } from "../actions/attendance";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MasterListClientProps {
  students: Omit<Student, "created_at">[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
}

export function MasterListClient({
  students,
  totalCount,
  pageSize,
  currentPage,
}: MasterListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Omit<Student, "created_at"> | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [studentToDeleteId, setStudentToDeleteId] = useState<string | null>(null);

  const handleEdit = (student: Omit<Student, "created_at">) => {
    setSelectedStudent(student);
    setIsEditOpen(true);
  };

  const handleDeleteTrigger = (id: string) => {
    setStudentToDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDeleteId) return;

    const id = studentToDeleteId;
    setIsDeleteOpen(false);
    setStudentToDeleteId(null);

    const toastId = toast.loading("Deleting student...");

    try {
      const result = await DeleteStudent(id);

      if (!result.ok) {
        toast.error(result.error || "Failed to delete student.", { id: toastId });
        return;
      }

      toast.success(result.message || "Student deleted successfully", { id: toastId });
      router.refresh();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
      toast.error("An unexpected error occurred. Please try again.", { id: toastId });
    }
  };

  return (
    <div className="w-full space-y-4">
      <MasterListToolbar />

      <MasterListTable
        data={students}
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        onEdit={handleEdit}
        onDelete={handleDeleteTrigger}
      />

      <EditStudentDrawer
        student={selectedStudent}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={() => setSelectedStudent(null)}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student from the master list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
