"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, Sparkles } from "lucide-react";
import { getCharacter, Character } from "@/lib/character-storage";

function useCharacter(id: string | null) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setCharacter(getCharacter(id));
    }
    setIsLoading(false);
  }, [id]);

  const refresh = useCallback(() => {
    if (id) {
      setCharacter(getCharacter(id));
    }
  }, [id]);

  return { character, isLoading, refresh };
}

export default function CharacterPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const id = params.id as string;
  const { character, isLoading } = useCharacter(id);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !character) return;

    const OLD_STORAGE_KEY = "hos.character-builder.v1";
    localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(character.data));

    const SHEET_STATE_KEY = "hos.character-sheet.state";
    if (character.sheetState) {
      localStorage.setItem(SHEET_STATE_KEY, JSON.stringify(character.sheetState));
    } else {
      const maxHp = (character.data?.maxHp as number) || 10;
      const defaultState = {
        currentHp: maxHp,
        tempHp: 0,
        xp: (character.data?.startingXp as number) || 0,
        inventory: [],
        notes: "",
        lastModified: new Date().toISOString(),
      };
      localStorage.setItem(SHEET_STATE_KEY, JSON.stringify(defaultState));
    }

    router.push("/sheet");
  }, [mounted, character, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <Card className="w-full max-w-md border-white/10 bg-white/5">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
              <User className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Character Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              This character does not exist or has been deleted.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/characters">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Characters
                </Link>
              </Button>
              <Button asChild>
                <Link href="/builder?new=1">Create New Character</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
