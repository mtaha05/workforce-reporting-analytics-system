
// Set WORKFORCE_FORM_ID in Apps Script > Project Settings > Script properties.
// Do not commit the production Google Form ID.

const DIRECTORY_SETTINGS = {
  Employees: {
    prefix: "EMP",
    formQuestion: "Employee name"
  },
  Sites: {
    prefix: "SITE",
    formQuestion: "Work Location/Site"
  }
};


// ========================================
// 1. EMPLOYEE SYNCHRONISATION
// ========================================

function syncEmployeeDropdown(e) {
  syncDirectory("Employees", e);
}


// ========================================
// 2. SITE SYNCHRONISATION
// ========================================

function syncSiteDropdown(e) {
  syncDirectory("Sites", e);
}


// ========================================
// 3. MAIN SYNCHRONISATION FUNCTION
// ========================================

function syncDirectory(sheetName, e) {

  // Ignore edits outside the relevant tab
  // or outside columns A, B and C.
  if (e && e.range) {
    const edited = e.range;

    if (
      edited.getSheet().getName() !== sheetName ||
      edited.getLastRow() < 2 ||
      edited.getColumn() > 3
    ) {
      return;
    }
  }

  // Prevent overlapping updates.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error("Missing sheet tab: " + sheetName);
    }

    // G2 stores the coloured status dropdown.
    const template = sheet.getRange("G2");

    if (!template.getDataValidation()) {
      throw new Error(
        "Missing coloured dropdown template in " +
        sheetName + "!G2"
      );
    }

    const settings = DIRECTORY_SETTINGS[sheetName];
    const lastRow = sheet.getLastRow();

    // A = ID, B = Name, C = Status
    const rows = lastRow >= 2
      ? sheet.getRange(2, 1, lastRow - 1, 3)
          .getDisplayValues()
      : [];

    // Remember previously generated IDs.
    const props = PropertiesService.getScriptProperties();

    // Also read counters from the previous script.
    const previousProps =
      PropertiesService.getDocumentProperties();

    const propertyKey = "LAST_ID_" + settings.prefix;

    let highest = Math.max(
      Number(props.getProperty(propertyKey) || 0),
      Number(
        previousProps
          ? previousProps.getProperty(propertyKey) || 0
          : 0
      )
    );

    const idPattern = new RegExp(
      "^" + settings.prefix + "(\\d+)$"
    );

    // Find the highest existing ID.
    rows.forEach(row => {
      const match = String(row[0])
        .trim()
        .match(idPattern);

      if (match) {
        highest = Math.max(
          highest,
          Number(match[1])
        );
      }
    });

    const usedIds = new Set();
    const usedNames = new Set();
    const activeNames = [];

    // Process employee or site records.
    rows.forEach((row, index) => {

      const rowNumber = index + 2;

      let id = String(row[0]).trim();
      const name = String(row[1]).trim();
      let status = String(row[2])
        .trim()
        .toLowerCase();

      const statusCell = sheet.getRange(
        rowNumber, 3
      );

      // No name means no status dropdown.
      if (!name) {

        // Remove validation if this empty row
        // was just edited.
        if (
          e && e.range &&
          e.range.getRow() <= rowNumber &&
          e.range.getLastRow() >= rowNumber &&
          statusCell.getDataValidation()
        ) {
          statusCell.clearDataValidations();
        }

        return;
      }

      // Add coloured dropdown if missing.
      if (!statusCell.getDataValidation()) {

        template.copyTo(
          statusCell,
          SpreadsheetApp.CopyPasteType
            .PASTE_DATA_VALIDATION,
          false
        );

      }

      // Automatically assign Active to new records.
      if (!status) {
        statusCell.setValue("Active");
        status = "active";
      }

      // Check for a valid status.
      if (
        status !== "active" &&
        status !== "inactive"
      ) {
        throw new Error(
          "Invalid status in " +
          sheetName +
          " row " + rowNumber +
          ": " + row[2]
        );
      }

      // Check for duplicate names.
      const nameKey = name.toLowerCase();

      if (usedNames.has(nameKey)) {
        throw new Error(
          "Duplicate name in " +
          sheetName + ": " + name
        );
      }

      usedNames.add(nameKey);

      // Generate a new ID if missing.
      if (!id) {

        highest++;

        id = settings.prefix +
          String(highest).padStart(3, "0");

        sheet.getRange(rowNumber, 1)
          .setValue(id);

        // Store immediately to prevent reuse.
        props.setProperty(
          propertyKey,
          String(highest)
        );
      }

      // Validate existing ID.
      if (!idPattern.test(id)) {
        throw new Error(
          "Invalid ID in " + sheetName +
          " row " + rowNumber + ": " + id
        );
      }

      if (usedIds.has(id)) {
        throw new Error(
          "Duplicate ID in " +
          sheetName + ": " + id
        );
      }

      usedIds.add(id);

      // Only active records appear in Google Form.
      if (status === "active") {
        activeNames.push(name);
      }

    });

    props.setProperty(
      propertyKey,
      String(highest)
    );

    if (activeNames.length === 0) {
      throw new Error(
        "At least one active " +
        sheetName + " record is required."
      );
    }

    // Connect to existing Google Form.
    
