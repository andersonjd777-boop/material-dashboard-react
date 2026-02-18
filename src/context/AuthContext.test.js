/**
 * AuthContext Unit Tests
 * Tests: login, logout, token expiry check, Remember Me, idle timeout, useAuth guard
 */

import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

// ── Mocks ──────────────────────────────────────────────────────
jest.mock("services/api", () => ({
    post: jest.fn(),
    setToken: jest.fn(),
}));
jest.mock("services/openreplay", () => ({
    identifyUser: jest.fn(),
    clearUser: jest.fn(),
}));
jest.mock("services/openreplayEvents", () => ({
    AuthEvents: {
        loginAttempt: jest.fn(),
        loginSuccess: jest.fn(),
        loginFailed: jest.fn(),
        logout: jest.fn(),
    },
}));
jest.mock("jwt-decode", () => ({
    jwtDecode: jest.fn(),
}));

const api = require("services/api");
const { jwtDecode } = require("jwt-decode");

// Helper: renders a component that exposes auth context values via test ids
function AuthConsumer({ onRender }) {
    const auth = useAuth();
    React.useEffect(() => {
        if (onRender) onRender(auth);
    });
    return (
        <div>
            <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
            <span data-testid="loading">{String(auth.loading)}</span>
            <span data-testid="user">{auth.user ? JSON.stringify(auth.user) : "null"}</span>
        </div>
    );
}

function renderWithAuth(onRender) {
    return render(
        <AuthProvider>
            <AuthConsumer onRender={onRender} />
        </AuthProvider>
    );
}

// ── Setup / Teardown ──────────────────────────────────────────
beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

// ── Tests ─────────────────────────────────────────────────────

describe("AuthContext", () => {
    describe("initial state", () => {
        it("starts unauthenticated when no stored token exists", async () => {
            renderWithAuth();
            await waitFor(() => {
                expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
                expect(screen.getByTestId("loading")).toHaveTextContent("false");
            });
        });

        it("restores session from localStorage when valid token exists", async () => {
            const fakeUser = { email: "josh@dcg.com", role: "admin" };
            // Token that expires in 1 hour
            jwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

            localStorage.setItem("dcg_admin_token", "valid-jwt");
            localStorage.setItem("dcg_admin_user", JSON.stringify(fakeUser));

            renderWithAuth();

            await waitFor(() => {
                expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
                expect(screen.getByTestId("user")).toHaveTextContent("josh@dcg.com");
            });
            expect(api.setToken).toHaveBeenCalledWith("valid-jwt");
        });

        it("clears expired token on mount", async () => {
            const fakeUser = { email: "josh@dcg.com" };
            jwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) - 600 }); // expired 10 min ago

            localStorage.setItem("dcg_admin_token", "expired-jwt");
            localStorage.setItem("dcg_admin_user", JSON.stringify(fakeUser));

            renderWithAuth();

            await waitFor(() => {
                expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
            });
            expect(localStorage.getItem("dcg_admin_token")).toBeNull();
        });
    });

    describe("login", () => {
        it("stores token and user on successful login", async () => {
            const userData = { email: "josh@dcg.com", role: "admin", id: "1" };
            api.post.mockResolvedValue({
                success: true,
                token: "new-jwt",
                user: userData,
            });

            let authRef;
            renderWithAuth((auth) => {
                authRef = auth;
            });

            // Wait for initial loading to finish
            await waitFor(() => {
                expect(screen.getByTestId("loading")).toHaveTextContent("false");
            });

            await act(async () => {
                const result = await authRef.login("josh@dcg.com", "password123", true);
                expect(result.success).toBe(true);
            });

            await waitFor(() => {
                expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
            });
            expect(localStorage.getItem("dcg_admin_token")).toBe("new-jwt");
        });

        it("returns error on failed login", async () => {
            api.post.mockResolvedValue({
                success: false,
                message: "Invalid credentials",
            });

            let authRef;
            renderWithAuth((auth) => {
                authRef = auth;
            });

            await waitFor(() => {
                expect(screen.getByTestId("loading")).toHaveTextContent("false");
            });

            let result;
            await act(async () => {
                result = await authRef.login("josh@dcg.com", "wrong");
            });
            expect(result.success).toBe(false);
            expect(result.message).toBe("Invalid credentials");
        });

        it("handles network errors during login", async () => {
            api.post.mockRejectedValue({
                response: { data: { message: "Server error" } },
            });

            let authRef;
            renderWithAuth((auth) => {
                authRef = auth;
            });

            await waitFor(() => {
                expect(screen.getByTestId("loading")).toHaveTextContent("false");
            });

            let result;
            await act(async () => {
                result = await authRef.login("josh@dcg.com", "pass");
            });
            expect(result.success).toBe(false);
            expect(result.message).toBe("Server error");
        });
    });

    describe("logout", () => {
        it("clears all storage and resets state", async () => {
            const fakeUser = { email: "josh@dcg.com", role: "admin" };
            jwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

            localStorage.setItem("dcg_admin_token", "valid-jwt");
            localStorage.setItem("dcg_admin_user", JSON.stringify(fakeUser));
            localStorage.setItem("dcg_admin_remember", "true");

            let authRef;
            renderWithAuth((auth) => {
                authRef = auth;
            });

            await waitFor(() => {
                expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
            });

            act(() => {
                authRef.logout();
            });

            await waitFor(() => {
                expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
            });
            expect(localStorage.getItem("dcg_admin_token")).toBeNull();
            expect(localStorage.getItem("dcg_admin_user")).toBeNull();
            expect(api.setToken).toHaveBeenCalledWith(null);
        });
    });

    describe("idle timeout", () => {
        it("logs out user after 15 minutes of inactivity", async () => {
            const fakeUser = { email: "josh@dcg.com" };
            jwtDecode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 7200 });

            localStorage.setItem("dcg_admin_token", "valid-jwt");
            localStorage.setItem("dcg_admin_user", JSON.stringify(fakeUser));

            renderWithAuth();

            await waitFor(() => {
                expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
            });

            // Advance past the 15-minute idle timeout
            act(() => {
                jest.advanceTimersByTime(15 * 60 * 1000 + 1000);
            });

            await waitFor(() => {
                expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
            });
        });
    });

    describe("useAuth guard", () => {
        it("throws when used outside AuthProvider", () => {
            // Suppress the React error boundary console output
            const spy = jest.spyOn(console, "error").mockImplementation(() => { });
            expect(() => render(<AuthConsumer />)).toThrow(
                "useAuth must be used within an AuthProvider"
            );
            spy.mockRestore();
        });
    });
});
