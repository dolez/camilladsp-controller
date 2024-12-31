import { Switch } from "./ui/Switch";
import { camillaState } from "./camilla-websocket";

export function NodeSwitch({ node }) {
  // Récupère l'état actuel des nodes sélectionnés
  const isSelected = camillaState.value.selectedNodes.has(node);

  const toggleSelection = (checked) => {
    const currentState = camillaState.value;
    const newSelectedNodes = new Set(currentState.selectedNodes);

    // Met à jour la sélection en fonction de l'état du switch
    if (checked) {
      newSelectedNodes.add(node);
    } else {
      newSelectedNodes.delete(node);
    }

    // Met à jour l'état global
    camillaState.value = {
      ...currentState,
      selectedNodes: newSelectedNodes,
    };
  };

  return (
    <Switch
      checked={isSelected}
      onCheckedChange={toggleSelection}
      aria-label={`Select ${node.name}`}
      className="data-[state=checked]:bg-blue-500"
    />
  );
}
