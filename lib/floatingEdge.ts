// Geometry for "floating" edges: instead of anchoring a connection to a fixed
// handle side, compute where the line between two node centers crosses each
// node's rectangle boundary. This keeps connections clean no matter where a
// node is placed relative to the other, similar to Excalidraw arrows.
import { Position } from "reactflow";

interface FloatingNode {
  positionAbsolute: { x: number; y: number };
  width: number;
  height: number;
}

function getNodeIntersection(intersectionNode: FloatingNode, targetNode: FloatingNode) {
  const { width, height, positionAbsolute } = intersectionNode;
  const w = width / 2;
  const h = height / 2;

  const x2 = positionAbsolute.x + w;
  const y2 = positionAbsolute.y + h;
  const x1 = targetNode.positionAbsolute.x + targetNode.width / 2;
  const y1 = targetNode.positionAbsolute.y + targetNode.height / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;

  return {
    x: w * (xx3 + yy3) + x2,
    y: h * (-xx3 + yy3) + y2,
  };
}

function getEdgePosition(node: FloatingNode, intersectionPoint: { x: number; y: number }) {
  const nx = Math.round(node.positionAbsolute.x);
  const ny = Math.round(node.positionAbsolute.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) return Position.Left;
  if (px >= nx + node.width - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  if (py >= ny + node.height - 1) return Position.Bottom;
  return Position.Top;
}

export function getFloatingEdgeParams(source: FloatingNode, target: FloatingNode) {
  const sourceIntersection = getNodeIntersection(source, target);
  const targetIntersection = getNodeIntersection(target, source);

  return {
    sx: sourceIntersection.x,
    sy: sourceIntersection.y,
    tx: targetIntersection.x,
    ty: targetIntersection.y,
    sourcePos: getEdgePosition(source, sourceIntersection),
    targetPos: getEdgePosition(target, targetIntersection),
  };
}
