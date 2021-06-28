export type SgContactCustomFieldData = {
  [key in SgContactCustomFieldIds]: string | number;
}

// Sendgrid uses these custom IDs for the custom fields
// To get these ids use postman GET https://api.sendgrid.com/v3/marketing/field_definitions
export enum SgContactCustomFieldIds {
  APP_UID = 'e3_T',
  CREATED_TIMESTAMP = 'e5_N'
}