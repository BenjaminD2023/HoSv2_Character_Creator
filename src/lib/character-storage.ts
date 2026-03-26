export const CHARACTERS_KEY = "hos.characters.v2";
export const SHEET_STATE_KEY = "hos.character-sheet.state";

export interface Character {
  id: string;
  name: string;
  className: string;
  createdAt: string;
  updatedAt: string;
  data: Record<string, unknown>;
  sheetState?: {
    currentHp: number;
    tempHp: number;
    xp: number;
    inventory: unknown[];
    notes: string;
    spellSlots?: unknown;
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getAllCharacters(): Character[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CHARACTERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Character[];
  } catch {
    return [];
  }
}

export function getCharacter(id: string): Character | null {
  const characters = getAllCharacters();
  return characters.find((c) => c.id === id) || null;
}

export function saveCharacter(character: Character): void {
  const characters = getAllCharacters();
  const index = characters.findIndex((c) => c.id === character.id);
  character.updatedAt = new Date().toISOString();

  if (index >= 0) {
    characters[index] = character;
  } else {
    character.createdAt = new Date().toISOString();
    characters.push(character);
  }

  localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
}

export function deleteCharacter(id: string): void {
  const characters = getAllCharacters();
  const filtered = characters.filter((c) => c.id !== id);
  localStorage.setItem(CHARACTERS_KEY, JSON.stringify(filtered));
}

export function createCharacter(data: Record<string, unknown>): Character {
  const character: Character = {
    id: generateId(),
    name: (data.characterName as string) || "Unnamed",
    className: (data.selectedClassId as string) || "Unknown",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: data,
  };
  saveCharacter(character);
  return character;
}

export function migrateFromOldSlots(): Character[] {
  const OLD_STORAGE_KEY = "hos.character-builder.v1";
  const OLD_SLOTS_KEY = "hos.character-builder.slots.v1";

  const migrated: Character[] = [];
  const slotsRaw = localStorage.getItem(OLD_SLOTS_KEY);
  if (!slotsRaw) return migrated;

  try {
    const slots = JSON.parse(slotsRaw) as { slot: number; name?: string; className?: string; savedAt?: string }[];
    slots.forEach((slot) => {
      const slotData = localStorage.getItem(
        `${OLD_STORAGE_KEY}.slot-${slot.slot}`
      );
      if (slotData) {
        const data = JSON.parse(slotData) as Record<string, unknown>;
        const character: Character = {
          id: generateId(),
          name:
            slot.name ||
            (data.characterName as string) ||
            "Migrated Character",
          className:
            slot.className ||
            (data.selectedClassId as string) ||
            "Unknown",
          createdAt: slot.savedAt || new Date().toISOString(),
          updatedAt: slot.savedAt || new Date().toISOString(),
          data: data,
        };
        migrated.push(character);
      }
    });

    if (migrated.length > 0) {
      localStorage.setItem(CHARACTERS_KEY, JSON.stringify(migrated));
    }
  } catch (e) {
    console.error("Migration failed:", e);
  }

  return migrated;
}
