"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PasswordCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  password: string;
  username: string;
  title: string;
}

export function PasswordCopyDialog({
  open,
  onOpenChange,
  password,
  username,
  title,
}: PasswordCopyDialogProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy password");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Please copy this temporary password. It will not be shown again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4 w-full">
          <div className="space-y-2 flex flex-col items-start w-full">
            <Label htmlFor="username-display" className="text-sm font-medium">Username</Label>
            <Input
              id="username-display"
              value={username}
              readOnly
              className="h-10 bg-muted/30 w-full"
            />
          </div>
          <div className="space-y-2 flex flex-col items-start w-full">
            <Label htmlFor="password-display" className="text-sm font-medium">Temporary Password</Label>
            <div className="relative w-full">
              <Input
                id="password-display"
                value={password}
                readOnly
                type="text"
                className="h-10 pr-10 font-mono text-base md:text-sm bg-muted/30 w-full"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy</span>
              </Button>
            </div>
          </div>
        </div>
        <AlertDialogFooter className="border-t pt-4">
          <AlertDialogCancel onClick={() => onOpenChange(false)} className="w-full">
            Done
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
