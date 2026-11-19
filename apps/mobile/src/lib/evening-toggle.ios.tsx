import React from "react";
import { Host, Toggle } from "@expo/ui/swift-ui";
export function EveningToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}): React.JSX.Element {
  return (
    <Host style={{ height: 48, width: "100%" }}>
      <Toggle
        label="Evening review · 20:00"
        systemImage="moon.stars.fill"
        isOn={value}
        onIsOnChange={onChange}
      />
    </Host>
  );
}
