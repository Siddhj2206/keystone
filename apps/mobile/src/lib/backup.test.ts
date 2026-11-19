/* eslint-disable import/first */
jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
jest.mock("expo-file-system", () => ({}));
import { backupDue, backupJson, parseBackup } from "./backup";
const now = new Date("2026-11-19T10:00:00Z");
const task={id:'t',title:'Lab',area:'academics',status:'todo',notes:'',captureId:'c',priority:2,minutes:20};
const goal={id:'g',title:'Sem',area:'academics',horizon:'short',notes:''};
const capture={id:'c',text:'Lab',source:'text',createdAt:now.toISOString(),processed:false};
test("backup is due weekly", () => {
  expect(backupDue(undefined, now)).toBe(true);
  expect(backupDue("2026-11-15T10:00:00Z", now)).toBe(false);
  expect(backupDue("2026-11-12T10:00:00Z", now)).toBe(true);
});
test("round-trips an export and drops metadata", () => {
  const data = { tasks: [task], goals: [goal], captures: [capture], morning: "09:00" } as never;
  const back = parseBackup(backupJson(data, now));
  expect(back).toEqual(data);
  expect(back).not.toHaveProperty("version");
});
test("accepts v1 exports without captures", () => {
  expect(parseBackup(JSON.stringify({ version: 1, tasks: [], goals: [] })).captures).toEqual([]);
});
test('round-trips cleared goal and optional task dates as absent dates, preserving empty notes',()=>{
 const json=backupJson({tasks:[{...task,dueDate:'',completedAt:'',checkBy:''}],goals:[{...goal,targetDate:''}],captures:[capture]} as never,now);
 const restored=parseBackup(json);expect(restored.goals[0].targetDate).toBeUndefined();expect(restored.tasks[0].dueDate).toBeUndefined();expect(restored.tasks[0].completedAt).toBeUndefined();expect(restored.tasks[0].checkBy).toBeUndefined();expect(restored.goals[0].notes).toBe('');expect(restored.tasks[0].notes).toBe('');
 expect(backupJson(restored,now)).not.toContain('"targetDate"');
});
test('valid optional dates survive normalization and invalid nonempty dates still fail',()=>{
 const targetDate='2026-11-20';expect(parseBackup(JSON.stringify({tasks:[],goals:[{...goal,targetDate}]})).goals[0].targetDate).toBe(targetDate);
 expect(()=>parseBackup(JSON.stringify({tasks:[],goals:[{...goal,targetDate:'not a date'}]}))).toThrow();
});
test.each(["{}", "[]", JSON.stringify({ tasks: [{}], goals: [] }), JSON.stringify({ tasks: [], goals: [{ id: 1 }] }), JSON.stringify({ tasks: [], goals: [{ id: "g", title: "Sem" }] })])(
  "rejects %s",
  (json) => expect(() => parseBackup(json)).toThrow(),
);
test.each([{text:{}},{text:[]},{id:0},{source:'file'},{createdAt:'yesterday'},{processed:'false'},null])('rejects damaged capture %j',fields=>{
 expect(()=>parseBackup(JSON.stringify({tasks:[],goals:[],captures:[fields===null?null:{...capture,...fields}]}))).toThrow();
});
test.each([{notes:{}},{priority:'2'},{minutes:0},{captureId:0},{dueDate:0},{dueDate:'2026-02-30'},{goalId:{}},{checkBy:false},{completedAt:'invalid'},{status:'other'},{area:'unknown'}])('rejects damaged task fields %j',fields=>{
 expect(()=>parseBackup(JSON.stringify({tasks:[{...task,...fields}],goals:[]}))).toThrow();
});
test.each([{notes:[]},{targetDate:{}},{horizon:'forever'},{area:'unknown'}])('rejects damaged goal fields %j',fields=>{
 expect(()=>parseBackup(JSON.stringify({tasks:[],goals:[{...goal,...fields}]}))).toThrow();
});
test.each([{captures:{}},{evening:'yes'},{morning:{}},{morning:'25:00'},{rules:[]},{rules:{lab:{}}},{lastBackupAt:0}])('rejects damaged collections/preferences %j',fields=>{
 expect(()=>parseBackup(JSON.stringify({tasks:[],goals:[],...fields}))).toThrow();
});
