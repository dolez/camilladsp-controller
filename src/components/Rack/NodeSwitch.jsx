import { h } from "preact";
import { Switch } from "../ui/Switch";

export function NodeSwitch({ isProcessing, onToggle, disabled }) {
  return (
    <Switch
      checked={isProcessing}
      onCheckedChange={onToggle}
      disabled={disabled}
      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-zinc-700"
    />
  );
}
