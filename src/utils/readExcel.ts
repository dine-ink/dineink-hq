import ExcelJS from "exceljs";

/**
 * Normalise an ExcelJS cell value down to a plain JS primitive.
 * ExcelJS hands back wrapper objects for formulas, rich text and hyperlinks,
 * whereas the sheet parsers we call downstream expect plain values.
 */
function cellValue(raw: unknown): string | number | boolean | Date | null {
  if (raw === null || raw === undefined) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === "object") {
    const obj = raw as Record<string, any>;
    if ("result" in obj) return cellValue(obj.result);
    if ("text" in obj) return cellValue(obj.text);
    if (Array.isArray(obj.richText)) {
      return obj.richText.map((part: any) => part?.text ?? "").join("");
    }
    if ("error" in obj) return null;
    return null;
  }
  return raw as string | number | boolean;
}

/**
 * Convert a worksheet to row objects keyed by the header row, mirroring the
 * shape `XLSX.utils.sheet_to_json` used to return: blank cells are omitted and
 * entirely blank rows are dropped.
 */
export function sheetToJson(worksheet: ExcelJS.Worksheet): Record<string, any>[] {
  const headers: string[] = [];
  const rows: Record<string, any>[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // row.values is 1-indexed; index 0 is always empty.
    const values = row.values as unknown[];

    if (rowNumber === 1) {
      for (let i = 1; i < values.length; i++) {
        const header = cellValue(values[i]);
        headers[i] = header === null ? "" : String(header).trim();
      }
      return;
    }

    const record: Record<string, any> = {};
    let hasValue = false;

    for (let i = 1; i < headers.length; i++) {
      const key = headers[i];
      if (!key) continue;

      const value = cellValue(values[i]);
      if (value === null || value === "") continue;

      record[key] = value;
      hasValue = true;
    }

    if (hasValue) rows.push(record);
  });

  return rows;
}

/** Read an .xlsx ArrayBuffer/Uint8Array into an ExcelJS workbook. */
export async function loadWorkbook(
  data: ArrayBuffer | Uint8Array
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const buffer = data instanceof Uint8Array ? data.buffer : data;
  await workbook.xlsx.load(buffer as ArrayBuffer);
  return workbook;
}
