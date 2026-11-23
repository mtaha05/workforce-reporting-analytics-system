# Data dictionary (illustrative)

The precise production spreadsheet schema must be confirmed against the latest live workbook before documenting it. The following is a **conceptual**, non-production model and should not be treated as a literal export.

| Entity | Example field | Meaning |
| --- | --- | --- |
| Work record | Work date | Date on which the work occurred |
| Work record | Employee | Employee reference used in work reporting |
| Work record | Site | Site reference associated with the work |
| Work record | Job description | Description of the work undertaken |
| Work record | Job type | Category assigned to the work |
| Employee | Active | Whether the employee is available in current workflows |
| Site | Active | Whether the site is available in current workflows |

## Reporting considerations

- Prefer **work date** over form submission timestamp for reporting on when work was performed.
- Confirm whether a work record can contain multiple employees before counting individual workdays.
- Define how to count half-days or multiple jobs performed by the same employee on one date before calculating 'days worked'.
- Validate joins or expanded rows so that an employee is not double-counted in site/day reports.

## Example measures (definitions to confirm)

- **Work records:** Count of submitted and valid records.
- **Employee workdays:** Distinct employee-date combinations within the selected date range and site, subject to business rules for partial days.
- **Sites reported:** Distinct sites represented in the filtered work records.
