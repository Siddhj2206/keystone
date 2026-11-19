import * as Notifications from 'expo-notifications';
import { scheduleReminders } from './reminders';
jest.mock('react-native',()=>({Platform:{OS:'ios'}}));
jest.mock('expo-notifications',()=>({getPermissionsAsync:jest.fn(),requestPermissionsAsync:jest.fn(),cancelAllScheduledNotificationsAsync:jest.fn(),scheduleNotificationAsync:jest.fn(),SchedulableTriggerInputTypes:{DAILY:'daily',DATE:'date'}}));
beforeEach(()=>{jest.clearAllMocks();(Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({granted:true});(Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({granted:true});});
test('overlapping schedules are serialized with stable identifiers and latest content',async()=>{
 const active=new Map();let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});let first=true;
 (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockImplementation(async()=>active.clear());
 (Notifications.scheduleNotificationAsync as jest.Mock).mockImplementation(async request=>{if(first){first=false;await gate;}active.set(request.identifier,request);});
 const one=scheduleReminders([],'09:00',true);const two=scheduleReminders([],'10:30',false,true);
 await Promise.resolve();await Promise.resolve();await Promise.resolve();expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);release();await Promise.all([one,two]);
 expect([...active.keys()]).toEqual(['keystone-morning']);expect(active.get('keystone-morning').trigger).toMatchObject({hour:10,minute:30});
});
test('denied permissions do not cancel reminders and a failure does not poison the queue',async()=>{
 (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({granted:false});expect(await scheduleReminders([],'09:00',false)).toBe(false);expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
 (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValueOnce(Error('native failure'));await expect(scheduleReminders([],'09:00',false)).rejects.toThrow('native failure');
 (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('id');expect(await scheduleReminders([],'09:00',false)).toBe(true);
});
test('task reminders use the task id and completed tasks are excluded',async()=>{
 const task={id:'t',title:'Read',notes:'',area:'skills' as const,priority:2,minutes:20,captureId:'c',status:'todo' as const,dueDate:new Date(Date.now()+86400000).toISOString()};
 await scheduleReminders([task,{...task,id:'done',status:'done'}],'09:00',false);
 expect((Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(([r])=>r.identifier)).toEqual(['keystone-morning','keystone-task-t']);
});
