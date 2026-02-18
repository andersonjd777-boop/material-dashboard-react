/**
 * ErrorBoundary Unit Tests
 * Tests: error catch, fallback UI, retry, custom fallback, error reporting
 *
 * Strategy: Mock all Material Dashboard components and OpenReplay to avoid
 * needing ThemeProvider. Focus on the error boundary behavior: catching errors,
 * rendering fallback vs children, retry, and error reporting.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mocks (before import) ──────────────────────────────────────

// Mock Material Dashboard components
jest.mock("components/MDBox", () => {
    return function MockMDBox(props) {
        return <div data-testid="mdbox" {...props}>{props.children}</div>;
    };
});

jest.mock("components/MDTypography", () => {
    return function MockMDTypography(props) {
        return <span {...props}>{props.children}</span>;
    };
});

jest.mock("@mui/material/Card", () => {
    return function MockCard(props) {
        return <div {...props}>{props.children}</div>;
    };
});

jest.mock("@mui/material/Button", () => {
    return function MockButton(props) {
        return <button {...props}>{props.children}</button>;
    };
});

jest.mock("@mui/material/Icon", () => {
    return function MockIcon(props) {
        return <span {...props}>{props.children}</span>;
    };
});

jest.mock("services/openreplay", () => ({
    trackError: jest.fn(),
    trackEvent: jest.fn(),
}));

jest.mock("services/logger", () => ({
    __esModule: true,
    default: {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    },
}));

// Import AFTER mocks
import ErrorBoundary from "./index";
const { trackError, trackEvent } = require("services/openreplay");

// A component that throws on demand
function ThrowingComponent({ shouldThrow = true }) {
    if (shouldThrow) {
        throw new Error("Test explosion");
    }
    return <div data-testid="child-content">Working component</div>;
}

// Suppress noisy React error boundary console output
beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => { });
    jest.clearAllMocks();
});

afterEach(() => {
    console.error.mockRestore();
});

describe("ErrorBoundary", () => {
    it("renders children when no error occurs", () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("renders default fallback UI when child throws", () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>
        );

        expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("calls onError callback when error is caught", () => {
        const onError = jest.fn();

        render(
            <ErrorBoundary onError={onError}>
                <ThrowingComponent />
            </ErrorBoundary>
        );

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Test explosion" }),
            expect.objectContaining({ componentStack: expect.any(String) })
        );
    });

    it("reports error to OpenReplay", () => {
        render(
            <ErrorBoundary name="TestBoundary">
                <ThrowingComponent />
            </ErrorBoundary>
        );

        expect(trackError).toHaveBeenCalledWith(
            expect.objectContaining({ message: "Test explosion" }),
            expect.objectContaining({ errorBoundary: "TestBoundary" })
        );
        expect(trackEvent).toHaveBeenCalledWith(
            "error:react_component_crash",
            expect.objectContaining({
                errorMessage: "Test explosion",
                boundaryName: "TestBoundary",
            })
        );
    });

    it("renders custom fallback when provided", () => {
        const customFallback = (error, retry) => (
            <div>
                <span data-testid="custom-error">{error.message}</span>
                <button data-testid="custom-retry" onClick={retry}>
                    Custom Retry
                </button>
            </div>
        );

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowingComponent />
            </ErrorBoundary>
        );

        expect(screen.getByTestId("custom-error")).toHaveTextContent("Test explosion");
        expect(screen.getByTestId("custom-retry")).toBeInTheDocument();
    });

    it("recovers from error when Try Again is clicked", () => {
        let shouldThrow = true;
        function ConditionalThrower() {
            if (shouldThrow) throw new Error("Boom");
            return <div data-testid="recovered">Recovered!</div>;
        }

        render(
            <ErrorBoundary>
                <ConditionalThrower />
            </ErrorBoundary>
        );

        expect(screen.getByText("Something went wrong")).toBeInTheDocument();

        // Stop throwing and retry
        shouldThrow = false;
        fireEvent.click(screen.getByText("Try Again"));

        expect(screen.getByTestId("recovered")).toBeInTheDocument();
    });

    it("displays error ID on the fallback page", () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>
        );

        expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
    });
});
