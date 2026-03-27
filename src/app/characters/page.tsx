"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Download,
  Swords,
  Zap,
  Shield,
  Music,
  Sparkles,
  Crown,
  Skull,
  Star,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  getAllCharacters,
  deleteCharacter,
  migrateFromOldSlots,
  Character,
} from "@/lib/character-storage";

// ============================================
// CLASS THEME CONFIGURATION
// ============================================
const CLASS_THEMES: Record<string, {
  icon: React.ReactNode;
  gradient: string;
  border: string;
  glow: string;
  text: string;
  badge: string;
}> = {
  fighter: {
    icon: <Swords className="w-6 h-6" />,
    gradient: "from-red-950/60 via-red-900/40 to-slate-950/60",
    border: "border-red-700/40",
    glow: "hover:shadow-red-600/20",
    text: "text-red-200",
    badge: "bg-red-900/50 text-red-200 border-red-700/30",
  },
  archer: {
    icon: <Zap className="w-6 h-6" />,
    gradient: "from-emerald-950/60 via-green-900/40 to-slate-950/60",
    border: "border-emerald-700/40",
    glow: "hover:shadow-emerald-600/20",
    text: "text-emerald-200",
    badge: "bg-emerald-900/50 text-emerald-200 border-emerald-700/30",
  },
  wizard: {
    icon: <Sparkles className="w-6 h-6" />,
    gradient: "from-purple-950/60 via-violet-900/40 to-slate-950/60",
    border: "border-purple-700/40",
    glow: "hover:shadow-purple-600/20",
    text: "text-purple-200",
    badge: "bg-purple-900/50 text-purple-200 border-purple-700/30",
  },
  priest: {
    icon: <Shield className="w-6 h-6" />,
    gradient: "from-amber-950/60 via-yellow-900/40 to-slate-950/60",
    border: "border-amber-700/40",
    glow: "hover:shadow-amber-600/20",
    text: "text-amber-200",
    badge: "bg-amber-900/50 text-amber-200 border-amber-700/30",
  },
  bard: {
    icon: <Music className="w-6 h-6" />,
    gradient: "from-rose-950/60 via-pink-900/40 to-slate-950/60",
    border: "border-rose-700/40",
    glow: "hover:shadow-rose-600/20",
    text: "text-rose-200",
    badge: "bg-rose-900/50 text-rose-200 border-rose-700/30",
  },
};

const DEFAULT_THEME = {
  icon: <Star className="w-6 h-6" />,
  gradient: "from-slate-800/40 via-slate-700/20 to-slate-900/40",
  border: "border-slate-600/30",
  glow: "hover:shadow-slate-500/20",
  text: "text-slate-300",
  badge: "bg-slate-800/50 text-slate-300 border-slate-600/30",
};

