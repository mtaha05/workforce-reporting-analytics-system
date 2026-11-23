# Source code

This folder contains two reviewed Apps Script files based on the actual workforce reporting implementation:

- **`ReportingSync.gs`**: Rebuilds the flat `Reporting Data` table from form submissions, assigns stable Job Record IDs, and handles multi-employee submissions.
- **`DirectoryManagement.gs`**: Manages employee/site IDs and Active/Inactive statuses, synchronises choices with the work form, and processes registration submissions.

The production Google Form ID was replaced by a `WORKFORCE_FORM_ID` script property in `DirectoryManagement.gs`; configure it privately in Apps Script Project Settings. Do not commit production IDs or data.

See [setup instructions](../docs/setup.md) and [code guide](../docs/code-guide.md). These files are intended for review and deployment in a **separate demo environment**, not for executing from GitHub itself.
