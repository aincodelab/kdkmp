// ======================= CONFIG =======================
// INPUT: https://docs.google.com/spreadsheets/d/1EZ5FHC37BYuxzXVSdDlH2WS1pw3-POQFyw1HLP8lhdE/edit?usp=sharing
// OUTPUT: https://docs.google.com/spreadsheets/d/1VwtAgdpz7Krs982v2uanzO_yXQMMdhufYR49VSA0was/edit?usp=sharing
const CONFIG = {
  INPUT: {
    ssId: "1EZ5FHC37BYuxzXVSdDlH2WS1pw3-POQFyw1HLP8lhdE",   // ID Spreadsheet sumber
    nmSheet: "Sultra",                          // Nama sheet sumber
    rwHeader: 8,                                            // No baris tempat nama header
  },
  OUTPUT: {
    ssId: "1VwtAgdpz7Krs982v2uanzO_yXQMMdhufYR49VSA0was",   // ID Spreadsheet tujuan
    nmSheet: "Sheet1",                                      // Nama sheet tujuan
  }
};
// ======================================================

function extractDropdownValues() {
  const ssInput  = SpreadsheetApp.openById(CONFIG.INPUT.ssId);
  const ssOutput = SpreadsheetApp.openById(CONFIG.OUTPUT.ssId);
  const shInput  = ssInput.getSheetByName(CONFIG.INPUT.nmSheet);
  const shOutput = ssOutput.getSheetByName(CONFIG.OUTPUT.nmSheet);

  const lastRow  = shInput.getLastRow();
  const lastCol  = shInput.getLastColumn();

  // Range semua cell + validasi
  const range    = shInput.getRange(1, 1, lastRow, lastCol);
  const rules    = range.getDataValidations();

  // Ambil header dari baris yang ditentukan
  const headers  = shInput.getRange(CONFIG.INPUT.rwHeader, 1, 1, lastCol).getValues()[0];

  // Bersihkan sheet OUTPUT
  shOutput.clear();

  let colOut = 1; // Kolom output untuk penempatan hasil
  for (let c = 0; c < lastCol; c++) {
    let dropdownValues = [];

    // cek semua baris pada kolom c
    for (let r = 0; r < lastRow; r++) {
      let rule = rules[r][c];
      if (rule) {
        const criteria = rule.getCriteriaType();
        const args = rule.getCriteriaValues();

        if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) {
          dropdownValues = dropdownValues.concat(args[0]); // array manual
        }

        if (criteria === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
          // args[0] adalah Range sumber validasi
          let values = args[0].getValues().flat().filter(String);
          dropdownValues = dropdownValues.concat(values);
        }
      }
    }

    // hanya tulis jika memang ada dropdown di kolom ini
    if (dropdownValues.length > 0) {
      let uniqueVals = [...new Set(dropdownValues.filter(String))];

      // tulis header di baris pertama output
      shOutput.getRange(1, colOut).setValue(headers[c]);

      // tulis nilai dropdown unik di bawahnya
      shOutput.getRange(2, colOut, uniqueVals.length, 1).setValues(
        uniqueVals.map(v => [v])
      );

      colOut++;
    }
  }

  Logger.log("✅ Hanya kolom dengan dropdown yang diekstrak & ditulis ke OUTPUT.");
}
