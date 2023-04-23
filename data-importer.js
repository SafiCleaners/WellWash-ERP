const workbook = xlsx.readFile('/home/njoki/Desktop/excel/excel/workers.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);
res.json(data);