import { useContext } from "react";
import { camillaState } from "../components/camilla-websocket";
import { MockContext } from "../stories/mocks/MockContext";

export function useNodeMetrics(node) {
  // Vérifie si nous sommes dans un contexte de mock (Storybook)
  const mockContext = useContext(MockContext);
  if (mockContext?.useNodeMetrics) {
    return mockContext.useNodeMetrics(node);
  }

  // Comportement normal
  if (!node?.address) {
    return {};
  }

  return camillaState.value.nodeMetrics.get(node.address) || {};
}
