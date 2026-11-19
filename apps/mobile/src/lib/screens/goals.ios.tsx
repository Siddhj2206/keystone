import React, { useState } from "react";
import { PlatformColor, Pressable } from "react-native";
import { router, Stack } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Button, HStack, Image, List, Section, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { buttonStyle, contentShape, font, foregroundStyle, frame, listStyle, padding, shapes } from "@expo/ui/swift-ui/modifiers";
import { accent, NativeHost, secondary } from "../native-ui";
import { goalAreaAppearance, GoalEditorSheet, GoalProgress, horizonName } from "../native-goal";
import { useStore } from "../store";

export default function Goals(): React.JSX.Element {
  const { data, save } = useStore();
  const [adding, setAdding] = useState(false);
  return (
    <>
      <Stack.Screen options={{
        headerRight: () => (
          <Pressable accessibilityRole="button" accessibilityLabel="Add goal" onPress={() => setAdding(true)} hitSlop={9} style={{ minWidth: 34, minHeight: 32, alignItems: "center", justifyContent: "center" }}>
            <SymbolView name="plus" tintColor={accent} size={20} />
          </Pressable>
        ),
      }} />
      <NativeHost>
        <List modifiers={[listStyle("insetGrouped")]}>
          {(["short", "long"] as const).map((horizon) => {
            const goals = data.goals.filter((goal) => goal.horizon === horizon);
            return (
              <Section key={horizon} title={horizonName[horizon]}>
                {goals.length ? goals.map((goal) => {
                  const [symbol, color] = Object.prototype.hasOwnProperty.call(goalAreaAppearance, goal.area)
                    ? goalAreaAppearance[goal.area] : goalAreaAppearance.other;
                  return (
                    <Button key={goal.id} onPress={() => router.push({ pathname: "/goals/[goalId]", params: { goalId: goal.id } })} modifiers={[buttonStyle("plain")]}>
                      <HStack spacing={12} modifiers={[padding({ vertical: 9 }), frame({ maxWidth: Infinity, alignment: "leading" }), contentShape(shapes.rectangle())]}>
                        <Image systemName={symbol} color={PlatformColor(color)} size={20} modifiers={[frame({ width: 28 })]} />
                        <VStack alignment="leading" spacing={3}>
                          <Text modifiers={[font({ textStyle: "headline" })]}>{goal.title}</Text>
                          <GoalProgress tasks={data.tasks.filter((task) => task.goalId === goal.id)} />
                        </VStack>
                        <Spacer minLength={0} />
                        <Image systemName="chevron.right" size={11} modifiers={[foregroundStyle(secondary)]} />
                      </HStack>
                    </Button>
                  );
                }) : <Text modifiers={[foregroundStyle(secondary)]}>{`No ${horizon}-term goals yet.`}</Text>}
              </Section>
            );
          })}
        </List>
        {adding && <GoalEditorSheet onSave={(goal) => save({ ...data, goals: [...data.goals, goal] })} onClose={() => setAdding(false)} />}
      </NativeHost>
    </>
  );
}
