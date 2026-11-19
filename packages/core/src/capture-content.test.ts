import { hasCaptureContent,localOrganize,organize,Capture } from './index';
const capture=(text:string):Capture=>({id:'c',text,source:'text',createdAt:new Date().toISOString(),processed:false});
test.each(['?!?!','   ','\n;,-•','😀✨','\u200b'])('rejects empty/garbage capture %j',async text=>{
 expect(hasCaptureContent(text)).toBe(false);expect(localOrganize(capture(text),[]).tasks).toEqual([]);global.fetch=jest.fn();expect((await organize(capture(text),[],'key')).tasks).toEqual([]);expect(fetch).not.toHaveBeenCalled();
});
test.each(['123','买牛奶','पढ़ाई','read!'])('accepts letters and digits across languages: %s',text=>{expect(hasCaptureContent(text)).toBe(true);expect(localOrganize(capture(text),[]).tasks).toHaveLength(1);});
test('drops only punctuation-only chunks in a mixed dump',()=>{expect(localOrganize(capture('buy milk\n?!?!\n😀\npractice leetcode'),[]).tasks.map(t=>t.title)).toEqual(['Buy milk','Practice leetcode']);});
