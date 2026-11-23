# Data dictionary (illustrative)

The Apps Script files confirm the following **expected column names** for the work-response and generated reporting tabs. This is code-derived schema documentation, not a production spreadsheet export.

| Entity | Example field | Meaning |
| --- | --- | --- |
| Work record | `Timestamp` | Form submission timestamp |
| Work record | `Employee name` | One or more checkbox-selected employees (expanded to individual rows) |
| Work record | `Date of Work` | Date on which the work occurred |
| Work record | `Work Location/Site` | Work location associated with the record |
| Work record | `Day Type` | Full-day or half-day information (legacy field label also supported) |
| Work record | `Job type` | Category assigned to the work |
| Work record | `Job Description` | Description of the work undertaken |
| Work record | `Job Record ID` | Stable shared ID for one source submission, including multiple employee rows |
| Employee/Site directory | `ID` | Generated employee/site identifier |
| Employee/Site directory | `Name` | Employee or site label |
| Employee/Site directory | `Status` | Active/Inactive, controlling form choices |

## Reporting considerations

- Prefer **work date** over form submission timestamp for reporting on when work was performed.
- Confirm whether a work record can contain multiple employees before counting individual workdays.
- Define how to count half-days or multiple jobs performed by the same employee on one date before calculating 'days worked'.
- Validate joins or expanded rows so that an employee is not double-counted in site/day reports.

## Example measures (definitions to confirm)

- **Work records:** Count of submitted and valid records.
- **Employee workdays:** Distinct employee-date combinations within the selected date range and site, subject to business rules for partial days.
- **Sites reported:** Distinct sites represented in the filtered work records.
