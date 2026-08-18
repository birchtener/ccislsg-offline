import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Session, authClient } from "@/features/auth/lib/auth-client";
import { useRouter } from "next/navigation";
import { CircleUserRound, LogOut } from "lucide-react";
export default function NavUser({ user }: { user: Session["user"] }) {
  const router = useRouter();

  const handleSignout = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || undefined}
              />
              <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        }
      />

      <DropdownMenuContent className="w-3xs" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-4 py-3">
            <Avatar className="size-10">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || undefined}
              />
              <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-foreground">
                {user.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                @{user.username}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="flex items-center gap-2 p-2 cursor-pointer"
            onClick={() => router.push("/dashboard/profile")}
          >
            <CircleUserRound size={20} />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="flex items-center gap-2 p-2 cursor-pointer"
            onClick={handleSignout}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
