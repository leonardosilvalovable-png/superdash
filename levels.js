// Super Dash - Level Definitions
const LEVELS = [
  {
    name: "Stereo Starter",
    difficulty: "Fácil",
    bgClass: "bg-starter",
    bgColor: "#0f172a", // Dark Slate Blue
    accentColor: "#38bdf8", // Sky Blue
    floorColor: "#1e293b",
    musicIdx: 0,
    speed: 6.5, // Pixels per frame at 60fps
    objects: [
      // Basic jumping
      { type: 's', x: 10, y: 0 },
      { type: 'b', x: 15, y: 0 },
      { type: 'b', x: 16, y: 0 },
      { type: 's', x: 16, y: 1 }, // Spike on block
      
      // Triple spikes or double spikes
      { type: 's', x: 22, y: 0 },
      { type: 's', x: 23, y: 0 },
      
      // Staircase
      { type: 'b', x: 28, y: 0 },
      { type: 'b', x: 29, y: 1 },
      { type: 'b', x: 30, y: 2 },
      { type: 's', x: 31, y: 0 }, // Spike under stair
      { type: 'b', x: 34, y: 1 },
      { type: 'b', x: 35, y: 0 },
      
      // Jump pad introduction
      { type: 's', x: 40, y: 0 },
      { type: 's', x: 41, y: 0 },
      { type: 'p', x: 39, y: 0 }, // Jump pad to clear them
      
      // High platforms
      { type: 'b', x: 45, y: 3 },
      { type: 'b', x: 46, y: 3 },
      { type: 'b', x: 47, y: 3 },
      { type: 's', x: 46, y: 4 }, // Spike on high platform
      
      // Jump rings
      { type: 'r', x: 53, y: 2 }, // Ring in mid air
      { type: 's', x: 53, y: 0 },
      { type: 's', x: 54, y: 0 },
      
      // Floating blocks
      { type: 'b', x: 58, y: 2 },
      { type: 'b', x: 59, y: 2 },
      { type: 'b', x: 62, y: 3 },
      { type: 'b', x: 63, y: 3 },
      { type: 's', x: 65, y: 0 },
      
      // Final run
      { type: 'b', x: 70, y: 0 },
      { type: 's', x: 71, y: 1 },
      { type: 'b', x: 74, y: 1 },
      { type: 'b', x: 75, y: 1 },
      { type: 's', x: 77, y: 0 },
      { type: 's', x: 82, y: 0 },
      { type: 's', x: 83, y: 0 }
    ],
    length: 90 // Finish line column
  },
  {
    name: "Neon Jump",
    difficulty: "Normal",
    bgClass: "bg-neon",
    bgColor: "#1e1b4b", // Dark Violet/Indigo
    accentColor: "#ec4899", // Neon Pink
    floorColor: "#311042",
    musicIdx: 1,
    speed: 7.2,
    objects: [
      // Intro jumps
      { type: 's', x: 8, y: 0 },
      { type: 'b', x: 12, y: 0 },
      { type: 'b', x: 13, y: 1 },
      { type: 's', x: 14, y: 0 },
      
      // High jump pad action
      { type: 'p', x: 18, y: 0 },
      { type: 'b', x: 21, y: 3 },
      { type: 'b', x: 22, y: 3 },
      { type: 's', x: 23, y: 3 }, // Spike on high block
      { type: 'b', x: 24, y: 3 },
      
      // Mid-air rings sequence
      { type: 'r', x: 30, y: 2 },
      { type: 'r', x: 34, y: 4 },
      { type: 'b', x: 37, y: 3 },
      { type: 's', x: 37, y: 0 },
      { type: 's', x: 38, y: 0 },
      
      // Ship Mode Portal introduction!
      { type: 'portal_ship', x: 44, y: 2 },
      
      // Ship obstacles (spikes on ceiling and floor)
      { type: 's', x: 50, y: 0 },
      { type: 's', x: 50, y: 8 }, // Ceiling spike (assuming ceiling around y=8)
      { type: 's', x: 54, y: 2 },
      { type: 's', x: 58, y: 6 },
      
      // Tunnel to fly through
      { type: 'b', x: 62, y: 0 }, { type: 'b', x: 62, y: 7 },
      { type: 'b', x: 63, y: 0 }, { type: 'b', x: 63, y: 7 },
      { type: 'b', x: 64, y: 0 }, { type: 'b', x: 64, y: 7 },
      { type: 'b', x: 65, y: 0 }, { type: 'b', x: 65, y: 7 },
      { type: 's', x: 67, y: 4 }, // spike floating in the middle
      
      { type: 'b', x: 70, y: 1 }, { type: 'b', x: 70, y: 6 },
      { type: 'b', x: 71, y: 1 }, { type: 'b', x: 71, y: 6 },
      
      // Ship Mode Portal back to Cube!
      { type: 'portal_cube', x: 78, y: 2 },
      
      // Platforming finish
      { type: 's', x: 84, y: 0 },
      { type: 'b', x: 88, y: 1 },
      { type: 'p', x: 88, y: 2 }, // Pad on block!
      { type: 'b', x: 92, y: 5 },
      { type: 's', x: 92, y: 6 },
      { type: 'b', x: 96, y: 2 },
      { type: 's', x: 100, y: 0 },
      { type: 's', x: 101, y: 0 },
      { type: 's', x: 102, y: 0 }
    ],
    length: 112
  },
  {
    name: "Super Dash",
    difficulty: "Difícil",
    bgClass: "bg-super",
    bgColor: "#022c22", // Emerald Dark Green
    accentColor: "#10b981", // Emerald Neon Green
    floorColor: "#064e3b",
    musicIdx: 2,
    speed: 8.5, // Very fast!
    objects: [
      // High speed spikes
      { type: 's', x: 8, y: 0 },
      { type: 's', x: 13, y: 0 },
      { type: 's', x: 18, y: 0 },
      
      // Fast drop/pads
      { type: 'p', x: 22, y: 0 },
      { type: 'b', x: 25, y: 4 },
      { type: 's', x: 26, y: 0 },
      { type: 's', x: 27, y: 0 },
      
      // Dual rings
      { type: 'r', x: 31, y: 3 },
      { type: 'r', x: 34, y: 1 },
      { type: 's', x: 35, y: 0 },
      { type: 'b', x: 38, y: 2 },
      { type: 'b', x: 39, y: 2 },
      
      // Precision jumps
      { type: 's', x: 40, y: 3 }, // Spike on the blocks!
      { type: 'b', x: 43, y: 1 },
      { type: 's', x: 44, y: 2 },
      { type: 'b', x: 47, y: 3 },
      { type: 'r', x: 50, y: 5 },
      { type: 'b', x: 53, y: 4 },
      { type: 's', x: 54, y: 5 },
      
      // Ship transition
      { type: 'portal_ship', x: 58, y: 3 },
      
      // Tough flying maze
      { type: 's', x: 64, y: 1 },
      { type: 's', x: 67, y: 7 },
      { type: 'b', x: 70, y: 4 }, // block in mid-air to dodge
      { type: 's', x: 70, y: 5 }, // spike on top of block
      { type: 's', x: 70, y: 3 }, // spike on bottom of block
      
      { type: 'b', x: 76, y: 0 }, { type: 'b', x: 76, y: 8 },
      { type: 'b', x: 77, y: 0 }, { type: 'b', x: 77, y: 8 },
      { type: 's', x: 77, y: 1 },
      { type: 's', x: 77, y: 7 },
      
      // Narrow passage
      { type: 'b', x: 82, y: 3 }, { type: 'b', x: 82, y: 5 },
      { type: 'b', x: 83, y: 3 }, { type: 'b', x: 83, y: 5 },
      { type: 'b', x: 84, y: 3 }, { type: 'b', x: 84, y: 5 },
      
      // Return to cube
      { type: 'portal_cube', x: 90, y: 3 },
      
      // Final intensive jumping
      { type: 's', x: 96, y: 0 },
      { type: 'b', x: 100, y: 0 },
      { type: 's', x: 101, y: 1 },
      { type: 'b', x: 104, y: 2 },
      { type: 'r', x: 107, y: 3 },
      { type: 's', x: 109, y: 0 },
      { type: 'p', x: 112, y: 0 },
      { type: 'b', x: 115, y: 5 },
      { type: 's', x: 116, y: 6 },
      { type: 'b', x: 119, y: 3 },
      { type: 's', x: 122, y: 0 },
      { type: 's', x: 123, y: 0 },
      { type: 's', x: 124, y: 0 },
      { type: 's', x: 125, y: 0 } // Quadruple spikes!
    ],
    length: 135
  }
];

window.LEVELS = LEVELS;