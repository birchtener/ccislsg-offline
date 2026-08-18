import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/prisma";
import { checkPermission } from "@/features/auth/lib/permissions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Users,
  Calendar,
  Shield,
  Activity,
  ArrowRight,
  Clock,
  Lock,
} from "lucide-react";

export default async function DashboardPage() {
  const { authorized, user } = await checkPermission();

  if (!authorized || !user) {
    return redirect("/sign-in");
  }

  const permissions = user.permissions ?? [];

  const [
    totalStudents,
    totalItems,
    totalAssets,
    activeEventsCount,
    totalUsers,
    recentLogs,
  ] = await Promise.all([
    permissions.includes("students:read")
      ? db.student.count()
      : Promise.resolve(0),
    permissions.includes("inventory:read")
      ? db.inventoryItem.count()
      : Promise.resolve(0),
    permissions.includes("inventory:read")
      ? db.inventoryAsset.count()
      : Promise.resolve(0),
    permissions.includes("attendance:manage") ||
    permissions.includes("attendance:scan")
      ? db.attendanceEvents.count()
      : Promise.resolve(0),
    permissions.includes("users:read") ? db.user.count() : Promise.resolve(0),
    permissions.includes("auditlog:read")
      ? db.auditLog.findMany({
          take: 5,
          orderBy: { created_at: "desc" },
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const cards = [
    {
      title: "Student Directory",
      value: totalStudents,
      description: "Registered student master records",
      icon: Users,
      permission: "students:read",
      link: "/dashboard/master-list",
      linkText: "View Master List",
    },
    {
      title: "Inventory Scope",
      value: `${totalItems} Items / ${totalAssets} Assets`,
      description: "Physical assets & catalog options",
      icon: Boxes,
      permission: "inventory:read",
      link: "/dashboard/inventory/items",
      linkText: "Manage Inventory",
    },
    {
      title: "Attendance Events",
      value: activeEventsCount,
      description: "Scheduled event checkpoints",
      icon: Calendar,
      permission: "attendance:manage",
      link: "/dashboard/attendance/events",
      linkText: "Track Attendance",
    },
    {
      title: "System Accounts",
      value: totalUsers,
      description: "Staff & administrator profiles",
      icon: Shield,
      permission: "users:read",
      link: "/dashboard/users",
      linkText: "Configure Users",
    },
  ];

  const visibleCards = cards.filter((c) => permissions.includes(c.permission));

  return (
    <main className="w-full space-y-6 text-left">
      <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back,{" "}
            <span className="text-primary font-black">
              {user.first_name || user.name || "User"}
            </span>
            !
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System Account: @
            <span className="font-semibold text-foreground">
              {(user as any).username}
            </span>
          </p>
        </div>
        <div>
          <Badge className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20">
            {user.role?.name || "Member"}
          </Badge>
        </div>
      </div>

      {visibleCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleCards.map((c) => (
            <Card
              key={c.title}
              className="border shadow-xs flex flex-col justify-between"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {c.title}
                </CardTitle>
                <c.icon className="h-4.5 w-4.5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div>
                  <div className="text-2xl font-black tracking-tight">
                    {c.value}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {c.description}
                  </p>
                </div>
                <Link
                  href={c.link}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full h-9",
                  )}
                >
                  {c.linkText}
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-dashed p-12 text-center flex flex-col items-center justify-center">
          <Lock className="size-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold">No active widgets available</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Your assigned role does not grant visibility to quick statistic
            panels.
          </p>
        </Card>
      )}

      {permissions.includes("auditlog:read") && (
        <div className="grid grid-cols-1 gap-4">
          <Card className="border">
            <CardHeader className="border-b pb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="size-4.5 text-primary animate-pulse" />
                  <CardTitle className="text-sm font-bold">
                    Recent System Activity
                  </CardTitle>
                </div>
                <Link
                  href="/dashboard/audit-logs"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                  )}
                >
                  View Full Trail
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentLogs.length > 0 ? (
                <div className="divide-y">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-start gap-3 text-left">
                        <div className="mt-0.5">
                          <Badge
                            variant={
                              log.type === "success"
                                ? "secondary"
                                : log.type === "warn"
                                  ? "destructive"
                                  : "outline"
                            }
                            className={
                              log.type === "success"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[9px] uppercase tracking-wider font-mono font-bold"
                                : log.type === "warn"
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[9px] uppercase tracking-wider font-mono font-bold"
                                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[9px] uppercase tracking-wider font-mono font-bold"
                            }
                          >
                            {log.type}
                          </Badge>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-foreground font-medium leading-relaxed">
                            {log.log}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            Actor:{" "}
                            <span className="text-foreground">
                              {log.user?.name || "System"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono font-bold self-start sm:self-center shrink-0">
                        <Clock className="size-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Activity className="size-8 stroke-1.5 opacity-50 mx-auto mb-2" />
                  <p className="text-xs font-semibold">
                    No system actions logged yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
