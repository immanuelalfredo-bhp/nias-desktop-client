import { ipcMain, dialog } from 'electron';
import ExcelJS from 'exceljs';

export function registerExportIpcHandlers(userDb: any) {
  ipcMain.handle('export:request', async () => {
    try {
      // 1. Fetch data from DB
      const items = userDb.requestItem.listWithInfo();

      // 2. Create Workbook and Worksheet
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Request Export');

      // 3. Define Column Widths (A to J)
      sheet.columns = [
        { width: 20 }, // A: Part Number
        { width: 60 }, // B: Description
        { width: 10 }, // C: Brand
        { width: 15 }, // D: Category
        { width: 20 }, // E: Vendor
        { width: 5 },  // F: Qty
        { width: 5 },  // G: Vol
        { width: 12 }, // H: Unit Price
        { width: 12 }, // I: Total Price
        { width: 5 }   // J: SO#
      ];

      // 4. Define Headers
      const headers = [
        'Part Number',
        'Description',
        'Brand',
        'Category',
        'Vendor',
        'Qty',
        'Vol',
        'Unit Price',
        'Total Price',
        'SO#'
      ];

      // 5. Add Header Row
      const headerRow = sheet.addRow(headers);
      headerRow.height = 12.00;

      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 9, bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC000' } // #FFC000 Gold/Yellow
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // 6. Add Data Rows
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const row = sheet.addRow([
            item.skuCode || '',             // Part Number
            item.variantName || '',         // Description
            item.brandName || '',           // Brand
            item.categoryName || '',        // Category
            '',                             // Vendor
            item.quantity ?? '',            // Qty
            item.uomSymbol || '',           // Vol
            '',                             // Unit Price
            '',                             // Total Price
            ''                              // SO#
          ]);
          row.height = 12.00;
        });
      }

      // 7. Apply fonts, borders, and row height to all rows in the sheet
      const totalRows = sheet.rowCount;
      for (let r = 1; r <= totalRows; r++) {
        const row = sheet.getRow(r);
        row.height = 12.00; // Ensure every row is strictly 12 height

        for (let c = 1; c <= headers.length; c++) {
          const cell = row.getCell(c);
          const isHeader = r === 1;

          cell.font = {
            name: 'Calibri',
            size: 9,
            bold: isHeader
          };

          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }

      // 8. Prompt user for save location
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export Request',
        defaultPath: 'Request_Export.xlsx',
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      // 9. Write file to disk
      await workbook.xlsx.writeFile(filePath);
      return { success: true, filePath };

    } catch (error) {
      console.error('Failed to export request Excel:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}