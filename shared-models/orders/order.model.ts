import { PublicUser } from '../user/public-user.model';
import { Timestamp } from '@angular/fire/firestore';

export interface Order {
  id: string;
  orderNumber: string; // A subset of id
  createdTimestamp: number | Timestamp;
  stripeChargeId: string;
  stripeCustomerId: string;
  firstName: string;
  lastName: string;
  email: string;
  publicUser: PublicUser;
  productId: string;
  listPrice: number;
  discountCouponCode: string;
  amountPaid: number;
  status: 'activated' | 'inactive';
}
