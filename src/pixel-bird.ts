import kaboom from "kaboom";

kaboom({
  width: 320,
  height: 240,
  scale: 2,
  font: "sink",
  background: [41, 173, 255],
});

loadSound("music", "music.wav");

loadSprite("background", "bg.png");
loadSprite("floor", "floor.png");
loadSprite("pillar", "pillar.png");
loadSprite("bird", "bird.png", {
  sliceX: 3,
  sliceY: 1,
  anims: {
    flapping: { from: 0, to: 2 },
  },
});

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Layers
 */

const FLOOR_HEIGHT = height() / 8;

function scenery() {
  layers(["bg", "mg", "fg", "ui"], "fg");
  /**
   * Background
   */
  add([
    layer("bg"),
    sprite("background", { width: width(), height: height() }),
    pos(0, 0),
  ]);

  /**
   * Floor
   */
  add([
    "floor",
    "surface",
    area(),
    layer("fg"),
    solid(),
    sprite("floor", { width: width(), height: FLOOR_HEIGHT }),
    pos(0, height() - FLOOR_HEIGHT),
  ]);
}

scene("menu", () => {
  scenery();

  add([rect(width() - 50, 120), color(0, 0, 0), opacity(0.2), pos(25, 25)]);

  add([
    text(`Pixel Bird`, { size: 34 }),
    pos(width() / 2, 60),
    (origin as any)("center"),
  ]);

  add([
    text("Press [Space] to play", { size: 16 }),
    pos(width() / 2, height() / 2),
    area({ cursor: "pointer" }),
    (origin as any)("center"),
  ]);

  setTimeout(() => {
    onKeyPress("space", () => {
      go("game");
    });
  }, 500);
});

scene("game-over", () => {
  scenery();
  add([rect(width() - 50, 120), color(0, 0, 0), opacity(0.2), pos(25, 25)]);

  add([
    text(`Game Over`, { size: 32 }),
    pos(width() / 2, 60),
    layer("ui"),
    (origin as any)("center"),
  ]);

  add([
    text("Press [Space] to play", { size: 16 }),
    pos(width() / 2, height() / 2),
    area({ cursor: "pointer" }),
    layer("ui"),
    (origin as any)("center"),
  ]);

  onKeyPress("space", () => {
    go("game");
  });
});

scene("game", () => {
  scenery();

  const music = play("music", {
    volume: 0.6,
    loop: true,
  });

  /**
   * Bird
   */
  const BIRD_WIDTH = 50 * 0.8;
  const BIRD_HEIGHT = 28 * 0.8;
  const bird = add([
    "bird",
    area({ width: BIRD_WIDTH, height: BIRD_HEIGHT }),
    sprite("bird", { width: BIRD_WIDTH, height: BIRD_HEIGHT }),
    pos(width() / 2, height() / 3),
    (origin as any)("center"),
    body({ weight: 1, maxVel: 120, jumpForce: 300 }),
    {
      isAlive: true,
      bounceSpeed: 70,
      fallSpeed: 30,
    },
  ]);

  bird.onUpdate(() => {
    bird.pos.y = clamp(bird.pos.y, 0, height());

    if (!bird.isAlive && !bird.isGrounded()) {
      bird.move(-bird.bounceSpeed, bird.fallSpeed);
    }
  });

  loop(0.2, () => {
    if (bird.isAlive) {
      bird.play("flapping");
    }
  });

  bird.onCollide("surface", () => {
    bird.isAlive = false;
    bird.frame = 2;
    music.stop();
    setTimeout(() => {
      go("game-over");
    }, 1000);
  });

  /**
   * Score
   */
  const score = add([
    "score",
    layer("ui"),
    text("Score: 0", { size: 12 }),
    pos(10, 10),
    {
      count: 0,
    },
  ]);

  score.onUpdate(() => {
    score.text = `Score: ${score.count}`;
  });

  /**
   * Pillars
   */
  const PILLAR_GAP = 80;
  const INITIAL_PILLAR_SPEED = 90;
  const PILLAR_SPEED_INCREMENT = 0.5;
  function producePillars() {
    const offset = rand(-15, 15);

    add([
      sprite("pillar", { width: 60, height: height() }),
      layer("mg"),
      pos(width(), height() / 2 + offset + PILLAR_GAP / 2),
      "pillar",
      "surface",
      area(),
      {
        speed: INITIAL_PILLAR_SPEED,
      },
    ]);

    add([
      sprite("pillar", { flipY: true, width: 60, height: height() }),
      layer("mg"),
      pos(width(), height() / 2 + offset - PILLAR_GAP / 2),
      (origin as any)("botleft"),
      "pillar",
      "surface",
      area(),
      {
        speed: INITIAL_PILLAR_SPEED,
      },
    ]);

    add([
      "scoreZone",
      pos(width() + 60, 0),
      area(),
      rect(0, height()),
      layer("bg"),
      {
        speed: INITIAL_PILLAR_SPEED,
      },
    ]);
  }

  onUpdate("pillar", (pillar) => {
    if (bird.isAlive) {
      pillar.move(-pillar.speed, 0);

      if (pillar.pos.x + pillar.width < 0) {
        destroy(pillar);
      }
    }
  });

  onUpdate("scoreZone", (pillar) => {
    if (bird.isAlive) {
      pillar.move(-pillar.speed, 0);

      if (pillar.pos.x + pillar.width < 0) {
        destroy(pillar);
      }
    }
  });

  bird.onCollide("scoreZone", () => {
    score.count++;
    get("pillar").forEach((p) => (p.speed += PILLAR_SPEED_INCREMENT));
    get("scoreZone").forEach((p) => (p.speed += PILLAR_SPEED_INCREMENT));
  });

  const pillarGenerator = loop(2.5, () => {
    if (bird.isAlive) {
      producePillars();
    } else {
      pillarGenerator();
    }
  });

  /**
   * User Input
   */
  onClick(() => {
    if (bird.isAlive) {
      bird.jump();
    }
  });

  onKeyPress("up", () => {
    if (bird.isAlive) {
      bird.jump();
    }
  });

  onKeyPress("space", () => {
    if (bird.isAlive) {
      bird.jump();
    }
  });
});

go("menu");
