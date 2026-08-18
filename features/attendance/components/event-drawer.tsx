"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { EventFormSchema, EventFormInput } from "../schema/events";
import { CreateEvent, UpdateEvent } from "../actions/events";
import { toast } from "sonner";

interface EventDrawerProps {
  eventToEdit: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EventDrawer({
  eventToEdit,
  open,
  onOpenChange,
  onSuccess,
}: EventDrawerProps) {
  const isMobile = useIsMobile();
  const [isRange, setIsRange] = React.useState(false);
  const [singleDate, setSingleDate] = React.useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormInput>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: {
      name: "",
      requires_time_out: true,
      isRange: false,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (eventToEdit) {
        const start = new Date(eventToEdit.start_date);
        const end = new Date(eventToEdit.end_date);
        const diffDays = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays >= 1) {
          setIsRange(true);
          setDateRange({ from: start, to: end });
          setValue("isRange", true);
          setValue("startDate", start);
          setValue("endDate", end);
        } else {
          setIsRange(false);
          setSingleDate(start);
          setValue("isRange", false);
          setValue("singleDate", start);
        }

        reset({
          name: eventToEdit.name,
          requires_time_out: eventToEdit.requires_time_out,
          isRange: diffDays >= 1,
        });
      } else {
        setIsRange(false);
        setSingleDate(undefined);
        setDateRange(undefined);
        reset({
          name: "",
          requires_time_out: true,
          isRange: false,
        });
      }
    }
  }, [eventToEdit, open, reset, setValue]);

  const handleRangeSwitch = (checked: boolean) => {
    setIsRange(checked);
    setValue("isRange", checked);
    if (checked) {
      setValue("singleDate", undefined);
      setSingleDate(undefined);
    } else {
      setValue("startDate", undefined);
      setValue("endDate", undefined);
      setDateRange(undefined);
    }
  };

  const handleSingleDateSelect = (date: Date | undefined) => {
    setSingleDate(date);
    setValue("singleDate", date);
  };

  const handleRangeDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setValue("startDate", range?.from);
    setValue("endDate", range?.to);
  };

  const formatToYMD = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const onSubmit = async (data: EventFormInput) => {
    if (isRange) {
      if (!dateRange?.from || !dateRange?.to) {
        toast.error("Please select a valid date range.");
        return;
      }
      data.startDate = formatToYMD(dateRange.from) as any;
      data.endDate = formatToYMD(dateRange.to) as any;
    } else {
      if (!singleDate) {
        toast.error("Please select an event date.");
        return;
      }
      data.singleDate = formatToYMD(singleDate) as any;
    }

    const toastId = toast.loading(eventToEdit ? "Updating event details..." : "Creating new event...");

    try {
      let result;
      if (eventToEdit) {
        result = await UpdateEvent(eventToEdit.id, data);
      } else {
        result = await CreateEvent(data);
      }

      if (!result.ok) {
        toast.error(result.error || "Operation failed.", { id: toastId });
        return;
      }

      toast.success(result.message || "Operation successful.", { id: toastId });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.", { id: toastId });
    }
  };

  const dateDisplay = React.useMemo(() => {
    if (isRange) {
      if (dateRange?.from) {
        if (dateRange.to) {
          return `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`;
        }
        return format(dateRange.from, "PPP");
      }
      return "Select Date Range";
    } else {
      if (singleDate) {
        return format(singleDate, "PPP");
      }
      return "Select Date";
    }
  }, [isRange, singleDate, dateRange]);

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      <DrawerContent className="h-[90dvh] md:h-full flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{eventToEdit ? "Edit Event" : "Create Event"}</DrawerTitle>
          <DrawerDescription>
            {eventToEdit
              ? "Update details and date configurations for this event."
              : "Register a new event for tracking student attendance."}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 min-h-0 my-2! mb-4!" data-base-ui-swipe-ignore>
          <form
            id="event-form"
            onSubmit={handleSubmit(onSubmit)}
            className="px-4 py-2 space-y-6"
            data-base-ui-swipe-ignore
          >
            <FieldGroup>
              <Field>
                <FieldLabel className="text-sm font-semibold">Event Name</FieldLabel>
                <Input
                  {...register("name")}
                  placeholder="e.g. General Assembly"
                  className="text-base md:text-sm h-13.5!"
                />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/40">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold block text-foreground">
                    Requires Time Out
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    Verify student departure scanning.
                  </span>
                </div>
                <Controller
                  control={control}
                  name="requires_time_out"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/40">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold block text-foreground">
                    Multiple Days Event
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    Track attendance over a range of dates.
                  </span>
                </div>
                <Switch checked={isRange} onCheckedChange={handleRangeSwitch} />
              </div>

              <Field>
                <FieldLabel className="text-sm font-semibold">Event Date(s)</FieldLabel>
                <Popover>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      className="w-full h-13.5! justify-start text-left font-normal border-border gap-2"
                    >
                      <CalendarIcon className="size-4 text-muted-foreground" />
                      <span>{dateDisplay}</span>
                    </Button>
                  } />
                  <PopoverContent className="w-auto p-0" align="start">
                    {isRange ? (
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleRangeDateSelect}
                      />
                    ) : (
                      <Calendar
                        mode="single"
                        selected={singleDate}
                        onSelect={handleSingleDateSelect}
                      />
                    )}
                  </PopoverContent>
                </Popover>
              </Field>
            </FieldGroup>
          </form>
        </ScrollArea>

        <DrawerFooter className="border-t pt-4 flex gap-2">
          <Button
            type="submit"
            form="event-form"
            className="w-full h-13.5! cursor-pointer"
            disabled={isSubmitting}
          >
            {eventToEdit ? "Save Changes" : "Create Event"}
          </Button>
          <DrawerClose render={
            <Button variant="outline" className="w-full h-11">
              Cancel
            </Button>
          } />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
