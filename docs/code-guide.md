# Apps Script code guide

## `src/ReportingSync.gs`

**Entry point:** `rebuildWorkforceReporting(e)`

1. Reads the `Form Responses 1` work-submission sheet.
2. Locates required fields by header, including the supported legacy day-type label.
3. Uses the final non-empty `Employee name` column to accommodate historical form changes.
4. Splits comma-separated checkbox answers into individual employee records and removes duplicate names within one submission.
5. Creates a stable UUID-based `Job Record ID` for each valid source response that has no ID yet.
6. Rewrites `Reporting Data`, with one row per employee selection and shared job ID for employees on the same submitted job.
7. Formats the `Date of Work` output column and freezes its heading row.

**Source of truth:** the work form's response tab. `Reporting Data` is generated output and must not be manually maintained.

**Important metric:** `COUNT` of reporting rows is *employee-job rows*, not necessarily the number of unique submitted jobs. Distinct `Job Record ID` is suitable for counting unique submitted jobs when configured correctly. Counting days worked requires an explicit rule for half-days and multiple jobs per employee/day.

## `src/DirectoryManagement.gs`

**Entry points:**

| Function | What it does |
| --- | --- |
| `syncEmployeeDropdown(e)` | Syncs active employee names into the work form's `Employee name` checkboxes |
| `syncSiteDropdown(e)` | Syncs active site names into the work form's `Work Location/Site` dropdown |
| `syncDirectory(sheetName, e)` | Shared synchronisation implementation, including IDs, validation, duplicate checking and locking |
| `cleanupEmptyStatusDropdowns()` | Repairs status validation rules in directory sheets, only retaining dropdowns on named rows |
| `handleDirectoryFormSubmission(e)` | Processes responses from employee/site registration forms into master lists and runs sync |

New directory records receive IDs such as `EMP001` or `SITE001`; the sequence counter is preserved using script properties and existing sheet values. Only active names appear in the work form, while previously submitted work rows remain in the reporting dataset.

**Security modification for GitHub:** the user's source initially contained an embedded Google Form ID. The public version reads a `WORKFORCE_FORM_ID` Script property instead. See [`setup.md`](setup.md). The rest of the directory logic is left unchanged.

## Limitations and improvement opportunities

- Both source files are written for a spreadsheet-bound Apps Script project with specific form items, tabs and validation templates.
- Names separated by commas are treated as multiple employees. Employee names containing commas would need a different encoding.
- Rebuilding all output rows after each submission is simple and consistent, but may become slow with a very large response sheet.
- The registration form's duplicate-name check is not protected by its own lock, so two truly simultaneous registration requests could theoretically add the same name; adding a lock would be a future hardening improvement.
- The script assumes there is at least one active employee or site when synchronising its corresponding form choice list.
- Trigger execution, permissions, connector refresh and caching mean data may not appear instantly in Looker Studio.

No source code in this repository automatically connects to or grants access to the client's real environment.
