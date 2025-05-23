import { defineStore } from 'pinia';
import type { Bonus } from '@/types/Bonus';
import { ref, computed } from 'vue';

// Helper function to generate unique IDs (if needed for dynamic creation later)
// const generateId = () => Math.random().toString(36).substring(2, 9);

export const useBonusesStore = defineStore('bonuses', () => {
    const bonuses = ref<Bonus[]>([
        {
            id: 'strength-boost-1',
            name: 'Strength Boost I',
            description: '+10 Base Attack',
            dependencies: [],
            unlocks: ['strength-boost-2', 'power-strike'],
            x: 50,
            y: 150,
        },
        {
            id: 'strength-boost-2',
            name: 'Strength Boost II',
            description: '+20 Base Attack',
            dependencies: ['strength-boost-1'],
            unlocks: ['heavy-strike'],
            x: 300,
            y: 80,
        },
        {
            id: 'power-strike',
            name: 'Power Strike',
            description: 'Unlocks "Power Strike" ability: deals 200% weapon damage.',
            dependencies: ['strength-boost-1'],
            unlocks: ['critical-power-strike'],
            x: 300,
            y: 220,
        },
        {
            id: 'magic-bolt-1',
            name: 'Magic Bolt I',
            description: 'Unlocks "Magic Bolt" spell: deals 50 magic damage.',
            dependencies: [],
            unlocks: ['magic-bolt-2', 'arcane-shield', 'spell-penetration-1'],
            x: 50,
            y: 400,
        },
        {
            id: 'magic-bolt-2',
            name: 'Magic Bolt II',
            description: '+30% Damage for Magic Bolt',
            dependencies: ['magic-bolt-1'],
            unlocks: ['elemental-overload', 'chain-lightning'],
            x: 300,
            y: 330,
        },
        {
            id: 'arcane-shield',
            name: 'Arcane Shield',
            description: 'Grants a shield that absorbs 100 damage. Cooldown: 30s.',
            dependencies: ['magic-bolt-1'],
            unlocks: ['improved-arcane-shield'],
            x: 300,
            y: 470,
        },
        {
            id: 'swiftness-aura',
            name: 'Swiftness Aura',
            description: '+15% Movement Speed',
            dependencies: [],
            unlocks: ['evasion-boost'],
            x: 50,
            y: 600,
        },
        {
            id: 'critical-power-strike',
            name: 'Critical Power Strike',
            description: '"Power Strike" now has a 25% chance to be a critical hit (300% damage).',
            dependencies: ['power-strike'],
            unlocks: ['elemental-overload', 'berserk-mode'],
            x: 550,
            y: 220,
        },
        {
            id: 'elemental-overload',
            name: 'Elemental Overload',
            description: 'Spells and critical strikes deal an additional 15% of their damage as elemental damage over 3 seconds.',
            dependencies: ['magic-bolt-2', 'critical-power-strike'],
            unlocks: ['master-of-elements'],
            x: 750,
            y: 300,
        },
        {
            id: 'heavy-strike',
            name: 'Heavy Strike',
            description: 'A powerful blow that stuns for 1s. Requires Strength Boost II.',
            dependencies: ['strength-boost-2'],
            unlocks: ['berserk-mode'],
            x: 550,
            y: 80,
        },
        {
            id: 'spell-penetration-1',
            name: 'Spell Penetration I',
            description: 'Magic attacks ignore 10% of enemy resistance.',
            dependencies: ['magic-bolt-1'],
            unlocks: ['spell-penetration-2'],
            x: 300,
            y: 580,
        },
        {
            id: 'improved-arcane-shield',
            name: 'Improved Arcane Shield',
            description: 'Arcane Shield absorbs 50 more damage and cooldown reduced by 5s.',
            dependencies: ['arcane-shield'],
            unlocks: ['master-of-elements'],
            x: 550,
            y: 470,
        },
        {
            id: 'evasion-boost',
            name: 'Evasion Boost',
            description: '+10% chance to dodge attacks.',
            dependencies: ['swiftness-aura'],
            unlocks: [],
            x: 300,
            y: 680,
        },
        {
            id: 'chain-lightning',
            name: 'Chain Lightning',
            description: 'Magic Bolt II can now chain to 2 additional targets for 50% damage.',
            dependencies: ['magic-bolt-2'],
            unlocks: ['master-of-elements'],
            x: 550,
            y: 380,
        },
        {
            id: 'berserk-mode',
            name: 'Berserk Mode',
            description: 'For 10s, +25% attack speed and +10% damage, but -15% defense. Requires Heavy Strike & Crit. Power Strike.',
            dependencies: ['heavy-strike', 'critical-power-strike'],
            unlocks: [],
            x: 750,
            y: 150,
        },
        {
            id: 'spell-penetration-2',
            name: 'Spell Penetration II',
            description: 'Magic attacks ignore an additional 15% of enemy resistance.',
            dependencies: ['spell-penetration-1'],
            unlocks: ['master-of-elements'],
            x: 550,
            y: 580,
        },
        {
            id: 'master-of-elements',
            name: 'Master of Elements',
            description: 'Ultimate: All elemental effects are 25% stronger and last 50% longer.',
            dependencies: ['elemental-overload', 'improved-arcane-shield', 'chain-lightning', 'spell-penetration-2'],
            unlocks: [],
            x: 950,
            y: 400,
        },
    ]);

    const getBonusById = computed(() => {
        return (id: string) => bonuses.value.find(b => b.id === id);
    });

    function updateBonusPosition(id: string, x: number, y: number) {
        const bonus = bonuses.value.find(b => b.id === id);
        if (bonus) {
            bonus.x = x;
            bonus.y = y;
        }
    }

    // Placeholder for future CRUD operations as per TECH_SPEC.md
    // function addBonus(newBonus: Omit<Bonus, 'id' | 'x' | 'y'>) { ... }
    // function removeBonus(id: string) { ... }
    // function updateBonusDetails(id: string, details: Partial<Bonus>) { ... }

    return { bonuses, getBonusById, updateBonusPosition };
}); 