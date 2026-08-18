"use client";

import * as React from "react";
import { read, utils } from "xlsx";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert";
import { FileUploadCompact } from "@/components/ui/file-upload";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddStudentSchema } from "../schema/master-list";
import { ManualImportStudents } from "../actions/attendance";
import { toast } from "sonner";
import { FileWithPreview } from "@/hooks/use-file-upload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface BulkImportStudentProps {
  show: boolean;
  setShow: (value: boolean) => void;
  onSubmitSuccess?: () => void;
}

type ImportStep = "idle" | "reading" | "validating" | "uploading" | "done";

export function BulkImportStudent({
  show,
  setShow,
  onSubmitSuccess,
}: BulkImportStudentProps) {
  const isMobile = useIsMobile();
  const router = useRouter();

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [importStep, setImportStep] = React.useState<ImportStep>("idle");
  const [progress, setProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState("Ready to upload");
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [successCount, setSuccessCount] = React.useState<number | null>(null);

  const handleFilesChange = (files: FileWithPreview[]) => {
    if (files.length > 0) {
      const fileObj = files[0].file;
      if (fileObj instanceof File) {
        setSelectedFile(fileObj);
        setValidationErrors([]);
        setSuccessCount(null);
        setImportStep("idle");
        setProgress(0);
        setStatusText("Ready to upload");
      }
    } else {
      setSelectedFile(null);
      setValidationErrors([]);
      setSuccessCount(null);
      setImportStep("idle");
      setProgress(0);
      setStatusText("Ready to upload");
    }
  };

  const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_-]/g, "");

  const startImport = async () => {
    if (!selectedFile) return;

    setImportStep("reading");
    setProgress(15);
    setStatusText("Reading spreadsheet file...");
    setValidationErrors([]);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error("Could not read file data.");
        }

        setProgress(35);
        setStatusText("Parsing Excel workbook...");
        const workbook = read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const json = utils.sheet_to_json<any>(worksheet);

        if (json.length === 0) {
          throw new Error("The selected spreadsheet is empty.");
        }

        setProgress(55);
        setStatusText("Validating student records...");

        const errorsList: string[] = [];
        const validatedStudents: any[] = [];

        json.forEach((row, index) => {
          const rowNum = index + 2; 

          let rawId = "";
          let rawLastName = "";
          let rawFirstName = "";
          let rawFullName = "";
          let rawProgram = "";
          let rawYear = NaN;

          Object.keys(row).forEach((key) => {
            const norm = normalizeKey(key);
            const val = row[key];

            if (norm === "id" || norm === "studentid" || norm === "studentnumber") {
              rawId = String(val).trim();
            } else if (norm === "lastname" || norm === "surname") {
              rawLastName = String(val).trim();
            } else if (norm === "firstname" || norm === "givenname") {
              rawFirstName = String(val).trim();
            } else if (norm === "fullname" || norm === "name") {
              rawFullName = String(val).trim();
            } else if (norm === "program" || norm === "course") {
              rawProgram = String(val).trim().toUpperCase();
            } else if (norm === "year" || norm === "level") {
              rawYear = Number(val);
            }
          });

          let lastName = rawLastName;
          let firstName = rawFirstName;

          if ((!lastName || !firstName) && rawFullName) {
            const commaIndex = rawFullName.indexOf(",");
            if (commaIndex !== -1) {
              lastName = rawFullName.slice(0, commaIndex).trim();
              const remaining = rawFullName.slice(commaIndex + 1).trim();

              const tokens = remaining.split(/\s+/).filter(Boolean);
              const firstNameParts: string[] = [];
              let suffix = "";

              const knownSuffixes = ["jr.", "jr", "sr.", "sr", "iii", "ii", "iv", "v", "i"];

              tokens.forEach((token) => {
                const tokenLower = token.toLowerCase();
                const isSuffix = knownSuffixes.includes(tokenLower);

                if (isSuffix) {
                  suffix = token;
                } else if (/^[A-Za-z]\.?$/.test(token)) {

                } else {
                  firstNameParts.push(token);
                }
              });

              firstName = firstNameParts.join(" ");
              if (suffix) {
                firstName = firstName ? `${firstName} ${suffix}` : suffix;
              }
            } else {

              const tokens = rawFullName.split(/\s+/).filter(Boolean);
              if (tokens.length > 1) {
                lastName = tokens[tokens.length - 1];
                firstName = tokens.slice(0, tokens.length - 1).join(" ");
              } else if (tokens.length === 1) {
                firstName = tokens[0];
                lastName = "";
              }
            }
          }

          const mapped = {
            studentNumber: rawId,
            lastName,
            firstName,
            program: rawProgram,
            year: rawYear,
          };

          if (!rawId && !lastName && !firstName && !rawProgram && isNaN(rawYear)) {
            return; 
          }

          const parseResult = AddStudentSchema.safeParse(mapped);

          if (!parseResult.success) {
            parseResult.error.issues.forEach((err) => {
              errorsList.push(`Row ${rowNum}: ${err.message} (Field: ${err.path.join(".")})`);
            });
          } else {
            validatedStudents.push(parseResult.data);
          }
        });

        if (errorsList.length > 0) {
          setValidationErrors(errorsList);
          setImportStep("idle");
          setProgress(0);
          setStatusText("Validation failed.");
          toast.error("Spreadsheet validation failed. Please fix the errors listed.");
          return;
        }

        setProgress(75);
        setStatusText(`Importing ${validatedStudents.length} students securely...`);
        setImportStep("uploading");

        const result = await ManualImportStudents({ students: validatedStudents });

        if (!result.ok) {
          throw new Error(result.error || "Failed to save students to database.");
        }

        setProgress(100);
        setStatusText("Import completed successfully!");
        setImportStep("done");
        setSuccessCount(validatedStudents.length);
        toast.success(`Successfully imported ${validatedStudents.length} students!`);
        onSubmitSuccess?.();
        router.refresh();
      } catch (err: any) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        setImportStep("idle");
        setProgress(0);
        setStatusText("Import failed.");
        toast.error(err.message || "An unexpected error occurred during import.");
      }
    };

    reader.onerror = () => {
      setImportStep("idle");
      setProgress(0);
      setStatusText("Failed to read file.");
      toast.error("Could not read spreadsheet file.");
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  return (
    <Drawer
      open={show}
      onOpenChange={setShow}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[85dvh] md:h-full flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Bulk Import Students</DrawerTitle>
          <DrawerDescription>
            Upload student list from an Excel sheet (.xlsx, .xls)
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 min-h-0 my-2! mb-4!" data-base-ui-swipe-ignore>
          <div className="px-4 py-2 space-y-6" data-base-ui-swipe-ignore>
            
            <div className="bg-muted/50 border rounded-lg p-3 text-xs text-muted-foreground flex gap-2.5 items-start">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Required Excel Columns:</p>
                <code className="text-foreground font-mono">id, program, year</code> and either <code className="text-foreground font-mono">full_name</code> OR <code className="text-foreground font-mono">first_name, last_name</code>
                <p className="mt-1.5">
                  - <strong>id</strong> format: 22-xxxxx (e.g. 22-00123)<br />
                  - <strong>full_name</strong> format: Last, First Middle (e.g. "Tener, Birchard Theo L.")<br />
                  - <strong>program</strong> options: BSCS, BSIT, BSIS<br />
                  - <strong>year</strong> options: 1 to 5
                </p>
              </div>
            </div>

            {importStep === "idle" && (
              <FileUploadCompact
                maxFiles={1}
                accept=".xlsx, .xls"
                multiple={false}
                onFilesChange={handleFilesChange}
              />
            )}

            {importStep !== "idle" && (
              <div className="border rounded-lg p-4 space-y-3 bg-card shadow-sm">
                <Progress value={progress} className="w-full">
                  <ProgressLabel className="text-sm font-medium">{statusText}</ProgressLabel>
                  <ProgressValue />
                </Progress>
              </div>
            )}

            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Errors found in Excel</AlertTitle>
                <AlertDescription>
                  <ScrollArea className="h-40 mt-2 pr-2 text-xs">
                    <ul className="list-disc pl-4 space-y-1">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </AlertDescription>
              </Alert>
            )}

            {importStep === "done" && successCount !== null && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex gap-3 items-center">
                <CheckCircle className="h-5 w-5 text-success shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-success-foreground">Import Successful</p>
                  <p className="text-xs text-muted-foreground">
                    Added {successCount} students to the master list.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t pt-4">
          {importStep === "idle" && (
            <Button
              onClick={startImport}
              disabled={!selectedFile}
              className="w-full h-11 text-base md:text-sm"
            >
              Import Students
            </Button>
          )}

          {importStep === "done" && (
            <Button
              onClick={() => setShow(false)}
              className="w-full h-11 text-base md:text-sm"
            >
              Done
            </Button>
          )}

          {importStep !== "idle" && importStep !== "done" && (
            <Button
              disabled
              className="w-full h-11 text-base md:text-sm"
            >
              Importing...
            </Button>
          )}

          <DrawerClose
            render={
              <Button
                variant="outline"
                disabled={importStep !== "idle" && importStep !== "done"}
                className="w-full h-11 text-base md:text-sm"
              >
                Cancel
              </Button>
            }
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