const formId = PropertiesService.getScriptProperties()
  .getProperty("WORKFORCE_FORM_ID");
if (!formId) {
  throw new Error("Set WORKFORCE_FORM_ID in Script properties before syncing.");
}
const form = FormApp.openById(formId);

activeNames.sort((a, b) => a.localeCompare(b));

if (sheetName === "Employees") {

  // Employees can select multiple names.
  const question = form
    .getItems(FormApp.ItemType.CHECKBOX)
    .find(item =>
      item.getTitle().trim() === "Employee name"
    );

  if (!question) {
    throw new Error("Employee checkbox question not found.");
  }

  question.asCheckboxItem().setChoiceValues(activeNames);

} else if (sheetName === "Sites") {

  // Sites remain a single-selection dropdown.
  const question = form
    .getItems(FormApp.ItemType.LIST)
    .find(item =>
      item.getTitle().trim() === "Work Location/Site"
    );

  if (!question) {
    throw new Error("Site dropdown question not found.");
  }

  question.asListItem().setChoiceValues(activeNames);
}

    // Save last successful sync time.
    sheet.getRange("E1")
      .setValue("Last Successful Sync");

    sheet.getRange("E2")
      .setValue(new Date());

    console.log(
      "Synced " + activeNames.length +
      " active records from " + sheetName
    );

  } finally {
    lock.releaseLock();
  }
}


// ========================================
// 4. CLEAN UP EMPTY STATUS DROPDOWNS
// ========================================

// Run once manually after replacing the script.

function cleanupEmptyStatusDropdowns() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  ["Employees", "Sites"].forEach(sheetName => {

    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(
        "Missing sheet tab: " + sheetName
      );
    }

    const template = sheet.getRange("G2");

    if (!template.getDataValidation()) {
      throw new Error(
        "Missing coloured dropdown template in " +
        sheetName + "!G2"
      );
    }

    const totalRows = sheet.getMaxRows() - 1;

    if (totalRows <= 0) return;

    // Remove all status validation rules.
    // Existing status values are preserved.
    sheet.getRange(2, 3, totalRows, 1)
      .clearDataValidations();

    const lastRow = sheet.getLastRow();

    if (lastRow < 2) return;

    const names = sheet
      .getRange(2, 2, lastRow - 1, 1)
      .getDisplayValues();

    // Restore coloured dropdowns
    // only where a name exists.
    names.forEach((row, index) => {

      if (String(row[0]).trim()) {

        template.copyTo(
          sheet.getRange(index + 2, 3),
          SpreadsheetApp.CopyPasteType
            .PASTE_DATA_VALIDATION,
          false
        );

      }

    });

    console.log(
      "Cleaned empty status dropdowns in " +
      sheetName
    );

  });

}


function handleDirectoryFormSubmission(e) {

  // This function must be called by a
  // spreadsheet On form submit trigger.
  if (!e || !e.range || !e.namedValues) {
    throw new Error(
      "Submit a registration form to test this function."
    );
  }

  const responseSheet = e.range.getSheet();
  const responseSheetName = responseSheet.getName();

  // Determine which registration form was submitted.
  const formSettings = {
    "New Employee Requests": {
      masterSheet: "Employees",
      question: "Employee Name",
      syncFunction: syncEmployeeDropdown
    },
    "New Site Requests": {
      masterSheet: "Sites",
      question: "Site Name",
      syncFunction: syncSiteDropdown
    }
  };

  const settings = formSettings[responseSheetName];

  // Ignore submissions from unrelated sheets.
  if (!settings) {
    console.log(
      "Ignored response from: " + responseSheetName
    );
    return;
  }

  const submittedValue =
    e.namedValues[settings.question];

  const name = String(
    submittedValue ? submittedValue[0] : ""
  ).trim();

  if (!name) {
    throw new Error(
      "Missing required name: " + settings.question
    );
  }

  const ss = e.source;
  const sheet = ss.getSheetByName(settings.masterSheet);

  if (!sheet) {
    throw new Error(
      "Master sheet not found: " +
      settings.masterSheet
    );
  }

  // Check existing records to prevent duplicate names.
  const lastRow = sheet.getLastRow();

  const existingNames = lastRow > 1
    ? sheet.getRange(2, 2, lastRow - 1, 1)
        .getDisplayValues()
        .flat()
        .map(value => String(value).trim().toLowerCase())
    : [];

  if (existingNames.includes(name.toLowerCase())) {
    console.log(
      "Skipped duplicate: " + name +
      " already exists in " + settings.masterSheet
    );
    return;
  }

  // Add new record to the management sheet.
  // Column A: ID generated by existing script.
  // Column B: Name.
  // Column C: Active status.
  sheet.appendRow(["", name, "Active"]);

  // Explicitly run the existing synchronisation.
  // It creates the ID, applies the coloured
  // Status dropdown and updates Google Forms.
  settings.syncFunction();

  console.log(
    "Successfully registered: " +
    name + " in " + settings.masterSheet
  );
}

