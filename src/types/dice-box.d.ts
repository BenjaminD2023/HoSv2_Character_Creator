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

  export default class DiceBox {
    constructor(selector: string, config: DiceBoxConfig);
    constructor(config: DiceBoxConfig);
    init(): Promise<void>;
    roll(notation: string): Promise<DiceResult[]>;
    clear(): void;
    hide(): void;
    show(): void;
  }

  export { DiceBoxConfig, DiceResult };
}
