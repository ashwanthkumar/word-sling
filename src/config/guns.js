export const GUN_LEVELS = [
  { name: 'Pea Shooter',     wordsNeeded: 0,   cooldown: 0.8, projectiles: 1, spread: 0,    speed: 30, damage: 1, description: 'Basic single shot' },
  { name: 'Pulse Blaster',   wordsNeeded: 5,   cooldown: 0.5, projectiles: 1, spread: 0,    speed: 35, damage: 1, description: 'Faster firing rate' },
  { name: 'Twin Lasers',     wordsNeeded: 15,  cooldown: 0.5, projectiles: 2, spread: 0.3,  speed: 35, damage: 1, description: 'Fires two parallel beams' },
  { name: 'Scatter Shot',    wordsNeeded: 30,  cooldown: 0.45, projectiles: 3, spread: 0.5, speed: 38, damage: 1, description: 'Three-way spread fire' },
  { name: 'Homing Rockets',  wordsNeeded: 50,  cooldown: 0.4, projectiles: 2, spread: 0.4,  speed: 32, damage: 1, homing: true, description: 'Auto-seeking projectiles' },
  { name: 'Chain Lightning',  wordsNeeded: 75,  cooldown: 0.35, projectiles: 2, spread: 0.4, speed: 40, damage: 1, homing: true, chain: 1, description: 'Chains to nearby decoy' },
  { name: 'Nova Cannon',     wordsNeeded: 100, cooldown: 0.3, projectiles: 3, spread: 0.5,  speed: 42, damage: 1, homing: true, chain: 1, blast: 2.5, description: 'Explosive blast radius' },
];

export const BOOST_CONFIG = {
  duration: 10,
  cooldownMultiplier: 0.5,
  extraProjectiles: 1,
  speedMultiplier: 1.3,
};
