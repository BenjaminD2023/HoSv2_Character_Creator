import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.2),_transparent_45%),linear-gradient(to_bottom,_hsl(var(--background)),_hsl(var(--secondary)/0.35))]">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 md:py-20">
        <header className="animate-in fade-in slide-in-from-top-4 duration-500">
          <Badge variant="outline" className="mb-4">House of Shadows v2.2.0-alpha</Badge>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Forge Heroes in the Dark</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Build complete House of Shadows characters with SRD-accurate stats, XP-tier skill progression,
            armor-as-damage-reduction combat math, and cinematic 3D dice rolls.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-lg shadow-primary/30">
              <Link href="/builder">Open Character Builder</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/builder#final-sheet">Jump to Final Sheet</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/characters">Character Management</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle>Step-Driven Flow</CardTitle>
              <CardDescription>Guided 7-step creator from stats to final sheet.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sequential progression with unlock rules keeps data valid and avoids broken state.
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle>3D Dice + Roll Feed</CardTitle>
              <CardDescription>Every major roll uses 3D dice with result popups.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Includes critical success/failure styling and auto-dismiss behavior.
            </CardContent>
          </Card>

          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle>HoS Rules Accurate</CardTitle>
              <CardDescription>Built for your custom d20 system, not D&D defaults.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              3-attribute model, XP skill tiers, and armor as damage reduction are fully represented.
            </CardContent>
          </Card>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <Card className="bg-card/60 border-border/60">
            <CardHeader>
              <CardTitle>Character Management</CardTitle>
              <CardDescription>Use dedicated save management with multiple slots and exports.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/characters">Open Character Management</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/builder">Create New Character</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
