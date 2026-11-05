import type { User } from "firebase/auth";

export type AuthStatus = "restoring" | "signedOut" | "signedIn";

/**
 * The signed-in user as the app knows them.
 *
 * `authId` is the Firebase uid. The backend derives the user row from the
 * verified token, so the app never sends an id.
 */
export interface AppUser {
  authId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  imageUrl: string | null;
  emailVerified: boolean;
}

export interface Wardrobe {
  id: number;
  userId: string;
  name: string;
  description: string;
  itemCount: number;
  totalValue: number;
  coverPhotoUri: string;
  createdAt: string | null;
}

export interface WardrobeItem {
  id: number;
  wardrobeId: number;
  userId: string;
  itemName: string;
  photoUri: string;
  brand: string;
  category: string;
  color: string;
  size: string;
  state: string;
  price: number | null;
  purchaseDate: Date | null;
  expiryDate: Date | null;
  createdAt: Date | null;
}

/** A photo chosen or captured by the user, with base64 for Firebase Storage. */
export interface PickedPhoto {
  uri: string;
  base64: string | null;
  mimeType: string;
  fileName: string | null;
}

export function toAppUser(user: User): AppUser {
  const name = (user.displayName ?? "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const email = user.email ?? "";

  return {
    authId: user.uid,
    firstName: parts[0] ?? email.split("@")[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
    email,
    phone: user.phoneNumber ?? null,
    imageUrl: user.photoURL ?? null,
    emailVerified: user.emailVerified,
  };
}

export function fullName(user: AppUser | null): string {
  if (!user) return "";
  return [user.firstName, user.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

export function userInitials(user: AppUser | null): string {
  if (!user) return "?";
  const source = fullName(user) || user.email;
  const letters = source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return letters || "?";
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function wardrobeFromJson(json: Record<string, unknown>): Wardrobe {
  return {
    id: Number(json.id ?? 0),
    userId: String(json.userId ?? json.ownerUid ?? ""),
    name: String(json.name ?? ""),
    description: String(json.description ?? ""),
    itemCount: Number(json.itemCount ?? 0),
    totalValue: Number(json.totalValue ?? 0),
    coverPhotoUri: String(json.coverPhotoUri ?? ""),
    createdAt: json.createdAt ? String(json.createdAt) : null,
  };
}

export function wardrobeItemFromJson(
  json: Record<string, unknown>,
): WardrobeItem {
  return {
    id: Number(json.id ?? 0),
    wardrobeId: Number(json.wardrobeId ?? 0),
    userId: String(json.userId ?? json.ownerUid ?? ""),
    itemName: String(json.itemName ?? "Untitled item"),
    photoUri: String(json.photoUri ?? ""),
    brand: String(json.brand ?? ""),
    category: String(json.category ?? ""),
    color: String(json.color ?? ""),
    size: String(json.size ?? ""),
    state: String(json.state ?? "newly_purchased"),
    price: toNumber(json.price),
    purchaseDate: toDate(json.purchaseDate),
    expiryDate: toDate(json.expiryDate),
    createdAt: toDate(json.createdAt),
  };
}

/**
 * Only absolute URLs can be rendered again on a later visit. Legacy rows may
 * contain device-local paths / blob URLs, which are unusable as images.
 */
export function photoUrl(uri: string | null | undefined): string | null {
  const value = (uri ?? "").trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return null;
}
