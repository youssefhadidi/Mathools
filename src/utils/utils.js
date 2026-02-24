import readXlsxFile from "read-excel-file";
import * as XLSX from "xlsx";

// Converts an Excel column letter (e.g. "AB") to a 0-based index
export function ExcelIdToInt(input) {
  const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const val = input.toUpperCase();
  let result = 0;
  for (let i = 0, j = val.length - 1; i < val.length; i++, j--) {
    result += Math.pow(base.length, j) * (base.indexOf(val[i]) + 1);
  }
  return result - 1;
}

export function readFile(file) {
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsArrayBuffer(file);
  });
}

// Strips all non-digit characters from a value (e.g. "12345sp" -> "12345")
const numericId = (val) => val != null ? String(val).replace(/\D/g, '') : null;

export function readRows(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

export async function mergeFiles(file1, file2, id1, id2, compareVal, retrieveId) {
  const [rows1, rows2] = await Promise.all([readXlsxFile(file1), readXlsxFile(file2)]);

  const map = {};
  const missingId = [];
  const missingId2 = [];

  const file1Ids = new Set();
  const file2Ids = new Set();

  // Index file1 rows by their numeric ID
  rows1.forEach((row, rowIndex) => {
    const key = numericId(row[id1]);
    if (key == null || key === '') {
      map[rowIndex] = { missing: true, compareVal: row[compareVal] };
    } else {
      map[key] = { current: row[compareVal] };
      file1Ids.add(key);
    }
  });

  // Match file2 rows against the map
  rows2.forEach(row => {
    const key = numericId(row[id2]);
    if (key == null || key === '') return;
    file2Ids.add(key);
    if (map[key]) {
      map[key] = { ...map[key], new: row[retrieveId] };
    } else {
      missingId.push({ id: key, value: row[retrieveId] });
    }
  });

  // file1 IDs not found in file2
  file1Ids.forEach(key => {
    if (!file2Ids.has(key)) missingId2.push(Number(key));
  });

  return { map, missingId, missingId2 };
}
