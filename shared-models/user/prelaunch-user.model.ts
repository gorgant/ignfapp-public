import { PublicUser } from "./public-user.model";

export interface PrelaunchUser extends PublicUser {
  isPrelaunchUser: boolean;
  emailPrelaunchWelcomeSent?: boolean;
}
