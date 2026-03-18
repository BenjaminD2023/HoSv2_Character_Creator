declare module "@3d-dice/dice-box" {
  interface DiceBoxConfig {
    target?: HTMLElement;
    container?: string;
    assetPath: string;
    id?: string;
    gravity?: number;
    startPosition?: { x: number; y: number; z: number };
    throwForce?: number;
    spinForce?: number;
    scale?: number;
    theme?: string;
    themeColor?: string;
    offscreen?: boolean;
    onRollComplete?: (results: DiceResult[]) => void;
  }

  interface DiceResult {
    value: number;
    rolls?: number[];
    modifier?: number;
  }

  interface RollOptions {
    theme?: string;
    themeColor?: string;
  }

  interface RollNotationObject {
    qty: number;
    sides: number | string;
    theme?: string;
    themeColor?: string;
    groupId?: string;
    modifier?: number;
    rolls?: number[];
  }

  export default class DiceBox {
    constructor(config: DiceBoxConfig);
    init(): Promise<void>;
    roll(notation: string | RollNotationObject[], options?: RollOptions): Promise<DiceResult[]>;
    clear(): void;
    hide(): void;
    show(): void;
  }

  export { DiceBoxConfig, DiceResult };
}
