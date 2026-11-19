import React from "react";
import { Button, DatePicker, Form, Label, LabeledContent, Section, Text, Toggle, VStack } from "@expo/ui/swift-ui";
import { datePickerStyle, font, foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import { NativeHost, NativeSecureField, secondary } from "../native-ui";
import { useRestore } from "../restore-button";
import { useSettings } from "../use-settings";

export default function Settings(): React.JSX.Element {
  const { key, time, evening, message, setMessage, saveKey, removeKey, saveReminders, exportData } = useSettings();
  const restore = useRestore(setMessage);
  const [hours, minutes] = (time || "09:00").split(":").map(Number);
  const selection = new Date();
  selection.setHours(hours, minutes, 0, 0);
  return (
    <NativeHost>
      <Form>
        <Section title="Reminders" footer={<Text>Reminders are local. Open Keystone to refresh your focus count.</Text>}>
          <DatePicker
            title="Morning check-in"
            displayedComponents={["hourAndMinute"]}
            selection={selection}
            onDateChange={(date) => {
              const morning = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
              void saveReminders({ morning });
            }}
            modifiers={[datePickerStyle("compact")]}
          />
          <Toggle isOn={evening} onIsOnChange={(evening) => void saveReminders({ evening })} label="Evening recap" />
        </Section>
        <Section title="Sorting" footer={
          <VStack alignment="leading" spacing={5}>
            {!!key && <Label title="Key saved" systemImage="checkmark.circle" />}
            <Text>On-device sorting works offline. With a Gemini key, captures and goal context are sent to Google under its data terms.</Text>
          </VStack>
        }>
          <LabeledContent label="Sorting engine"><Text>{key ? "Gemini" : "On-device"}</Text></LabeledContent>
          <NativeSecureField value={key} onCommit={(value) => void saveKey(value)} />
          {!!key && <Button label="Remove API Key" role="destructive" onPress={() => void removeKey()} />}
        </Section>
        <Section title="Data" footer={<Text>Exports don’t include your API key. Weekly backups are saved in Files › On My iPhone › Keystone.</Text>}>
          <Button label="Export Data" systemImage="square.and.arrow.up" onPress={() => void exportData()} />
          <Button label="Restore Backup" systemImage="arrow.clockwise" onPress={() => void restore()} />
        </Section>
        {!!message && <Section title="Status"><Text>{message}</Text></Section>}
        <Section title="About">
          <VStack alignment="leading" spacing={3}>
            <Text modifiers={[font({ textStyle: "headline" })]}>Keystone</Text>
            <Text modifiers={[font({ textStyle: "subheadline" }), foregroundStyle(secondary)]}>Your plans live on this device. No account required.</Text>
          </VStack>
        </Section>
      </Form>
    </NativeHost>
  );
}
