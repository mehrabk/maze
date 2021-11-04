const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizantal = 10;
const cellsVerticl = 10;
const width = window.innerWidth;
const height = window.innerHeight;
const unitLengthX = width / cellsHorizantal;
const unitLengthY = height / cellsVerticl;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Wall
const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];

World.add(world, walls);

// Maze generation

// const shuffle = (arr) => {
//   for (let counter = arr.length - 1; counter > 0; counter--) {
//     const randomIndex = Math.floor(Math.random() * (counter + 1));
//     [arr[counter], arr[randomIndex]] = [arr[randomIndex], arr[counter]];
//   }
//   return arr;
// };

const shuffle = (arr) => {
  let counter = arr.length;
  while (counter > 0) {
    const randomIndex = Math.floor(Math.random() * counter);
    counter--;
    const temp = arr[counter];
    arr[counter] = arr[randomIndex];
    arr[randomIndex] = temp;
  }
  return arr;
};

const grid = Array(cellsVerticl)
  .fill(null)
  .map(() => Array(cellsHorizantal).fill(false));

const vertical = Array(cellsVerticl)
  .fill(null)
  .map(() => Array(cellsHorizantal - 1).fill(false));

const horizontal = Array(cellsVerticl - 1)
  .fill(null)
  .map(() => Array(cellsHorizantal).fill(false));

const startRow = Math.floor(Math.random() * cellsVerticl);
const startColumn = Math.floor(Math.random() * cellsHorizantal);

const stepThroughCell = (row, column) => {
  // if i have visited the cell at [row, column], then return.
  if (grid[row][column]) return;

  // mark this cell as being visited.
  grid[row][column] = true;

  // assemble randomly-ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);

  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;

    // see if that neighbor is out of bound
    if (
      nextRow < 0 ||
      nextRow >= cellsVerticl ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizantal
    ) {
      continue;
    }

    // check if we visited that neighbor, continue to next neighbor.
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    // Remove a wall from either horizontals or verticals
    if (direction === "up") {
      horizontal[row - 1][column] = true;
    } else if (direction === "down") {
      horizontal[row][column] = true;
    } else if (direction === "right") {
      vertical[row][column] = true;
    } else if (direction === "left") {
      vertical[row][column - 1] = true;
    }
    stepThroughCell(nextRow, nextColumn);
  }
};
stepThroughCell(startRow, startColumn);
console.log(vertical);
console.log(horizontal);

horizontal.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      5,
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "red",
        },
      }
    );
    World.add(world, wall);
  });
});

vertical.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "red",
        },
      }
    );
    World.add(world, wall);
  });
});

// Goal

const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    isStatic: true,
    label: "goal",
    render: {
      fillStyle: "green",
    },
  }
);

World.add(world, goal);

// Ball
const ball = Bodies.circle(
  unitLengthX / 2,
  unitLengthY / 2,
  Math.min(unitLengthX, unitLengthY) / 4,
  {
    label: "ball",
    render: {
      fillStyle: "blue",
    },
  }
);

World.add(world, ball);

// key press

document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;

  // up
  if (event.keyCode === 87) {
    Body.setVelocity(ball, { x, y: y - 5 });
  }

  // right
  if (event.keyCode === 68) {
    Body.setVelocity(ball, { x: x + 5, y });
  }

  // down
  if (event.keyCode === 83) {
    Body.setVelocity(ball, { x, y: y + 5 });
  }

  // left
  if (event.keyCode === 65) {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

// Win Condition
const win = Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
          document.querySelector(".winner").classList.remove("hidden");
        }
      });
    }
  });
});
