import { PublicUser } from "../user/public-user.model";
import { AvatarImageMetaData } from "./image-metadata.model";

export interface AvatarImageData {
  file: File,
  imageMetadata: AvatarImageMetaData
}