// Fields a client must never set through a request body: the record id, the
// owner, and the timestamps Prisma manages. Owner and parent ids always come
// from the authenticated user or the route params instead.
const PROTECTED_FIELDS = ['id', 'userId', 'createdAt', 'updatedAt'];

// Returns `any` like `req.body` itself, so it can be spread into Prisma inputs.
export const withoutProtectedFields = (
  body: unknown,
  extraBlocked: string[] = []
): any => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const blocked = new Set([...PROTECTED_FIELDS, ...extraBlocked]);
  return Object.fromEntries(Object.entries(body).filter(([key]) => !blocked.has(key)));
};
