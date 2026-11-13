// Public-facing review shape. Reviews are shown to anonymous visitors, so only
// what the profile page actually renders goes out. Moderation and verification
// internals (isReported, reportReason, transactionStatus, reviewer of the
// transaction, linkedListingId) and the reviewer-supplied businessAddress must
// never reach the client.
export function publicReview(r: any) {
  return {
    id: r.id,
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt,
    response: r.response ?? null,
    responseAt: r.responseAt ?? null,
    experienceType: r.experienceType ?? null,
    businessCategory: r.businessCategory ?? null,
    businessName: r.businessName ?? null,
    transactionYear: r.transactionYear ?? null,
    transactionPrice: r.transactionPrice ?? null,
    reviewer: r.reviewer
      ? {
          id: r.reviewer.id,
          name: r.reviewer.name,
          displayName: r.reviewer.displayName ?? null,
          avatarUrl: r.reviewer.avatarUrl ?? null,
        }
      : null,
  };
}
