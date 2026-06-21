import { GameClock } from './core/GameClock.js';
import { DragManager } from './core/DragManager.js';
import { FloorScene } from './scenes/FloorScene.js';
import { LEVEL_1 } from './data/levels.js';

console.log("Game Booted");

const clock = new GameClock();
const dragManager = new DragManager();
dragManager.setScene('floor');

const gameContainer = document.getElementById('game-container');

// Boot Sprint 2 Floor Scene
const floorScene = new FloorScene(clock, dragManager, LEVEL_1);
floorScene.render(gameContainer);

// Start game loop
clock.start();
