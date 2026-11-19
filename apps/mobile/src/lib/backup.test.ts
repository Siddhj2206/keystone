/* eslint-disable import/first */
jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
jest.mock("expo-file-system", () => ({}));
import { backupDue, backupJson, parseBackup } from "./backup";
const now = new Date("2026-11-19T10:00:00Z");
test("backup is due weekly", () => {
  expect(backupDue(undefined, now)).toBe(true);
  expect(backupDue("2026-11-15T10:00:00Z", now)).toBe(false);
  expect(backupDue("2026-11-12T10:00:00Z", now)).toBe(true);
});
test("round-trips an export and drops metadata", () => {
  const data = { tasks: [{ id: "t", title: "Lab" }], goals: [{ id: "g", title: "Sem" }], captures: [], morning: "09:00" } as never;
  const back = parseBackup(backupJson(data, now));
  expect(back).toEqual(data);
  expect(back).not.toHaveProperty("version");
});
test("accepts v1 exports without captures", () => {
  expect(parseBackup(JSON.stringify({ version: 1, tasks: [], goals: [] })).captures).toEqual([]);
});
test.each(["{}", "[]", JSON.stringify({ tasks: [{}], goals: [] }), JSON.stringify({ tasks: [], goals: [{ id: 1 }] })])(
  "rejects %s",
  (json) => expect(() => parseBackup(json)).toThrow(),
);
