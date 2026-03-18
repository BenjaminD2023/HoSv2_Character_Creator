"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CHARACTER_STORAGE_KEY = "hos.character-builder.v1";
const CHARACTER_SLOTS_KEY = "hos.character-builder.slots.v1";
const CHARACTER_ACTIVE_SLOT_KEY = "hos.character-builder.active-slot.v1";
const CHARACTER_SLOT_COUNT = 12;

type CharacterSlotItem = {
  slot: number;
  name: string;
  className: string;
  savedAt: string;
};

function slotKey(slot: number) {
  return `${CHARACTER_STORAGE_KEY}.slot-${slot}`;
}

function allSlots() {
  return Array.from({ length: CHARACTER_SLOT_COUNT }, (_, i) => i + 1);
}

export default function CharactersPage() {
  const [slots, setSlots] = useState<CharacterSlotItem[]>([]);
  const [activeSlot, setActiveSlot] = useState(1);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(CHARACTER_SLOTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as CharacterSlotItem[]) : [];
    setSlots(Array.isArray(parsed) ? parsed.sort((a, b) => a.slot - b.slot) : []);
    const active = Number(window.localStorage.getItem(CHARACTER_ACTIVE_SLOT_KEY) ?? "1");
    setActiveSlot(Number.isInteger(active) && active >= 1 && active <= CHARACTER_SLOT_COUNT ? active : 1);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActive = (slot: number) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHARACTER_ACTIVE_SLOT_KEY, String(slot));
    setActiveSlot(slot);
  };

  const clearSlot = (slot: number) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(slotKey(slot));
    const next = slots.filter((item) => item.slot !== slot);
    window.localStorage.setItem(CHARACTER_SLOTS_KEY, JSON.stringify(next));
    setSlots(next);
  };

  const exportSlotJson = (slot: number) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(slotKey(slot));
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hos-slot-${slot}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Character Management</h1>
            <p className="text-sm text-muted-foreground">Manage save slots, export data, and jump into the builder.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link href="/">Home</Link></Button>
            <Button asChild><Link href={`/builder?slot=${activeSlot}`}>Open Active Slot</Link></Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allSlots().map((slot) => {
            const item = slots.find((s) => s.slot === slot);
            return (
              <Card key={slot} className={`border ${activeSlot === slot ? "border-primary bg-primary/10" : "border-border/50"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    Slot {slot}
                    {activeSlot === slot && <Badge>Active</Badge>}
                  </CardTitle>
                  <CardDescription className="truncate">{item ? `${item.name} - ${item.className}` : "Empty slot"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">{item?.savedAt ? `Saved: ${new Date(item.savedAt).toLocaleString()}` : "No data"}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" asChild><Link href={`/builder?slot=${slot}`}>{item ? "Open" : "Create"}</Link></Button>
                    <Button size="sm" variant="outline" onClick={() => setActive(slot)}>Set Active</Button>
                    <Button size="sm" variant="outline" onClick={() => exportSlotJson(slot)} disabled={!item}>Export</Button>
                    <Button size="sm" variant="ghost" onClick={() => clearSlot(slot)} disabled={!item}>Clear</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
