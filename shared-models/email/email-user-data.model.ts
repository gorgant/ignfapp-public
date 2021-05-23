import { PublicUser, PublicUserKeys } from "../user/public-user.model";
import { PrelaunchUser } from "../user/prelaunch-user.model";

// Picks spceific properties of a different interface and merges required/optionals, courtesy of https://stackoverflow.com/a/57070274/6572208
export type EmailUserData = Pick<
  PublicUser, 
  PublicUserKeys.EMAIL | 
  PublicUserKeys.EMAIL_GROUP_UNSUBSCRIBES |
  PublicUserKeys.EMAIL_GLOBAL_UNSUBSCRIBE |
  PublicUserKeys.EMAIL_LAST_SUB_SOURCE |
  PublicUserKeys.EMAIL_OPT_IN_CONFIRMED |
  PublicUserKeys.EMAIL_OPT_IN_TIMESTAMP | 
  PublicUserKeys.EMAIL_SENDGRID_CONTACT_ID |
  PublicUserKeys.EMAIL_SENDGRID_CONTACT_LIST_ARRAY |
  PublicUserKeys.EMAIL_VERIFIED |
  PublicUserKeys.FIRST_NAME |
  PublicUserKeys.ID |
  PublicUserKeys.LAST_NAME |
  PublicUserKeys.ONBOARDING_WELCOME_EMAIL_SENT
  > & Partial<PrelaunchUser>
