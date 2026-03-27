import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dices, User, BookOpen, Sparkles, Shield, Sword, Flame } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 md:py-20">
        <header className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/50" />
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>

          <div className="parchment-frame-aged inline-block px-12 py-6 mb-6 relative">
            <div className="absolute top-2 right-2">
              <ThemeToggle />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-100 to-orange-200 bg-clip-text text-transparent">
              House of Shadows
            </h1>
            <p className="mt-2 text-lg text-amber-400/60 font-serif italic">
              Forge Your Legend
            </p>
          </div>

          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Build complete House of Shadows characters with SRD-accurate stats, 
            XP-tier skill progression, armor-as-damage-reduction combat math, 
            and cinematic 3D dice rolls.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button 
              asChild 
              size="lg" 
              className="glass-button text-lg px-8 py-6 hover:scale-105 transition-transform"
            >
              <Link href="/builder">
                <Sword className="w-5 h-5 mr-2" />
                Begin Creation
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="parchment-frame hover:border-amber-500/50 hover:text-amber-400 transition-colors text-lg px-8 py-6"
            >
              <Link href="/characters">
                <User className="w-5 h-5 mr-2" />
                Your Characters
              </Link>
            </Button>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent my-8" />
        </header>

        <section className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          <div className="parchment-frame p-6 group hover:scale-[1.02] transition-transform duration-300">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-shadow">
              <BookOpen className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Step-Driven Flow</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Guided 7-step creator from stats to final sheet. Sequential progression with unlock rules keeps data valid.
            </p>
          </div>

          <div className="parchment-frame p-6 group hover:scale-[1.02] transition-transform duration-300">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-shadow">
              <Dices className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">3D Dice + Roll Feed</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every major roll uses physics-based 3D dice with result popups. Critical success/failure styling included.
            </p>
          </div>

          <div className="parchment-frame p-6 group hover:scale-[1.02] transition-transform duration-300">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-shadow">
              <Shield className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">HoS Rules Accurate</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Built for your custom d20 system. 3-attribute model, XP skill tiers, and armor as damage reduction.
            </p>
          </div>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <div className="parchment-frame-aged p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Flame className="w-6 h-6 text-amber-400" />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent">
                    Character Management
                  </h2>
                </div>
                <p className="text-muted-foreground">
                  Use dedicated save management with multiple slots and exports. Track your heroes across adventures.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  asChild
                  className="glass-button"
                >
                  <Link href="/characters">
                    <User className="w-4 h-4 mr-2" />
                    View Characters
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline"
                  className="parchment-frame hover:border-amber-500/50 hover:text-amber-400 transition-colors"
                >
                  <Link href="/builder">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create New
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Badge variant="outline" className="parchment-frame text-xs text-muted-foreground border-border">
            House of Shadows v2.2.0-alpha
          </Badge>
        </div>
      </main>
    </div>
  );
}
