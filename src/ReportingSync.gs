const SOURCE_TAB = "Form Responses 1";
const REPORT_TAB = "Reporting Data";

/**
 * Rebuilds the reporting table from submitted work records.
 * One source submission can expand to multiple employee reporting rows.
 * Run with a spreadsheet form-submit, edit, or scheduled trigger.
 */
function rebuildWorkforceReporting(e) {

  if (e && e.range &&
      e.range.getSheet().getName() !== SOURCE_TAB) {
    return;
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const source = ss.getSheetByName(SOURCE_TAB);

    if (!source) {
      throw new Error("Form Responses tab not found.");
    }

    const headers = source
      .getRange(1, 1, 1, source.getLastColumn())
      .getDisplayValues()[0];

    const indexes = name =>
      headers.reduce((result, h, i) => {
        if (String(h).trim().toLowerCase() ===
            name.toLowerCase()) {
          result.push(i);
        }
        return result;
      }, []);

    const findColumn = name => {
      const matches = indexes(name);
      if (!matches.length) {
        throw new Error("Missing column: " + name);
      }
      return matches[matches.length - 1];
    };

    const employeeColumns = indexes("Employee name");

    if (!employeeColumns.length) {
      throw new Error("Employee name column not found.");
    }

    const timestampCol = findColumn("Timestamp");
    const dateCol = findColumn("Date of Work");
    const siteCol = findColumn("Work Location/Site");
    const typeCol = findColumn("Job type");
    const descriptionCol = findColumn("Job Description");

    const dayCol = indexes("Day Type").length
      ? findColumn("Day Type")
      : findColumn(
          "Were you at the site for full day or half day?"
        );

    // Add a permanent Job Record ID column if missing.
    let idCol = indexes("Job Record ID")[0];

    if (idCol === undefined) {
      source.getRange(
        1, source.getLastColumn() + 1
      ).setValue("Job Record ID");

      idCol = source.getLastColumn() - 1;
    }

    const lastRow = source.getLastRow();

    const rows = lastRow > 1
      ? source.getRange(
          2, 1, lastRow - 1, source.getLastColumn()
        ).getValues()
      : [];

    const savedIds = rows.map(row => [
      row[idCol] || ""
    ]);

    const reportingRows = [];

    rows.forEach((row, index) => {

      // Supports both old single-employee responses
      // and new multiple-employee responses.
      const employeeText = employeeColumns
        .map(i => String(row[i] || "").trim())
        .filter(Boolean)
        .pop() || "";

      if (!employeeText || !row[dateCol]) return;

      // Google Forms checkbox selections
      // are represented as comma-separated names.
      const employees = [
        ...new Set(
          employeeText.split(",")
            .map(name => name.trim())
            .filter(Boolean)
        )
      ];

      let jobId = String(row[idCol] || "").trim();

      if (!jobId) {
        jobId = "JOB-" +
          Utilities.getUuid()
            .replace(/-/g, "")
            .toUpperCase();

        savedIds[index][0] = jobId;
      }

      employees.forEach(employee => {
        reportingRows.push([
          row[timestampCol],
          employee,
          row[dateCol],
          row[siteCol],
          row[dayCol],
          row[typeCol],
          row[descriptionCol],
          jobId
        ]);
      });

    });

    // Preserve generated IDs on the original records.
    if (savedIds.length) {
      source.getRange(
        2, idCol + 1, savedIds.length, 1
      ).setValues(savedIds);
    }

    const report = ss.getSheetByName(REPORT_TAB) ||
      ss.insertSheet(REPORT_TAB);

    report.clearContents();

    const outputHeaders = [
      "Timestamp",
      "Employee name",
      "Date of Work",
      "Work Location/Site",
      "Day Type",
      "Job type",
      "Job Description",
      "Job Record ID"
    ];

    report.getRange(1, 1, 1, 8)
      .setValues([outputHeaders]);

    if (reportingRows.length) {
      report.getRange(
        2, 1, reportingRows.length, 8
      ).setValues(reportingRows);

      report.getRange(
        2, 3, reportingRows.length, 1
      ).setNumberFormat("dd/MM/yyyy");
    }

    report.setFrozenRows(1);

    console.log(
      "Created " + reportingRows.length +
      " employee reporting records."
    );

  } finally {
    lock.releaseLock();
  }
}
