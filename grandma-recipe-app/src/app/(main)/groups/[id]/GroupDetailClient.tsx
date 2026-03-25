"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Copy,
  LogOut,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/src/components/ui/dialog";
import {
  leaveGroupAction,
  deleteGroupAction,
  removeMemberAction,
} from "../actions";
import type { Group, Profile, GroupRole } from "@/src/lib/types/database";
import Link from "next/link";

interface Member {
  user_id: string;
  role: GroupRole;
  profile: Pick<Profile, "display_name" | "avatar_url">;
}

interface GroupDetailClientProps {
  group: Group;
  members: Member[];
  myRole: GroupRole;
  myUserId: string;
}

export function GroupDetailClient({
  group,
  members,
  myRole,
  myUserId,
}: GroupDetailClientProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const isAdmin = myRole === "admin";

  function copyInviteLink() {
    const link = `${window.location.origin}/join/${group.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(group.invite_code);
    toast.success("Code copied!");
  }

  async function handleLeave() {
    try {
      await leaveGroupAction(group.id);
      toast.success("Left group");
      router.push("/groups");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDelete() {
    try {
      await deleteGroupAction(group.id);
      toast.success("Group deleted");
      router.push("/groups");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await removeMemberAction(group.id, userId);
      toast.success("Member removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/groups">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => setLeaveOpen(true)}>
            <LogOut className="mr-2 h-4 w-4" />
            Leave
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Invite section */}
      <div className="rounded-md bg-muted p-4 space-y-2">
        <p className="text-sm font-medium">Invite Link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-background px-3 py-2 text-sm truncate">
            {typeof window !== "undefined"
              ? `${window.location.origin}/join/${group.invite_code}`
              : `/join/${group.invite_code}`}
          </code>
          <Button variant="outline" size="sm" onClick={copyInviteLink}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Code:</span>
          <code className="text-sm font-mono">{group.invite_code}</code>
          <Button variant="ghost" size="sm" onClick={copyInviteCode}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Members list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members
        </h2>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50"
            >
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                {member.profile.display_name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {member.profile.display_name}
                  {member.user_id === myUserId && (
                    <span className="text-muted-foreground"> (you)</span>
                  )}
                </p>
              </div>
              <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                {member.role}
              </Badge>
              {isAdmin && member.user_id !== myUserId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleRemoveMember(member.user_id)}
                >
                  <UserMinus className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Dialog */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave &ldquo;{group.name}&rdquo;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeave}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{group.name}&rdquo; and remove
              all members. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
