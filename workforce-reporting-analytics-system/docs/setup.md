# Setup overview (demonstration environment)

These steps describe how a developer could recreate the architecture using **new** test assets. They do not provide access to the live client system.

1. Create a **new Google Sheet** with dedicated tabs for work responses, employee references, site references and reporting output as needed.
2. Create a **new Google Form** to collect work date, employee selection, site and job information. Connect responses to the test spreadsheet.
3. From the Sheet, open **Extensions > Apps Script**. Add sanitised script source from `src/` after it has been reviewed for private IDs and assumptions.
4. Replace any environment-specific spreadsheet IDs, form IDs, tab names and range references with those of the test environment. Prefer script properties for configuration that should not be committed.
5. Configure and authorise the necessary installable or time-driven triggers. Confirm the update interval and limitations explicitly; do not promise instant updates from scheduled triggers.
6. Build a **new Looker Studio report** against test data with date, employee and site filters, scorecards and tables. Verify the date dimension and field types.
7. Create a **Google Sites hub** containing safe links to the test form and report, with permissions appropriate for the intended users.
8. Test adding and deactivating employees/sites, submitting work, correcting/deleting records, date filtering, and dashboard refreshes.

## Source export options

- **Simple:** Copy `.gs` source files from the Apps Script editor into `src/` and commit them after sanitisation.
- **Advanced:** Use Google's `clasp` command-line tool to pull Apps Script source locally for Git version control. Avoid committing your local authentication information or production project configuration.

Reference: https://developers.google.com/apps-script/guides/clasp

## Security checks before making the repository public

- Confirm permission to publish client-owned code and interface designs.
- Remove employee names, contact information and job descriptions from screenshots and test files.
- Remove real Google Form/Sheet/Looker Studio/Google Sites IDs or restricted URLs.
- Exclude OAuth tokens, API keys, credentials and any production-configured access rules.
- Scan the full Git history before publishing, not only the latest files.
