import { PublicUser, PublicUserKeys } from "../user/public-user.model";

// Picks spceific properties of a different interface and merges required/optionals, courtesy of https://stackoverflow.com/a/57070274/6572208
export type EmailUserData = Required<Pick<
  PublicUser, 
  PublicUserKeys.CREATED_TIMESTAMP |
  PublicUserKeys.EMAIL | 
  PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES |
  PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE |
  PublicUserKeys.EMAIL_LAST_SUB_SOURCE |
  PublicUserKeys.EMAIL_OPT_IN_CONFIRMED |
  PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP | 
  PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP |
  PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID |
  PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY |
  PublicUserKeys.EMAIL_VERIFIED |
  PublicUserKeys.FIRST_NAME |
  PublicUserKeys.ID |
  PublicUserKeys.LAST_MODIFIED_TIMESTAMP |
  PublicUserKeys.LAST_NAME |
  PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT
  >>

// export interface EmailUserData {
//   [PublicUserKeys.CREATED_TIMESTAMP]: PublicUser[PublicUserKeys.CREATED_TIMESTAMP];
//   [PublicUserKeys.EMAIL]: PublicUser[PublicUserKeys.EMAIL]; 
//   [PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES]: PublicUser[PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES];
//   [PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE]: PublicUser[PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE];
//   [PublicUserKeys.EMAIL_LAST_SUB_SOURCE]: PublicUser[PublicUserKeys.EMAIL_LAST_SUB_SOURCE];
//   [PublicUserKeys.EMAIL_OPT_IN_CONFIRMED]: PublicUser[PublicUserKeys.EMAIL_OPT_IN_CONFIRMED];
//   [PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]: PublicUser[PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP]; 
//   [PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP]: PublicUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_CREATED_TIMESTAMP];
//   [PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID]: PublicUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID];
//   [PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY]: PublicUser[PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY];
//   [PublicUserKeys.EMAIL_VERIFIED]: PublicUser[PublicUserKeys.EMAIL_VERIFIED];
//   [PublicUserKeys.FIRST_NAME]: PublicUser[PublicUserKeys.FIRST_NAME];
//   [PublicUserKeys.ID]: PublicUser[PublicUserKeys.ID];
//   [PublicUserKeys.LAST_MODIFIED_TIMESTAMP]: PublicUser[PublicUserKeys.LAST_MODIFIED_TIMESTAMP];
//   [PublicUserKeys.LAST_NAME]: PublicUser[PublicUserKeys.LAST_NAME];
//   [PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT]: PublicUser[PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT];
// }