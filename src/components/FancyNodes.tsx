import { useEffect, useRef } from "preact/hooks";

const NODE_COUNT = 25;
const LINE_COUNT = 35;
const MIN_RADIUS = 15;
const MAX_RADIUS = 25;
const MIN_VELOCITY = 0.05;
const MAX_VELOCITY = 0.1;
const COLOR = "rgba(0,0,0,0.1)";

type Node = {
  id: string;
  x: number;
  y: number;
  v: number; // Velocity
  direction: number; // Direction in radians
  radius: number;
};

const generateRandomNode = (maxX: number, maxY: number): Node => ({
  id: `node-${Math.random().toString(36).substr(2, 9)}`,
  x: Math.random() * maxX,
  y: Math.random() * maxY,
  radius: Math.random() * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS,
  v: Math.random() * (MAX_VELOCITY - MIN_VELOCITY) + MIN_VELOCITY,
  direction: Math.random() * 2 * Math.PI,
});

const generateInitialNodes = (maxX: number, maxY: number) =>
  Array.from({ length: NODE_COUNT }, () => generateRandomNode(maxX, maxY));

const generateIncomingNode = (canvas: HTMLCanvasElement): Node => {
  const node = generateRandomNode(canvas.width, canvas.height);

  // Position the incoming node at the edge of the canvas based on its direction
  if (node.direction < Math.PI / 4 || node.direction > (Math.PI * 7) / 4) {
    // Left edge
    node.x = -node.radius;
    node.y = Math.random() * canvas.height;
  } else if (node.direction < (Math.PI * 3) / 4) {
    // Top edge
    node.x = Math.random() * canvas.width;
    node.y = -node.radius;
  } else if (node.direction < (Math.PI * 5) / 4) {
    // Right edge
    node.x = canvas.width + node.radius;
    node.y = Math.random() * canvas.height;
  } else {
    // Bottom edge
    node.x = Math.random() * canvas.width;
    node.y = canvas.height + node.radius;
  }
  return node;
};

const addIncomingNodes = (canvas: HTMLCanvasElement, nodes: Node[]) => [
  ...nodes,
  ...Array.from({ length: NODE_COUNT - nodes.length }, () =>
    generateIncomingNode(canvas),
  ),
];

const resize = (canvas: HTMLCanvasElement, nodes: Node[]) => {
  const previousWidth = canvas.width;
  const previousHeight = canvas.height;
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;
  canvas.width = newWidth;
  canvas.height = newHeight;

  // Adjust node positions based on the new canvas size
  nodes.forEach((node) => {
    node.x = (node.x / previousWidth) * newWidth;
    node.y = (node.y / previousHeight) * newHeight;
  });
};

const drawNodes = (ctx: CanvasRenderingContext2D, nodes: any[]) => {
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLOR;
    ctx.fill();
    ctx.closePath();
  });
};

type DistancePair = {
  nodeA: Node;
  nodeB: Node;
  distance: number;
};

const drawLines = (ctx: CanvasRenderingContext2D, nodes: Node[]) => {
  const distances: DistancePair[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];
      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      distances.push({ nodeA, nodeB, distance });
    }
  }

  distances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, LINE_COUNT)
    .forEach(({ nodeA, nodeB }) => {
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.closePath();
    });
};

const moveNodes = (nodes: Node[]) =>
  nodes.map((node) => {
    // Update position based on velocity and direction
    node.x += node.v * Math.cos(node.direction);
    node.y += node.v * Math.sin(node.direction);
    return node;
  });

const removeOutOfBoundsNodes = (canvas: HTMLCanvasElement, nodes: Node[]) =>
  nodes.filter((node) => {
    const radius = node.radius;
    return (
      node.x + radius > 0 &&
      node.x - radius < canvas.width &&
      node.y + radius > 0 &&
      node.y - radius < canvas.height
    );
  });

const animate = (canvas: HTMLCanvasElement, nodes: Node[]) => {
  resize(canvas, nodes);
  nodes = moveNodes(nodes);
  nodes = removeOutOfBoundsNodes(canvas, nodes);
  nodes = addIncomingNodes(canvas, nodes);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawNodes(ctx, nodes);
  drawLines(ctx, nodes);
  requestAnimationFrame(() => animate(canvas, nodes));
};

export const FancyNodes = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const nodes = generateInitialNodes(300, 150);
    requestAnimationFrame(() => animate(canvas, nodes));
  }, []);

  return <canvas ref={canvasRef} />;
};
