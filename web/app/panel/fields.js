import fieldsDocument from "../../../contracts/v1/fields.json";

// Profile fields in display order, grouped by section (contracts/v1/fields.json).
export const FIELDS_BY_SECTION = Object.groupBy(fieldsDocument.fields, (field) => field.key.split(".")[0]);
