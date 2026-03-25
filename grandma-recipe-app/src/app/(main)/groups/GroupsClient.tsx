"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Users, LogIn } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { createGroupAction, joinGroupAction } from "./actions";
import type { Group, GroupRole } from "@/src/lib/types/database";
import Link from "next/link";

interface GroupsClientProps {
  groups: (Group & { member_count: number; my_role: GroupRole })[];
}

export function GroupsClient({ groups }: GroupsClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!groupName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const id = await createGroupAction(groupName);
      toast.success("Group created!");
      setDialogOpen(false);
      router.push(`/groups/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      toast.error("Invite code is required");
      return;
    }
    setSubmitting(true);
    try {
      const id = await joinGroupAction(inviteCode);
      toast.success("Joined group!");
      setDialogOpen(false);
      router.push(`/groups/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Groups</h1>
        <Button onClick={() => { setGroupName(""); setInviteCode(""); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New / Join
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">
            No groups yet. Create or join one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <p className="font-medium">{group.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {group.member_count} {group.member_count === 1 ? "member" : "members"}
                    {" · "}
                    {group.my_role}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create or Join a Group</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="create">
            <TabsList className="w-full">
              <TabsTrigger value="create" className="flex-1">Create</TabsTrigger>
              <TabsTrigger value="join" className="flex-1">Join</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-4 pt-4">
              <Input
                placeholder="Group name (e.g., Family Recipes)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <Button onClick={handleCreate} disabled={submitting} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </TabsContent>
            <TabsContent value="join" className="space-y-4 pt-4">
              <Input
                placeholder="Paste invite code..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <Button onClick={handleJoin} disabled={submitting} className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Join Group
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
