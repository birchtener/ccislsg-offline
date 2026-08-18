import { LucideIcon } from "lucide-react";

export default function PageTitle({
  title,
  desc,
  icon: Icon,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-2">
      <span className="flex gap-3 items-center">
        <div className="flex justify-center items-center p-2 bg-linear-to-bl from-primary/30 to-primary/10 rounded-lg border border-primary/50">
          <Icon className="size-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground ">{title}</h1>
      </span>
      <p className="text-md text-muted-foreground">{desc}</p>
    </div>
  );
}
