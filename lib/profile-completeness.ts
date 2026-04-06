export function calculateProfileCompleteness(user: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  brokerageName?: string | null;
  boroughsServed?: string[];
  specialties?: string[];
  bio?: string | null;
  avatarUrl?: string | null;
  hasLicenses?: boolean | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
}): number {
  let completed = 0;
  const total = 8;

  // 1. Basic identity
  if (user.name && user.email && user.phone) completed++;
  // 2. Company name
  if (user.brokerageName) completed++;
  // 3. Boroughs served
  if (user.boroughsServed && user.boroughsServed.length > 0) completed++;
  // 4. Specialties
  if (user.specialties && user.specialties.length > 0) completed++;
  // 5. Bio (at least 50 chars)
  if (user.bio && user.bio.length >= 50) completed++;
  // 6. Profile photo
  if (user.avatarUrl) completed++;
  // 7. Licenses answered (both true and false count as "answered")
  if (user.hasLicenses !== undefined && user.hasLicenses !== null) completed++;
  // 8. At least one social media link
  if (user.linkedinUrl || user.instagramUrl || user.twitterUrl || user.facebookUrl || user.tiktokUrl) completed++;

  return Math.round((completed / total) * 100);
}
