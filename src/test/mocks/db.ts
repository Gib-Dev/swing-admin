import { vi } from "vitest";

// Creates a chainable mock that supports Drizzle ORM patterns:
// db.insert(table).values(data)
// db.update(table).set(data).where(condition)
// db.delete(table).where(condition)
// db.select().from(table).where(condition)
// db.query.tableName.findFirst/findMany(...)
// db.transaction(callback)

export function createMockDb() {
  const returningFn = vi.fn().mockResolvedValue([{ id: "mock-id" }]);

  const whereFn = vi.fn().mockResolvedValue(undefined);
  whereFn.mockReturnValue(Promise.resolve(undefined));

  const valuesFn = vi.fn().mockReturnValue({
    returning: returningFn,
    then: (resolve: (v: unknown) => void) => resolve(undefined),
  });

  const setFn = vi.fn().mockReturnValue({
    where: whereFn,
    then: (resolve: (v: unknown) => void) => resolve(undefined),
  });

  const fromFn = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([{ count: 0 }]),
    innerJoin: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  });

  const insertFn = vi.fn().mockReturnValue({ values: valuesFn });
  const updateFn = vi.fn().mockReturnValue({ set: setFn });
  const deleteFn = vi.fn().mockReturnValue({ where: whereFn });
  const selectFn = vi.fn().mockReturnValue({ from: fromFn });

  const findFirst = vi.fn().mockResolvedValue(null);
  const findMany = vi.fn().mockResolvedValue([]);

  const makeQueryTable = () => ({ findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) });

  const transactionFn = vi.fn().mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
    // The transaction callback receives a tx object that has the same API
    return callback(db);
  });

  const db = {
    insert: insertFn,
    update: updateFn,
    delete: deleteFn,
    select: selectFn,
    transaction: transactionFn,
    query: {
      tournaments: makeQueryTable(),
      teams: makeQueryTable(),
      players: makeQueryTable(),
      users: makeQueryTable(),
      sponsorshipTiers: makeQueryTable(),
      registrations: makeQueryTable(),
      sponsorships: makeQueryTable(),
      payments: makeQueryTable(),
    },
  };

  return db;
}

export type MockDb = ReturnType<typeof createMockDb>;
