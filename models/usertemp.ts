import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";
import type { IAddress, UserRole } from "@/types/commerce";

// ============================================================================
// LOYALTY TIER CONFIGURATION
// ============================================================================

export interface ILoyaltyTier {
  name: string;
  minSpent: number;
  discount: number;
}

export const LOYALTY_TIERS: ILoyaltyTier[] = [
  { name: "Silver Vault", minSpent: 0, discount: 5 },
  { name: "Gold Vault", minSpent: 500, discount: 10 },
  { name: "Platinum Elite", minSpent: 2000, discount: 15 },
  { name: "Diamond Sovereign", minSpent: 5000, discount: 20 },
];

// ============================================================================
// LOYALTY HELPER FUNCTIONS
// ============================================================================

export function getLoyaltyTier(totalSpent: number): string {
  const tier = LOYALTY_TIERS.findLast((t) => totalSpent >= t.minSpent);
  return tier?.name || "Silver Vault";
}

export function getLoyaltyDiscount(totalSpent: number): number {
  const tier = LOYALTY_TIERS.findLast((t) => totalSpent >= t.minSpent);
  return tier?.discount || 0;
}

export function getLoyaltyBadge(
  tier: string
): { label: string; color: string; bg: string } {
  const badges: Record<string, { label: string; color: string; bg: string }> =
    {
      "Silver Vault": { label: "Silver", color: "#666666", bg: "#F3F3F3" },
      "Gold Vault": { label: "Gold", color: "#D4AF37", bg: "#FFF8E7" },
      "Platinum Elite": { label: "Platinum", color: "#E5E4E2", bg: "#F5F5F5" },
      "Diamond Sovereign": {
        label: "Diamond",
        color: "#00CED1",
        bg: "#E0FFFF",
      },
    };

  return badges[tier] || badges["Silver Vault"];
}

// ============================================================================
// USER INTERFACE & SCHEMA
// ============================================================================

export interface INotification {
  title: string;
  desc: string;
  unread: boolean;
  time: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;

  name: string;
  email: string;
  password?: string;
  phone?: string;
  image?: string;
  dob?: string;
  language?: string;
  currency?: string;
  role: UserRole;

  myReferralCode?: string;
  referredBy?: string;
  totalReferrals: number;
  totalEarned: number;

  walletPoints: number;
  walletBalance: number;
  pendingWalletBalance: number;

  loyaltyTier: string;
  loyaltyPoints: number;
  totalSpent: number;
  tierUpgradedAt?: Date;

  resetOtp?: string;
  otpExpiry?: Date;

  addresses: IAddress[];
  wishlist: mongoose.Types.ObjectId[];
  recentlyViewed: mongoose.Types.ObjectId[];
  notifications: INotification[];

  createdAt: Date;
  updatedAt: Date;

  // Instance Methods
  calculateLoyaltyTier(): string;
  getLoyaltyDiscount(): number;
  addLoyaltyPoints(points: number): void;
  addNotification(
    title: string,
    desc: string,
    unread?: boolean
  ): Promise<void>;
  getUnreadNotificationCount(): number;
  markNotificationAsRead(index: number): Promise<void>;
  clearNotifications(): Promise<void>;
}