// ============================================
// CUSTOM HOOK
// ============================================
function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    migrateFromOldSlots();
    setCharacters(getAllCharacters());
    setIsLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setCharacters(getAllCharacters());
  }, []);

  return { characters, isLoading, refresh };
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <div className="parchment-frame p-12">
        {/* Decorative corners */}
        <div className="corner-flourish top-left" />
        <div className="corner-flourish top-right" />
        <div className="corner-flourish bottom-left" />
        <div className="corner-flourish bottom-right" />
        
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative text-center py-12">
          {/* Icon with glow */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative inline-block mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-purple-600/20 rounded-full blur-2xl" />
            <div className="relative p-8 rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-amber-500/20">
              <Crown className="w-16 h-16 text-amber-400/80" />
            </div>
            
            {/* Floating decorations */}
            <motion.div
              animate={{ y: [-5, 5, -5], rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-4"
            >
              <Star className="w-6 h-6 text-purple-400/60" />
            </motion.div>
            <motion.div
              animate={{ y: [5, -5, 5], rotate: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-2 -left-4"
            >
              <Sparkles className="w-5 h-5 text-amber-400/60" />
            </motion.div>
          </motion.div>
          
          {/* Text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-amber-200 to-purple-200 bg-clip-text text-transparent">
              No Heroes Yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Your legend awaits. Create your first character and begin your journey through the House of Shadows.
            </p>
          </motion.div>
          
          {/* Create Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Button
              asChild
              size="lg"
              className="btn-fantasy text-lg px-8 py-6"
            >
              <Link href="/builder">
                <Plus className="w-5 h-5 mr-2" />
                Create Your Hero
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// CHARACTER CARD COMPONENT
// ============================================
interface CharacterCardProps {
  character: Character;
  onDelete: (id: string) => void;
  onExport: (character: Character) => void;
}

function CharacterCard({ character, onDelete, onExport }: CharacterCardProps) {
  const theme = CLASS_THEMES[character.className.toLowerCase()] || DEFAULT_THEME;
  const initials = character.name.charAt(0).toUpperCase();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/character/${character.id}`}>
        <div className={`parchment-frame group cursor-pointer transition-all duration-300 ${theme.glow}`}>
          {/* Decorative corners */}
          <div className="corner-flourish top-left" />
          <div className="corner-flourish top-right" />
          <div className="corner-flourish bottom-left" />
          <div className="corner-flourish bottom-right" />
          
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          
          {/* Content */}
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Avatar with frame */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-purple-600/30 rounded-full blur-sm" />
                  <Avatar className="relative w-16 h-16 border-2 border-amber-500/30 bg-gradient-to-br from-slate-800 to-slate-900">
                    <AvatarFallback className={`text-2xl font-bold ${theme.text}`}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Level indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-slate-900 flex items-center justify-center">
                    <Crown className="w-3 h-3 text-foreground" />
                  </div>
                </div>
                
                {/* Name and class */}
                <div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-amber-200 transition-colors">
                    {character.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {theme.icon}
                    <span className={`text-sm capitalize ${theme.text}`}>
                      {character.className}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white/5">
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/builder?id=${character.id}`} className="cursor-pointer">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Character
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport(character)} className="cursor-pointer">
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-400 focus:text-red-400 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(character.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Banish Hero
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Stats row */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="bg-slate-800/80 text-slate-200 border border-slate-700/50">
                <Star className="w-3 h-3 mr-1 text-amber-400" />
                XP: {(character.data?.xp as number) || 0}
              </Badge>
              <Badge variant="secondary" className="bg-slate-800/80 text-slate-200 border border-slate-700/50">
                <Swords className="w-3 h-3 mr-1 text-red-400" />
                HP: {(character.data?.maxHp as number) || '?'}
              </Badge>
              <Badge className={theme.badge}>
                {character.className}
              </Badge>
            </div>
            
            {/* Timestamp */}
            <p className="text-xs text-muted-foreground">
              Last adventure: {new Date(character.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function CharactersPage() {
  const { characters, isLoading, refresh } = useCharacters();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const characterToDelete = characters.find(c => c.id === deleteId);

  const handleDelete = (id: string) => {
    deleteCharacter(id);
    refresh();
    setDeleteId(null);
  };

  const handleExport = (character: Character) => {
    const blob = new Blob([JSON.stringify(character, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-purple-400">
          <Crown className="w-12 h-12 mx-auto mb-4" />
          <p>Loading heroes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/3 rounded-full blur-3xl" />
      </div>

      <main className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-8 h-8 text-amber-400" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-200 via-purple-200 to-amber-200 bg-clip-text text-transparent">
                Hall of Heroes
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {characters.length === 0 
                ? "Your legend awaits..."
                : `${characters.length} hero${characters.length !== 1 ? 'es' : ''} ready for adventure`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              size="lg"
              className="btn-fantasy text-lg px-8"
            >
              <Link href="/builder">
                <Plus className="w-5 h-5 mr-2" />
                New Hero
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Character Grid or Empty State */}
        <AnimatePresence mode="wait">
          {characters.length === 0 ? (
            <EmptyState key="empty" />
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {characters.map((character, index) => (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <CharacterCard
                    character={character}
                    onDelete={setDeleteId}
                    onExport={handleExport}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="!fixed border-red-900/30 bg-card border-2 border-red-900/50 shadow-xl">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-red-900/20">
                  <Skull className="w-6 h-6 text-red-400" />
                </div>
                <AlertDialogTitle className="text-2xl text-red-200">
                  Banish This Hero?
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-muted-foreground">
                {characterToDelete && (
                  <>
                    <span className="text-white font-medium">{characterToDelete.name}</span>
                    {" "}will be permanently lost to the shadows. This cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border bg-muted hover:bg-muted/80">
                Keep Hero
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-destructive hover:bg-destructive/80 text-destructive-foreground border-destructive"
              >
                <Skull className="w-4 h-4 mr-2" />
                Banish Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
