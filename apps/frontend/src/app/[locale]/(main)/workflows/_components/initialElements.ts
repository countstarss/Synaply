import { Node, Edge, MarkerType } from "reactflow";
import { CustomNodeData } from "@/components/workflow/CustomNode";

export const initialNodes: Node<CustomNodeData>[] = [
  {
    id: "1",
    type: "custom",
    position: { x: 100, y: 100 },
    data: { label: "Product manager", role: "product", color: "blue" },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 300, y: 50 },
    data: { label: "UI designer", role: "ui", color: "purple" },
  },
  {
    id: "3",
    type: "custom",
    position: { x: 300, y: 150 },
    data: { label: "Backend engineer", role: "backend", color: "orange" },
  },
  {
    id: "4",
    type: "custom",
    position: { x: 500, y: 100 },
    data: { label: "Frontend engineer", role: "frontend", color: "green" },
  },
  {
    id: "5",
    type: "custom",
    position: { x: 700, y: 100 },
    data: { label: "QA engineer", role: "test", color: "red" },
  },
];

export const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
];
