/**
 * ProtectedRoute Unit Tests
 * Tests: auth redirect, loading state, role-based access control
 *
 * Strategy: Mock react-router-dom hooks so we don't need MemoryRouter
 * (avoids react-router-dom's broken "main" field in package.json for jest).
 * Also mock Material Dashboard components since they require ThemeProvider.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────────

// Mock react-router-dom — provides Navigate, useLocation
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    Navigate: (props) => {
        mockNavigate(props);
        return <div data-testid="navigate" data-to={props.to} />;
    },
    useLocation: () => ({ pathname: "/protected" }),
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock("context/AuthContext", () => ({
    useAuth: () => mockUseAuth(),
}));

// Mock Material Dashboard components
jest.mock("components/MDBox", () => {
    return function MockMDBox(props) {
        return <div data-testid="mdbox" {...props}>{props.children}</div>;
    };
});

jest.mock("components/MDTypography", () => {
    return function MockMDTypography(props) {
        return <span data-testid="mdtypo" {...props}>{props.children}</span>;
    };
});

jest.mock("@mui/material/CircularProgress", () => {
    return function MockCircularProgress() {
        return <div role="progressbar" data-testid="spinner" />;
    };
});

// Import AFTER mocks
import ProtectedRoute from "./index";

beforeEach(() => {
    jest.clearAllMocks();
});

describe("ProtectedRoute", () => {
    it("renders children when authenticated with no role requirements", () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            user: { email: "josh@dcg.com", role: "admin" },
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Dashboard</div>
            </ProtectedRoute>
        );

        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("redirects to sign-in when not authenticated", () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            loading: false,
            user: null,
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Dashboard</div>
            </ProtectedRoute>
        );

        expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
        // Should render <Navigate to="/authentication/sign-in">
        const nav = screen.getByTestId("navigate");
        expect(nav).toHaveAttribute("data-to", "/authentication/sign-in");
    });

    it("shows loading spinner while auth is loading", () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            loading: true,
            user: null,
        });

        render(
            <ProtectedRoute>
                <div data-testid="protected-content">Dashboard</div>
            </ProtectedRoute>
        );

        expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
        expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("allows access when user has required role", () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            user: { email: "josh@dcg.com", role: "admin" },
        });

        render(
            <ProtectedRoute requiredRoles={["admin", "manager"]}>
                <div data-testid="protected-content">Admin Page</div>
            </ProtectedRoute>
        );

        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("shows access denied when user lacks required role", () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            user: { email: "viewer@dcg.com", role: "viewer" },
        });

        render(
            <ProtectedRoute requiredRoles={["admin"]}>
                <div data-testid="protected-content">Admin Only</div>
            </ProtectedRoute>
        );

        expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    });

    it("defaults to viewer role when user has no role field", () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            user: { email: "norole@dcg.com" }, // no role field
        });

        render(
            <ProtectedRoute requiredRoles={["viewer"]}>
                <div data-testid="protected-content">Viewer Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
});
