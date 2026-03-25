"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Save, LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { updateProfileAction, signOutAction } from "./actions";
import type { Profile, UnitPreference } from "@/src/lib/types/database";

interface SettingsClientProps {
  profile: Profile;
  email: string;
}

export function SettingsClient({ profile, email }: SettingsClientProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [unitPref, setUnitPref] = useState<UnitPreference>(
    profile.preferred_units
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    setSaving(true);
    try {
      await updateProfileAction({
        displayName,
        preferredUnits: unitPref,
      });
      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOutAction();
    router.push("/login");
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Profile</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Preferences</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="units">Measurement Units</Label>
            <Select
              value={unitPref}
              onValueChange={(val) => setUnitPref(val as UnitPreference)}
            >
              <SelectTrigger id="units">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (g, ml, °C)</SelectItem>
                <SelectItem value="imperial">
                  Imperial (oz, cups, °F)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save Changes"}
      </Button>

      <Separator />

      <Button
        variant="outline"
        onClick={handleSignOut}
        className="w-full text-destructive"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
