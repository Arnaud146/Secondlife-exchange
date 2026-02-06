import type { HttpsFunction, Request } from "firebase-functions/v2/https";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Response = Parameters<HttpsFunction>[1];

const mocks = vi.hoisted(() => {
  const queryApi = {
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    startAfter: vi.fn(),
    get: vi.fn(),
  };

  const docApi = {
    get: vi.fn(),
  };

  const collectionApi = {
    ...queryApi,
    doc: vi.fn(() => docApi),
  };

  return {
    queryApi,
    collectionApi,
    docApi,
    collection: vi.fn(() => collectionApi),
    assertWithinRateLimit: vi.fn(),
  };
});

vi.mock("../../lib/firebase-admin.js", () => ({
  adminDb: {
    collection: mocks.collection,
  },
}));

vi.mock("../../lib/rate-limit.js", () => ({
  assertWithinRateLimit: mocks.assertWithinRateLimit,
}));

import { listEcoContentsHandler } from "./http.js";

function createMockResponse() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));

  return {
    status,
    json,
  };
}

describe("eco content http integration", () => {
  beforeEach(() => {
    mocks.queryApi.where.mockImplementation(() => mocks.collectionApi);
    mocks.queryApi.orderBy.mockImplementation(() => mocks.collectionApi);
    mocks.queryApi.limit.mockImplementation(() => mocks.collectionApi);
    mocks.queryApi.startAfter.mockImplementation(() => mocks.collectionApi);
    mocks.docApi.get.mockResolvedValue({
      exists: false,
      data: () => undefined,
    });
    mocks.assertWithinRateLimit.mockReturnValue(undefined);
    mocks.collection.mockClear();
    mocks.queryApi.where.mockClear();
    mocks.queryApi.orderBy.mockClear();
    mocks.queryApi.limit.mockClear();
    mocks.queryApi.startAfter.mockClear();
    mocks.queryApi.get.mockClear();
  });

  it("returns paginated eco content list with filters", async () => {
    mocks.queryApi.get.mockResolvedValue({
      docs: [
        {
          id: "eco-1",
          data: () => ({
            themeWeekId: "theme-1",
            type: "article",
            title: "Repair before replace",
            summary: "A practical guide to extending product lifespan.",
            sourceUrl: "https://example.org/repair",
            tags: ["repair", "reuse"],
            lang: "en",
            publishedAt: new Date("2026-01-10T10:00:00.000Z"),
            createdAt: new Date("2026-01-09T10:00:00.000Z"),
          }),
        },
      ],
    });

    const req = {
      method: "GET",
      query: {
        limit: "8",
        type: "article",
        tag: "repair",
        lang: "en",
      },
      get: vi.fn(() => undefined),
      ip: "127.0.0.1",
    } as unknown as Request;

    const resMock = createMockResponse();
    const res = resMock as unknown as Response;

    await listEcoContentsHandler(req, res);

    expect(resMock.status).toHaveBeenCalledWith(200);
    expect(resMock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          ecoContents: expect.arrayContaining([
            expect.objectContaining({
              id: "eco-1",
              title: "Repair before replace",
              type: "article",
            }),
          ]),
          nextCursor: null,
        }),
      }),
    );
    expect(mocks.queryApi.where).toHaveBeenCalledWith("type", "==", "article");
    expect(mocks.queryApi.where).toHaveBeenCalledWith("tags", "array-contains", "repair");
    expect(mocks.queryApi.where).toHaveBeenCalledWith("lang", "==", "en");
  });
});
