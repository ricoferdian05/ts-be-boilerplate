import XLSX from 'xlsx';
/**
 * A function for converting excel file buffer into json
 * Return an array of string array
 * @param buffer buffer of excel files from request file
 * @returns
 */
export const convertExcelBufferToJson = (buffer: Buffer): string[][] => {
  // Read the file using buffer
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
  });

  // Convert workbook into JSON format
  return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
    raw: false,
    header: 1,
    blankrows: false,
  });
};
