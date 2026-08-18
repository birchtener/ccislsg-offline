"use client";

import { useState, useEffect } from "react";
import {
  GetAssetScanDetails,
  ProcessBorrowAsset,
  ProcessReturnAsset,
  SearchStudentsAction,
} from "../actions/inventory";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  QrCode,
  ArrowRight,
  UserCheck,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetScanner } from "./asset-scanner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ASSET_CONDITIONS,
  DEFAULT_ASSET_CONDITION,
} from "@/features/inventory/constants/conditions";

interface BorrowReturnDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BorrowReturnDrawer({
  open,
  onOpenChange,
  onSuccess,
}: BorrowReturnDrawerProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"borrow" | "return">("borrow");
  const [showScanner, setShowScanner] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<any | null>(null);

  const [borrowerType, setBorrowerType] = useState<"STUDENT" | "EXTERNAL">(
    "STUDENT",
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [studentList, setStudentList] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const [externalDetails, setExternalDetails] = useState({
    first_name: "",
    last_name: "",
    contact_number: "",
    email: "",
    remarks: "",
  });

  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [returnRemarks, setReturnRemarks] = useState("");
  const [returnCondition, setReturnCondition] = useState<string>(DEFAULT_ASSET_CONDITION);

  useEffect(() => {
    if (!open) {
      setScannedAsset(null);
      setShowScanner(false);
      setSelectedStudent(null);
      setStudentSearch("");
      setStudentList([]);
      setExternalDetails({
        first_name: "",
        last_name: "",
        contact_number: "",
        email: "",
        remarks: "",
      });
      setDueDate("");
      setRemarks("");
      setReturnRemarks("");
      setReturnCondition(DEFAULT_ASSET_CONDITION);
    }
  }, [open]);

  const handleScanSuccess = async (value: string) => {
    setShowScanner(false);
    setLoadingAsset(true);
    try {
      const res = await GetAssetScanDetails(value);
      if (!res.ok || !res.asset) {
        toast.error(res.error || "Failed to resolve asset QR scan.");
        setScannedAsset(null);
        return;
      }
      setScannedAsset(res.asset);
      toast.success(`Scanned: ${res.asset.asset_tag}`);
    } catch (err) {
      toast.error("Error reading QR data.");
    } finally {
      setLoadingAsset(false);
    }
  };

  const handleStudentSearchChange = async (val: string) => {
    setStudentSearch(val);
    if (val.trim().length > 1) {
      const res = await SearchStudentsAction(val);
      if (res.ok && res.students) {
        setStudentList(res.students);
      }
    } else {
      setStudentList([]);
    }
  };

  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentSearch(
      `${student.first_name} ${student.last_name} (${student.student_id})`,
    );
    setStudentList([]);
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedAsset) {
      toast.error("Please scan or verify an asset tag first.");
      return;
    }
    if (scannedAsset.status !== "AVAILABLE") {
      toast.error(
        `This asset is not available for borrowing. Current status: ${scannedAsset.status}`,
      );
      return;
    }
    if (borrowerType === "STUDENT" && !selectedStudent) {
      toast.error("Please select a borrower student from the list.");
      return;
    }
    if (
      borrowerType === "EXTERNAL" &&
      (!externalDetails.first_name ||
        !externalDetails.last_name ||
        !externalDetails.contact_number)
    ) {
      toast.error("Please complete all required external borrower fields.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Checking out asset...");

    try {
      const res = await ProcessBorrowAsset({
        asset_id: scannedAsset.id,
        item_id: scannedAsset.item_id,
        borrower_type: borrowerType,
        student_id: selectedStudent?.id,
        borrower_details:
          borrowerType === "EXTERNAL" ? externalDetails : undefined,
        due_date: dueDate || undefined,
        remarks: remarks || undefined,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to borrow asset.", { id: toastId });
        return;
      }

      toast.success("Asset borrowed successfully.", { id: toastId });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Error processing request.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedAsset) {
      toast.error("Please scan or verify an asset tag first.");
      return;
    }

    const activeBorrow = scannedAsset.borrows?.[0];
    if (
      scannedAsset.status !== "BORROWED" ||
      !activeBorrow ||
      activeBorrow.returned_at
    ) {
      toast.error("Scanned asset is not currently marked as borrowed.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Recording asset return...");

    try {
      const res = await ProcessReturnAsset(
        activeBorrow.id,
        returnRemarks,
        returnCondition,
      );

      if (!res.ok) {
        toast.error(res.error || "Failed to record return.", { id: toastId });
        return;
      }

      toast.success("Asset returned successfully.", { id: toastId });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Error processing request.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const activeBorrow = scannedAsset?.borrows?.[0];

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[85dvh] md:h-full max-w-lg mx-auto">
        <div className="flex flex-col h-full p-6 text-left">
          <DrawerHeader className="p-0 pb-4 border-b">
            <DrawerTitle className="text-lg font-bold">
              Borrow & Return
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Checkout physical assets or update status on return.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex border-b my-4 shrink-0">
            <button
              type="button"
              className={cn(
                "flex-1 pb-2 font-bold text-sm text-center border-b-2 transition-colors cursor-pointer",
                activeTab === "borrow"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground",
              )}
              onClick={() => {
                setActiveTab("borrow");
                setScannedAsset(null);
              }}
            >
              Borrow Asset
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 pb-2 font-bold text-sm text-center border-b-2 transition-colors cursor-pointer",
                activeTab === "return"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground",
              )}
              onClick={() => {
                setActiveTab("return");
                setScannedAsset(null);
              }}
            >
              Return Asset
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {showScanner ? (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold">QR Code Scanning</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowScanner(false)}
                  >
                    Close Scanner
                  </Button>
                </div>
                <AssetScanner onScanSuccess={handleScanSuccess} />
              </div>
            ) : (
              <div className="space-y-5 pt-2">
                <div className="bg-muted/30 p-4 rounded-xl border border-dashed flex flex-col items-center justify-center text-center gap-3">
                  {loadingAsset ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Verifying scanned tag...
                      </span>
                    </div>
                  ) : scannedAsset ? (
                    <div className="w-full text-left space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono tracking-tighter"
                          >
                            {scannedAsset.asset_tag}
                          </Badge>
                          <h4 className="text-base font-bold mt-1 text-foreground">
                            {scannedAsset.item.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Category: {scannedAsset.item.category.name}
                          </p>
                        </div>
                        <Badge
                          variant={
                            scannedAsset.status === "AVAILABLE"
                              ? "secondary"
                              : scannedAsset.status === "BORROWED"
                                ? "default"
                                : "outline"
                          }
                          className={
                            scannedAsset.status === "AVAILABLE"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                              : scannedAsset.status === "BORROWED"
                                ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                                : "bg-red-500/10 text-red-700 border-red-500/20"
                          }
                        >
                          {scannedAsset.status}
                        </Badge>
                      </div>

                      {activeTab === "return" &&
                        activeBorrow &&
                        !activeBorrow.returned_at && (
                          <div className="border-t pt-2 mt-2 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Active Borrower Details
                            </p>
                            <p className="text-xs font-bold">
                              {activeBorrow.student
                                ? `${activeBorrow.student.first_name} ${activeBorrow.student.last_name} (${activeBorrow.student.student_id})`
                                : `${activeBorrow.borrower.first_name} ${activeBorrow.borrower.last_name} (External)`}
                            </p>
                            {activeBorrow.due_date && (
                              <p className="text-[10px] text-destructive flex items-center gap-1 font-semibold mt-1">
                                <AlertTriangle className="size-3.5" />
                                Expected return:{" "}
                                {new Date(
                                  activeBorrow.due_date,
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowScanner(true)}
                        className="w-full mt-2 h-13.5 px-3"
                      >
                        <RefreshCw className="size-4 mr-2" />
                        Scan Another Code
                      </Button>
                    </div>
                  ) : (
                    <div className="py-6 space-y-3">
                      <QrCode className="size-10 stroke-1.5 opacity-50 mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          No Asset Selected
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Position the QR sticker inside the camera viewfinder
                          to initialize details.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="h-13.5 px-3"
                      >
                        Launch Camera Scanner
                      </Button>
                    </div>
                  )}
                </div>

                {scannedAsset && (
                  <>
                    {activeTab === "borrow" ? (
                      <form onSubmit={handleBorrowSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>Borrower Scope</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={
                                borrowerType === "STUDENT"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => setBorrowerType("STUDENT")}
                              className="flex-1 h-13.5 px-3"
                            >
                              CCIS Student
                            </Button>
                            <Button
                              type="button"
                              variant={
                                borrowerType === "EXTERNAL"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => setBorrowerType("EXTERNAL")}
                              className="flex-1 h-13.5 px-3"
                            >
                              External Borrower
                            </Button>
                          </div>
                        </div>

                        {borrowerType === "STUDENT" ? (
                          <div className="space-y-1.5 relative">
                            <Label htmlFor="student-autocomplete">
                              Student Search
                            </Label>
                            <Input
                              id="student-autocomplete"
                              placeholder="Type student name or ID..."
                              className="h-13.5 px-3"
                              value={studentSearch}
                              onChange={(e) =>
                                handleStudentSearchChange(e.target.value)
                              }
                            />
                            {selectedStudent && (
                              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                                <UserCheck className="size-3.5" />
                                Selected Student ID:{" "}
                                {selectedStudent.student_id}
                              </p>
                            )}
                            {studentList.length > 0 && (
                              <ScrollArea className="absolute z-20 left-0 right-0 max-h-40 bg-popover text-popover-foreground border rounded-lg shadow-lg mt-1 overflow-y-auto">
                                <div className="p-1">
                                  {studentList.map((stud) => (
                                    <button
                                      key={stud.id}
                                      type="button"
                                      onClick={() => selectStudent(stud)}
                                      className="w-full text-left px-2.5 py-2 text-xs hover:bg-accent rounded transition-colors"
                                    >
                                      {stud.first_name} {stud.last_name} (
                                      {stud.student_id})
                                    </button>
                                  ))}
                                </div>
                              </ScrollArea>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-muted">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label
                                  htmlFor="ext-first-name"
                                  className="text-xs"
                                >
                                  First Name
                                </Label>
                                <Input
                                  id="ext-first-name"
                                  className="h-13.5 px-3"
                                  value={externalDetails.first_name}
                                  onChange={(e) =>
                                    setExternalDetails((prev) => ({
                                      ...prev,
                                      first_name: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label
                                  htmlFor="ext-last-name"
                                  className="text-xs"
                                >
                                  Last Name
                                </Label>
                                <Input
                                  id="ext-last-name"
                                  className="h-13.5 px-3"
                                  value={externalDetails.last_name}
                                  onChange={(e) =>
                                    setExternalDetails((prev) => ({
                                      ...prev,
                                      last_name: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="ext-contact" className="text-xs">
                                Contact Number
                              </Label>
                              <Input
                                id="ext-contact"
                                className="h-13.5 px-3"
                                value={externalDetails.contact_number}
                                onChange={(e) =>
                                  setExternalDetails((prev) => ({
                                    ...prev,
                                    contact_number: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="ext-email" className="text-xs">
                                Email (Optional)
                              </Label>
                              <Input
                                id="ext-email"
                                type="email"
                                className="h-13.5 px-3"
                                value={externalDetails.email}
                                onChange={(e) =>
                                  setExternalDetails((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label htmlFor="due-date">Due Date (Optional)</Label>
                          <Input
                            id="due-date"
                            type="date"
                            className="h-13.5 px-3"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="remarks">Remarks</Label>
                          <Textarea
                            id="remarks"
                            placeholder="Add borrow details or inventory descriptions..."
                            className="resize-none h-16 px-3"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={submitting}
                          className="w-full h-13.5 px-3"
                        >
                          {submitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Confirm Checkout
                          <ArrowRight className="size-4 ml-2" />
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleReturnSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="return-condition">
                            Received Condition
                          </Label>
                          <Select
                            value={returnCondition}
                            onValueChange={(val) =>
                              setReturnCondition(val || DEFAULT_ASSET_CONDITION)
                            }
                          >
                            <SelectTrigger className="w-full h-13.5 px-3">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSET_CONDITIONS.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="return-remarks">Return Remarks</Label>
                          <Textarea
                            id="return-remarks"
                            placeholder="Notes on return condition or log updates..."
                            className="resize-none h-16 px-3"
                            value={returnRemarks}
                            onChange={(e) => setReturnRemarks(e.target.value)}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={submitting}
                          className="w-full h-13.5 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {submitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Record Return & Re-stock
                        </Button>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <DrawerFooter className="p-0 pt-4 border-t mt-auto shrink-0">
            <Button
              variant="outline"
              className="w-full h-13.5 px-3"
              onClick={() => onOpenChange(false)}
            >
              Close Desk
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
