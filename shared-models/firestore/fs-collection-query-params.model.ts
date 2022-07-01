import { QueryConstraint, WhereFilterOp } from "firebase/firestore"

export interface FirestoreCollectionWhereQuery {
  property: string,
  operator: WhereFilterOp,
  value: unknown
}

export interface FirestoreCollectionQueryParams {
  whereQueries?: FirestoreCollectionWhereQuery[],
  limit?: number,
}