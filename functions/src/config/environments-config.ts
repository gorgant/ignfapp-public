
import { projectID } from 'firebase-functions/params';
import { EnvironmentTypes, SANDBOX_APPS } from '../../../shared-models/environments/env-vars.model';

const isSandbox = projectID.value() === SANDBOX_APPS.ignfappPublicApp.projectId; // This produces a warning when deploying functions but based on research it is okay to ignore for now
export const currentEnvironmentType = isSandbox ? EnvironmentTypes.SANDBOX : EnvironmentTypes.PRODUCTION;
