/**
 * ApiService Unit Tests
 * Tests: setToken, 401 storage clearing, convenience methods exist
 *
 * Strategy: Rather than trying to mock axios internals, we test the
 * public API of the singleton instance that's already instantiated.
 * For interceptor behavior (401 handling), we test the observable
 * side effects (localStorage/sessionStorage clearing).
 */

// We need to mock dependencies BEFORE the module is loaded
jest.mock("./logger", () => ({
    __esModule: true,
    default: { error: jest.fn(), warn: jest.fn(), log: jest.fn() },
}));

jest.mock("./openreplayEvents", () => ({
    ApiEvents: {
        requestComplete: jest.fn(),
        requestError: jest.fn(),
        slowRequest: jest.fn(),
    },
}));

// Import the singleton instance (loads the real axios and creates a real client)
const api = require("./api").default;

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
});

describe("ApiService", () => {
    describe("setToken", () => {
        it("adds Authorization header when token is provided", () => {
            api.setToken("test-jwt-token");
            expect(api.client.defaults.headers.Authorization).toBe("Bearer test-jwt-token");
        });

        it("removes Authorization header when null is provided", () => {
            api.setToken("temp-token");
            api.setToken(null);
            expect(api.client.defaults.headers.Authorization).toBeUndefined();
        });
    });

    describe("request interceptor (token injection)", () => {
        it("injects stored token into request headers", async () => {
            localStorage.setItem("dcg_admin_token", "stored-token");

            // The request interceptor runs inside the axios pipeline.
            // We can test indirectly by inspecting a request config.
            // Get the request interceptor function from the registered handlers.
            const requestHandlers = api.client.interceptors.request.handlers;
            const requestInterceptor = requestHandlers[0]?.fulfilled;

            if (requestInterceptor) {
                const config = { headers: {}, method: "get" };
                const result = requestInterceptor(config);
                expect(result.headers.Authorization).toBe("Bearer stored-token");
            }
        });
    });

    describe("response interceptor (401 handling)", () => {
        it("clears auth storage on 401 response", async () => {
            // Pre-populate storage
            localStorage.setItem("dcg_admin_token", "some-token");
            localStorage.setItem("dcg_admin_user", '{"email":"test@dcg.com"}');
            localStorage.setItem("dcg_admin_remember", "true");
            sessionStorage.setItem("dcg_admin_token", "session-token");
            sessionStorage.setItem("dcg_admin_user", '{"email":"test@dcg.com"}');

            // Get the response error interceptor
            const responseHandlers = api.client.interceptors.response.handlers;
            const errorHandler = responseHandlers[0]?.rejected;

            if (errorHandler) {
                const error401 = {
                    response: { status: 401 },
                    config: { metadata: { startTime: Date.now() }, method: "get", url: "/test" },
                };

                await expect(errorHandler(error401)).rejects.toEqual(error401);

                // Verify all storage was cleared
                expect(localStorage.getItem("dcg_admin_token")).toBeNull();
                expect(localStorage.getItem("dcg_admin_user")).toBeNull();
                expect(localStorage.getItem("dcg_admin_remember")).toBeNull();
                expect(sessionStorage.getItem("dcg_admin_token")).toBeNull();
                expect(sessionStorage.getItem("dcg_admin_user")).toBeNull();
            }
        });

        it("preserves storage on non-401 errors", async () => {
            localStorage.setItem("dcg_admin_token", "some-token");

            const responseHandlers = api.client.interceptors.response.handlers;
            const errorHandler = responseHandlers[0]?.rejected;

            if (errorHandler) {
                const error500 = {
                    response: { status: 500 },
                    config: { metadata: { startTime: Date.now() }, method: "get", url: "/test" },
                };

                await expect(errorHandler(error500)).rejects.toEqual(error500);

                // Storage should NOT be cleared
                expect(localStorage.getItem("dcg_admin_token")).toBe("some-token");
            }
        });
    });

    describe("convenience methods", () => {
        it("exposes post, get, put, delete as functions", () => {
            expect(typeof api.post).toBe("function");
            expect(typeof api.get).toBe("function");
            expect(typeof api.put).toBe("function");
            expect(typeof api.delete).toBe("function");
        });

        it("exposes setToken as a function", () => {
            expect(typeof api.setToken).toBe("function");
        });
    });
});
