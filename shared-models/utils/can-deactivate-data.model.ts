import { ActionConfData } from "shared-models/forms/action-conf-data.model";

export interface CanDeactivateData {
  deactivationPermitted: boolean,
  warningMessage: ActionConfData
}