/***************************************************
 * KONFIGURASI UTAMA
 * https://docs.google.com/spreadsheets/d/1EZ5FHC37BYuxzXVSdDlH2WS1pw3-POQFyw1HLP8lhdE/edit?usp=sharing
 ***************************************************/
const SPREADSHEET_ID    = "1EZ5FHC37BYuxzXVSdDlH2WS1pw3-POQFyw1HLP8lhdE"; // ID spreadsheet utama
const SHEET_NAME        = "Sultra";       // nama sheet utama
const jumlahBarisHeader = 3;              // jumlah baris header (multi-baris)
const barisAwalData     = 8;              // baris pertama data setelah header
const dataRange         = "B6:AN";         // range data (sesuaikan kolom)
const KolomID           = 6;              // kolom ID (1 = kolom A)

/***************************************************
 * KONFIGURASI DROPDOWN
 * https://docs.google.com/spreadsheets/d/1VwtAgdpz7Krs982v2uanzO_yXQMMdhufYR49VSA0was/edit?usp=sharing
 ***************************************************/
const ssDropdown_ID     = "1VwtAgdpz7Krs982v2uanzO_yXQMMdhufYR49VSA0was";
const sheetDropdown     = "Sheet1";
const rowHeaderDropdown = 1;

/***************************************************
 * HELPER
 ***************************************************/
function getSheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
}

function getAllValues() {
  return getSheet().getRange(dataRange).getValues();
}

/***************************************************
 * BACA DATA UTAMA
 ***************************************************/
function readAll() {
  const values = getAllValues();

  // semua baris header sebagai fields (multi-baris)
  const fields = values.slice(0, jumlahBarisHeader);

  // ambil data mulai barisAwalData
  const records = values
    .slice(barisAwalData - 1)
    .filter(row => row.filter(String).length); // buang baris kosong

  return { fields, records };
}

/***************************************************
 * CRUD DATA
 ***************************************************/
function createData(payload) {
  const sh = getSheet();
  const fieldHeaders = getAllValues()[jumlahBarisHeader - 1]; // baris header terakhir

  // generate ID jika tidak diisi
  if (!payload[fieldHeaders[KolomID - 1]]) {
    payload[fieldHeaders[KolomID - 1]] = Date.now().toString();
  }

  // cek ID duplikat
  const allValues = getAllValues().slice(barisAwalData - 1);
  const newID = payload[fieldHeaders[KolomID - 1]];
  const duplicate = allValues.some(r => r[KolomID - 1] == newID);
  if (duplicate) {
    return { status: "error", message: "ID sudah ada, tidak boleh duplikat" };
  }

  const newRow = fieldHeaders.map(h => payload[h] || "");
  sh.appendRow(newRow);
  return { status: "success", message: "Row added" };
}

function updateData(id, payload) {
  const sh = getSheet();
  const values = getAllValues();
  const fieldHeaders = values[jumlahBarisHeader - 1];

  for (let r = barisAwalData - 1; r < values.length; r++) {
    if (values[r][KolomID - 1] == id) {

      // cek jika user mengganti ID
      const idKey = fieldHeaders[KolomID - 1];
      const newID = payload[idKey] ?? id;
      if (newID !== id) {
        const duplicate = values
          .slice(barisAwalData - 1)
          .some((row, idx) =>
            row[KolomID - 1] == newID && (barisAwalData - 1 + idx) !== r
          );
        if (duplicate) {
          return { status: "error", message: "Update gagal: ID baru sudah dipakai baris lain" };
        }
      }

      const row = fieldHeaders.map(
        h => payload[h] ?? values[r][fieldHeaders.indexOf(h)]
      );
      sh.getRange(r + 1, 1, 1, row.length).setValues([row]);
      return { status: "success", message: "Row updated" };
    }
  }
  return { status: "error", message: "ID not found" };
}

function deleteData(id) {
  const sh = getSheet();
  const values = getAllValues();
  for (let r = barisAwalData - 1; r < values.length; r++) {
    if (values[r][KolomID - 1] == id) {
      sh.deleteRow(r + 1);
      return { status: "success", message: "Row deleted" };
    }
  }
  return { status: "error", message: "ID not found" };
}

/***************************************************
 * BACA DATA DROPDOWN (SEMUA FIELD & RECORDS)
 ***************************************************/
function readDropdown() {
  const sh = SpreadsheetApp.openById(ssDropdown_ID).getSheetByName(sheetDropdown);
  const values = sh.getDataRange().getValues();
  
  if (values.length < rowHeaderDropdown) {
    return { status: "error", message: "No data in dropdown sheet" };
  }

  // fields = header (gunakan semua baris header dropdown)
  const fields = values.slice(0, rowHeaderDropdown);

  // records = semua data setelah header, buang baris kosong
  const records = values
    .slice(rowHeaderDropdown)
    .filter(row => row.filter(String).length);

  return { fields, records };
}

/***************************************************
 * API ENDPOINT
 ***************************************************/
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const actions = {
      read:     () => readAll(),
      create:   () => createData(req.payload || {}),
      update:   () => updateData(req.id, req.payload || {}),
      delete:   () => deleteData(req.id),
      dropdown: () => readDropdown()
    };

    const result = actions[req.action]
      ? actions[req.action]()
      : { status: "error", message: "Invalid action" };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