const AddressSchema = new Schema<IAddress>(
  {
    label: { type: String, trim: true, default: "Home" },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true, default: "" },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },
    phone: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const NotificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
      trim: true,
    },
    unread: {
      type: Boolean,
      default: true,
      index: true,
    },
    time: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    // ========================================================================
    // BASIC INFORMATION
    // ========================================================================
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
      index: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
      index: true,
    },

    password: {
      type: String,
      select: false,
      minlength: [6, "Password must be at least 6 characters"],
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    image: {
      type: String,
      default: "",
    },

    dob: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      default: "en",
    },

    currency: {
      type: String,
      default: "INR",
    },

    role: {
      type: String,
      enum: {
        values: ["USER", "ADMIN", "SUPER_ADMIN"],
        message: "Role must be USER, ADMIN, or SUPER_ADMIN",
      },
      default: "USER",
      index: true,
    },

    // ========================================================================
    // REFERRAL SYSTEM
    // ========================================================================
    myReferralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      index: true,
    },

    referredBy: {
      type: String,
      default: null,
      index: true,
    },

    totalReferrals: {
      type: Number,
      default: 0,
      min: [0, "Total referrals cannot be negative"],
    },

    totalEarned: {
      type: Number,
      default: 0,
      min: [0, "Total earned cannot be negative"],
    },

    // ========================================================================
    // WALLET SYSTEM
    // ========================================================================
    walletPoints: {
      type: Number,
      default: 0,
      min: [0, "Wallet points cannot be negative"],
    },

    walletBalance: {
      type: Number,
      default: 0,
      min: [0, "Wallet balance cannot be negative"],
    },

    pendingWalletBalance: {
      type: Number,
      default: 0,
      min: [0, "Pending wallet balance cannot be negative"],
    },

    // ========================================================================
    // LOYALTY SYSTEM
    // ========================================================================
    loyaltyTier: {
      type: String,
      enum: {
        values: LOYALTY_TIERS.map((t) => t.name),
        message: "Invalid loyalty tier",
      },
      default: "Silver Vault",
      index: true,
    },

    loyaltyPoints: {
      type: Number,
      default: 0,
      min: [0, "Loyalty points cannot be negative"],
    },

    totalSpent: {
      type: Number,
      default: 0,
      min: [0, "Total spent cannot be negative"],
      index: true,
    },

    tierUpgradedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // ========================================================================
    // SECURITY
    // ========================================================================
    resetOtp: {
      type: String,
      select: false,
    },

    otpExpiry: {
      type: Date,
      default: null,
      index: true,
    },

    // ========================================================================
    // NOTIFICATIONS
    // ========================================================================
    addresses: {
      type: [AddressSchema],
      default: [],
    },

    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    recentlyViewed: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    notifications: {
      type: [NotificationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// INDEXES
// ============================================================================

UserSchema.index({ email: 1, createdAt: -1 });
UserSchema.index({ role: 1, createdAt: -1 });
UserSchema.index({ totalSpent: -1 });
UserSchema.index({ "notifications.unread": 1, "notifications.time": -1 });

// ============================================================================
// INSTANCE METHODS
// ============================================================================

UserSchema.methods.calculateLoyaltyTier = function (): string {
  const newTier = getLoyaltyTier(this.totalSpent);
  if (newTier !== this.loyaltyTier) {
    this.loyaltyTier = newTier;
    this.tierUpgradedAt = new Date();
  }
  return this.loyaltyTier;
};

UserSchema.methods.getLoyaltyDiscount = function (): number {
  return getLoyaltyDiscount(this.totalSpent);
};

UserSchema.methods.addLoyaltyPoints = function (points: number): void {
  if (points < 0) {
    throw new Error("Points cannot be negative");
  }
  this.loyaltyPoints += points;
};

UserSchema.methods.addNotification = async function (
  title: string,
  desc: string,
  unread: boolean = true
): Promise<void> {
  if (!this.notifications) {
    this.notifications = [];
  }

  this.notifications.unshift({
    title,
    desc,
    unread,
    time: new Date(),
  });

  // Keep only last 100 notifications
  if (this.notifications.length > 100) {
    this.notifications = this.notifications.slice(0, 100);
  }

  await this.save();
};

UserSchema.methods.getUnreadNotificationCount = function (): number {
  if (!this.notifications) return 0;
  return this.notifications.filter((n: any) => n.unread).length;
};

UserSchema.methods.markNotificationAsRead = async function (
  index: number
): Promise<void> {
  if (this.notifications && this.notifications[index]) {
    this.notifications[index].unread = false;
    await this.save();
  }
};

UserSchema.methods.clearNotifications = async function (): Promise<void> {
  this.notifications = [];
  await this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

UserSchema.statics.findByEmail = async function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByReferralCode = async function (code: string) {
  return this.findOne({ myReferralCode: code.toUpperCase() });
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Auto-calculate loyalty tier before saving
UserSchema.pre<IUser>("save", function (next) {
  if (this.totalSpent !== undefined) {
    const newTier = getLoyaltyTier(this.totalSpent);
    if (newTier !== this.loyaltyTier) {
      this.loyaltyTier = newTier;
      this.tierUpgradedAt = new Date();
    }
  }
  next();
});

// Remove sensitive fields when converting to JSON
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetOtp;
  delete user.otpExpiry;
  return user;
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default UserModel;