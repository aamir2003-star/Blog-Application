import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * User Schema
 * Supports three auth methods: email/password, Google OAuth, GitHub OAuth.
 * OAuth users have passwordHash = null.
 * Users start as VISITOR and are promoted to CREATOR on their first post.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    passwordHash: {
      type: String,
      default: null,
      // null for pure OAuth accounts
    },

    role: {
      type: String,
      enum: {
        values: ['VISITOR', 'CREATOR'],
        message: 'Role must be either VISITOR or CREATOR',
      },
      default: 'VISITOR',
    },

    avatar: {
      type: String,
      default: null, // URL string — from OAuth provider or custom upload
    },

    // OAuth Provider IDs (sparse = allows multiple nulls in unique index)
    googleId: {
      type: String,
      default: null,
      index: { sparse: true },
    },

    githubId: {
      type: String,
      default: null,
      index: { sparse: true },
    },

    resetPasswordToken: {
      type: String,
      default: null,
      index: { sparse: true },
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    autoDeleteTrash: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Compare a plain-text password against the stored hash.
 * Returns false immediately for OAuth-only accounts (no password set).
 */
userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * Promote a VISITOR to CREATOR role.
 * Called automatically when the user publishes their first post.
 */
userSchema.methods.promoteToCreator = async function () {
  if (this.role === 'VISITOR') {
    this.role = 'CREATOR';
    await this.save();
  }
};

// ─── Static Methods ───────────────────────────────────────────────────────────

/**
 * Hash a plain-text password. Centralises bcrypt config in one place.
 */
userSchema.statics.hashPassword = async function (plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

// ─── Pre-Save Hook ────────────────────────────────────────────────────────────

/**
 * Strip the passwordHash field when converting to JSON (API responses).
 * This prevents the hash from ever leaking out of the server.
 */
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;
