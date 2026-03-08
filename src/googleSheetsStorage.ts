// konwersja numeru kolumny + wiersza na A1 notation
function toA1(col: number, row: number) {
  let result = "";
  while (col > 0) {
    const rem = (col - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    col = Math.floor((col - 1) / 26);
  }
  return result + row;
}

// Aktualizacja pojedynczej komórki w zakładce config
export async function updateConfigCell(row: number, col: number, value: any) {
  const range = `${EVENTS_CONFIG_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

// Aktualizacja pojedynczej komórki w zakładce events
export async function updateEventCell(row: number, col: number, value: any) {
  const range = `${EVENTS_TAB}!${toA1(col, row)}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

// Usunięcie całego wiersza w zakładce events
export async function deleteEventRow(row: number) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0, // jeśli masz tylko jedną zakładkę events, SheetId=0
              dimension: "ROWS",
              startIndex: row - 1, // 0-indexed
              endIndex: row,
            },
          },
        },
      ],
    },
  });
}