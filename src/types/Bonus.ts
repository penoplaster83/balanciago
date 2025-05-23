export interface Bonus {
    id: string;
    name: string;
    description: string;
    dependencies: string[]; // IDs of bonuses this bonus depends on
    unlocks: string[];     // IDs of bonuses this bonus unlocks (for drawing arrows)
    x: number; // position x
    y: number; // position y
} 