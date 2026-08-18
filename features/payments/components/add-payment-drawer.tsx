"use client";

import { useState, useEffect, useTransition } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  ShoppingBag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Scanner } from "@yudiel/react-qr-scanner";
import { CreateTransaction, GetStudentByStudentId } from "../actions/payments";

interface AddPaymentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeItems: any[];
  onSuccess?: () => void;
}

interface CartItem {
  id: string;
  item_id: string;
  variant_id?: string;
  itemName: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  maxAvailable: number;
  type: "cf" | "mf";
}

export function AddPaymentDrawer({
  open,
  onOpenChange,
  feeItems,
  onSuccess,
}: AddPaymentDrawerProps) {
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPendingLookup, startLookupTransition] = useTransition();

  const [afNumber, setAfNumber] = useState("");
  const [studentIdInput, setStudentIdInput] = useState("");
  const [studentInfo, setStudentInfo] = useState<any | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<string>("1");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [remarks, setRemarks] = useState("");

  const handleAfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    if (raw.length > 4) {
      setAfNumber(`${raw.slice(0, 4)}-${raw.slice(4)}`);
    } else {
      setAfNumber(raw);
    }
  };

  const formatStudentIdString = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 8);
    if (raw.length > 3) {
      return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    }
    return raw;
  };

  const handleStudentIdChange = (val: string) => {
    const formatted = formatStudentIdString(val);
    setStudentIdInput(formatted);

    const cleanDigits = val.replace(/\D/g, "");
    if (cleanDigits.length >= 7) {
      lookupStudent(formatted);
    } else {
      setStudentInfo(null);
      setStudentError(null);
    }
  };

  const lookupStudent = (idToSearch: string) => {
    if (!idToSearch.trim()) return;
    startLookupTransition(async () => {
      const res = await GetStudentByStudentId(idToSearch);
      if (res.ok && res.student) {
        setStudentInfo(res.student);
        setStudentError(null);
      } else {
        setStudentInfo(null);
        setStudentError(res.error || "Student not found.");
      }
    });
  };

  const handleQrScan = (results: any[]) => {
    if (results && results.length > 0 && results[0].rawValue) {
      const rawText = results[0].rawValue.trim();
      setIsScannerOpen(false);
      toast.success(`Scanned QR: ${rawText}`);
      handleStudentIdChange(rawText);
    }
  };

  const activeFeeItem = feeItems.find((i) => i.id === selectedItemId);
  const activeVariants = activeFeeItem?.variants || [];
  const activeVariantObj = activeVariants.find((v: any) => v.id === selectedVariantId);

  useEffect(() => {
    if (activeFeeItem?.has_variants && activeVariants.length > 0) {
      setSelectedVariantId(activeVariants[0].id);
    } else {
      setSelectedVariantId("");
    }
  }, [selectedItemId]);

  const handleAddToCart = () => {
    if (!activeFeeItem) {
      toast.error("Please select a fee item.");
      return;
    }

    const qty = parseInt(itemQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }

    let maxAvail = 999999;
    let variantName: string | undefined = undefined;

    if (activeFeeItem.type === "mf") {
      if (activeFeeItem.has_variants) {
        if (!selectedVariantId || !activeVariantObj) {
          toast.error("Please select a variant.");
          return;
        }
        maxAvail = activeVariantObj.quantity;
        variantName = activeVariantObj.name;
      } else {
        maxAvail = activeFeeItem.quantity;
      }

      if (maxAvail <= 0) {
        toast.error(`Item "${activeFeeItem.name}" is out of stock.`);
        return;
      }

      if (qty > maxAvail) {
        toast.error(`Cannot add ${qty}. Only ${maxAvail} units in stock.`);
        return;
      }
    }

    const existingIndex = cart.findIndex(
      (c) =>
        c.item_id === activeFeeItem.id &&
        (c.variant_id || "") === (selectedVariantId || "")
    );

    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].quantity + qty;
      if (activeFeeItem.type === "mf" && newQty > maxAvail) {
        toast.error(`Cannot add more. Total in cart would exceed stock (${maxAvail}).`);
        return;
      }
      updatedCart[existingIndex].quantity = newQty;
      setCart(updatedCart);
    } else {
      const newItem: CartItem = {
        id: `${activeFeeItem.id}-${selectedVariantId || "default"}-${Date.now()}`,
        item_id: activeFeeItem.id,
        variant_id: selectedVariantId || undefined,
        itemName: activeFeeItem.name,
        variantName,
        unitPrice: Number(activeFeeItem.price),
        quantity: qty,
        maxAvailable: maxAvail,
        type: activeFeeItem.type,
      };
      setCart((prev) => [...prev, newItem]);
    }

    toast.success(`Added ${activeFeeItem.name} to transaction.`);
    setItemQuantity("1");
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartId));
  };

  const totalCartAmount = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const resetForm = () => {
    setAfNumber("");
    setStudentIdInput("");
    setStudentInfo(null);
    setStudentError(null);
    setCart([]);
    setSelectedItemId("");
    setSelectedVariantId("");
    setItemQuantity("1");
    setPaymentMethod("CASH");
    setRemarks("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!afNumber || afNumber.length !== 9) {
      toast.error("Please enter a valid 8-digit AF Number (e.g. 2526-0001).");
      return;
    }

    if (!studentInfo) {
      toast.error("Please select/verify a valid student record.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Please add at least one fee item to the transaction.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await CreateTransaction({
        af_number: afNumber,
        student_identifier: studentInfo.student_id,
        items: cart.map((c) => ({
          item_id: c.item_id,
          variant_id: c.variant_id,
          quantity: c.quantity,
        })),
        payment_method: paymentMethod,
        remarks,
      });

      if (res.ok) {
        toast.success(`Transaction AF# ${afNumber} recorded successfully!`);
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(res.error || "Failed to record transaction.");
      }
    } catch (err: any) {
      toast.error("An error occurred while creating transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        showSwipeHandle={isMobile}
        swipeDirection={isMobile ? "down" : "right"}
      >
        <DrawerContent className="h-[85dvh] md:h-full flex flex-col max-w-xl mx-auto">
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Record Payment Transaction
            </DrawerTitle>
            <DrawerDescription className="text-xs pb-1">
              Issue an Acknowledgement Receipt (AF) for College Fees or Merchandise purchases.
            </DrawerDescription>
          </DrawerHeader>

          <ScrollArea className="flex-1 min-h-0 py-4" data-base-ui-swipe-ignore>
            <form
              id="add-payment-form"
              onSubmit={handleSubmit}
              className="px-6 space-y-4 text-left"
              data-base-ui-swipe-ignore
            >
              <div className="space-y-1.5">
                <Label htmlFor="afNumber" className="font-bold">
                  AF Number (Acknowledgement Receipt) *
                </Label>
                <div className="relative">
                  <Input
                    id="afNumber"
                    placeholder="2526-0001"
                    value={afNumber}
                    onChange={handleAfChange}
                    maxLength={9}
                    className="h-13.5 px-4 text-base font-mono font-bold tracking-wider pl-4 pr-10 border-primary/50 focus:border-primary"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">
                    {afNumber.replace("-", "").length}/8
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Format: 8 digits automatically formatted as <code className="font-mono bg-muted px-1 py-0.5 rounded">XXXX-XXXX</code>.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="studentIdInput" className="font-bold">
                    Student ID *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsScannerOpen(true)}
                    className="h-10 px-4 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Scan Student QR
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    id="studentIdInput"
                    placeholder="e.g. 251-03887"
                    value={studentIdInput}
                    onChange={(e) => handleStudentIdChange(e.target.value)}
                    className="h-13.5 px-4 font-mono uppercase"
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => lookupStudent(studentIdInput)}
                    disabled={isPendingLookup || !studentIdInput.trim()}
                    className="h-13.5 px-4 text-xs font-semibold shrink-0"
                  >
                    {isPendingLookup ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>

                {studentInfo && (
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-100 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">
                          {studentInfo.first_name} {studentInfo.last_name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30">
                            {studentInfo.student_id}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {studentInfo.program} - Yr {studentInfo.year}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  </div>
                )}

                {studentError && !studentInfo && (
                  <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{studentError}</span>
                  </div>
                )}
              </div>

              <div className="border rounded-xl p-4 bg-muted/20 space-y-4">
                <Label className="font-bold text-sm flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Add Fee Items to Transaction
                </Label>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Select Item</span>
                    <Select
                      value={selectedItemId}
                      onValueChange={(val) => setSelectedItemId(val || "")}
                    >
                      <SelectTrigger className="h-13.5 px-4">
                        <SelectValue placeholder="-- Select Fee Item or Merchandise --">
                          {(val) => {
                            const item = feeItems.find((i) => i.id === val);
                            return item ? `${item.name} (₱${Number(item.price).toFixed(2)})` : undefined;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {feeItems.map((item) => (
                          <SelectItem key={item.id} value={item.id} className="py-2">
                            <div className="flex items-center justify-between w-full gap-4">
                              <span className="font-semibold text-sm">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={item.type === "cf" ? "outline" : "secondary"}
                                  className="text-[10px] uppercase font-bold"
                                >
                                  {item.type === "cf" ? "College Fee" : "Merchandise"}
                                </Badge>
                                <span className="font-mono text-xs font-bold text-primary">
                                  ₱{Number(item.price).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {activeFeeItem?.has_variants && activeVariants.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Select Variant (Size / Color)</span>
                      <Select
                        value={selectedVariantId}
                        onValueChange={(val) => setSelectedVariantId(val || "")}
                      >
                        <SelectTrigger className="h-13.5 px-4">
                          <SelectValue placeholder="-- Select Variant --">
                            {(val) => {
                              const v = activeVariants.find((v: any) => v.id === val);
                              return v ? `${v.name} (Stock: ${v.quantity})` : undefined;
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {activeVariants.map((v: any) => (
                            <SelectItem key={v.id} value={v.id} className="py-2">
                              <div className="flex items-center justify-between w-full gap-4">
                                <span className="font-medium">{v.name}</span>
                                <Badge
                                  variant={v.quantity > 0 ? "outline" : "destructive"}
                                  className="text-[10px] font-mono"
                                >
                                  {v.quantity > 0 ? `Stock: ${v.quantity}` : "Out of stock"}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-32">
                      <span className="text-xs text-muted-foreground block mb-1">Quantity</span>
                      <Input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        className="h-13.5 px-4 font-mono"
                      />
                    </div>
                    <div className="flex-1 pt-5">
                      <Button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!selectedItemId}
                        className="h-13.5 px-4 w-full text-xs font-semibold gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Transaction
                      </Button>
                    </div>
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Transaction Items ({cart.length})
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {cart.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-lg border bg-card text-card-foreground flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <h5 className="font-bold text-sm text-foreground">
                              {c.itemName}
                            </h5>
                            {c.variantName && (
                              <Badge variant="secondary" className="text-[10px] mt-0.5">
                                Variant: {c.variantName}
                              </Badge>
                            )}
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              ₱{c.unitPrice.toFixed(2)} × {c.quantity} unit(s)
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold font-mono text-sm text-primary">
                              ₱{(c.unitPrice * c.quantity).toFixed(2)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFromCart(c.id)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between font-bold">
                      <span className="text-sm">Total Amount Due</span>
                      <span className="text-lg font-mono text-primary">
                        ₱{totalCartAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remarks">Payment Remarks (Optional)</Label>
                <Input
                  id="remarks"
                  placeholder="e.g. Paid in cash via CCIS LSG Office"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="h-13.5 px-4"
                />
              </div>
            </form>
          </ScrollArea>

          <DrawerFooter className="border-t p-4 flex flex-col sm:flex-row gap-2 sm:gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-13.5 px-4 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-payment-form"
              disabled={isSubmitting || cart.length === 0 || !studentInfo}
              className="h-13.5 px-6 w-full sm:w-auto font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                `Confirm Payment (₱${totalCartAmount.toFixed(2)})`
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="text-left border-b pb-3">
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Scan Student ID QR Code
            </DialogTitle>
            <DialogDescription>
              Align the student ID QR code inside the camera frame.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 aspect-square w-full rounded-xl overflow-hidden border-2 border-primary/50 relative bg-black">
            {isScannerOpen && (
              <Scanner
                onScan={handleQrScan}
                onError={(error) => console.error(error)}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { width: "100%", height: "100%", objectFit: "cover" },
                }}
              />
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setIsScannerOpen(false)}
            className="w-full h-13.5 px-4"
          >
            Close Camera
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
