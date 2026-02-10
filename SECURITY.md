# Security Policy — DCG Admin Dashboard

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Email**: security@directconnectglobal.com
2. **Subject**: `[SECURITY] DCG Admin Dashboard — <brief description>`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**Do NOT** open a public GitHub issue for security vulnerabilities.

We will acknowledge receipt within 48 hours and aim to resolve critical vulnerabilities within 7 days.

## Security Practices

- All dependencies are monitored via Dependabot
- CI/CD pipeline includes `npm audit` on every build
- Source maps are disabled in production builds
- All external links use `rel="noopener noreferrer"`
- CSP (Content Security Policy) is enforced via meta tag
- Authentication uses JWT with expiry and idle timeout
- All API calls use Authorization headers (no token-in-URL)
- Session replay (OpenReplay) sanitizes sensitive fields
