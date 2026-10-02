const xlsx = require('xlsx');

// 1. Check mapping file
const wb = xlsx.readFile('app/public/samples/thuoc_tinh_pim_cms.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);

const mappings = data.filter(r => String(r.PROPERTYID) === '8853');
console.log('Mappings for 8853:', mappings);

// 2. Check PIM file (to see if Bluetooth is inside the column)
// Since we don't have the exact user's pim file, we might not be able to read it if it's not in public/samples.
// Wait, the user said "file data cũng phải dùng chung hết", meaning they might have uploaded it to public/samples or they just upload it in the browser.
// The browser data is not available to me directly unless I check the public/samples folder.
// Let's see what's in public/samples/sp_pim.xlsx ? No, the user uploads it. But we can check what's in samples.

