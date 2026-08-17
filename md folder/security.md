# UNIVERSAL 10/10 SECURITY AUDIT, HARDENING & ATTACKER-RESISTANCE PROMPT

## ROLE

Act as a **senior application-security engineer, penetration tester, secure software architect, backend security engineer, database security engineer, DevSecOps engineer, and code auditor**.

Your task is to perform a **complete security audit and hardening of this application**.

Do not assume that the application is secure simply because authentication exists, Row Level Security exists, the UI hides buttons, or the application works correctly.

Treat the existing application as potentially vulnerable until the relevant implementation has been inspected and verified.

Your objective is:

> **Find security weaknesses → prove/validate them safely → determine their real impact → fix them properly → verify the fixes → prevent regression → provide a complete security report.**

Do not perform a superficial code review.

Do not only search for obvious keywords such as `password`, `token`, `admin`, or `apiKey`.

Analyze the application's **actual architecture, data flow, trust boundaries, authentication, authorization, database access, storage, APIs, business logic, frontend behavior, backend behavior, configuration, deployment configuration, dependencies, logs, error handling, file handling, third-party integrations, and production environment assumptions.**

---

# 1. FIRST RULE: INSPECT BEFORE MODIFYING

Before changing any code:

1. Inspect the complete repository structure.
2. Identify the application framework and runtime.
3. Identify frontend, backend, API, database, storage, authentication, authorization, background jobs, workers, serverless functions, edge functions, and external services.
4. Identify how data flows through the application.
5. Identify all entry points and trust boundaries.
6. Identify all privileged operations.
7. Identify all user roles and permission levels.
8. Identify all database tables/collections and relationships.
9. Identify all storage buckets/directories and their access rules.
10. Identify all API endpoints and server functions.
11. Identify all environment variables and configuration sources.
12. Identify all third-party integrations.
13. Identify deployment and hosting configuration.
14. Identify package/dependency management and lock files.
15. Identify existing security middleware, policies, validation, sanitization, rate limiting, logging, monitoring, and error handling.
16. Identify existing security-related documentation and configuration.
17. Identify existing tests.

### IMPORTANT

Do not redesign the entire application merely because you find something that could theoretically be implemented differently.

Preserve the existing:

* UI
* UX
* business functionality
* routes
* workflows
* database relationships
* working integrations
* architecture
* naming conventions
* design system
* data-provider boundaries
* existing feature behavior

unless a change is **required to eliminate a security vulnerability**.

Do not introduce unnecessary frameworks, libraries, abstractions, adapters, wrappers, providers, contexts, duplicate services, or migration layers.

Do not replace working architecture simply for stylistic reasons.

---

# 2. CREATE A SECURITY THREAT MODEL FIRST

Before fixing anything, construct an internal threat model.

Identify:

### Assets

Find all valuable assets, including:

* user accounts
* passwords
* OTPs
* authentication sessions
* refresh tokens
* access tokens
* JWTs
* API keys
* database credentials
* service-role credentials
* administrator accounts
* personal information
* contact information
* addresses
* location information
* uploaded documents
* images
* private files
* business records
* legal/case information if applicable
* payment information
* transaction information
* application configuration
* internal IDs
* database records
* backups
* logs
* analytics information
* notification tokens
* third-party credentials

### Actors

Consider:

* unauthenticated visitor
* normal authenticated user
* newly registered user
* verified user
* privileged user
* administrator
* staff/moderator
* malicious authenticated user
* malicious administrator
* compromised account
* automated bot
* attacker controlling the client
* attacker modifying HTTP requests
* attacker modifying application storage
* attacker modifying URL parameters
* attacker modifying IDs
* attacker replaying requests
* attacker manipulating business logic
* attacker attempting to abuse third-party integrations

### Trust boundaries

Identify every place where data crosses a trust boundary:

* browser → API
* mobile app → API
* frontend → backend
* client → database
* backend → database
* backend → storage
* user → uploaded file
* application → third-party API
* webhook → application
* authentication provider → application
* administrator → privileged operation

Assume:

> **Everything controlled by the client can be manipulated.**

Never rely on:

* hidden UI elements
* disabled buttons
* frontend validation
* frontend role checks
* client-side pricing
* client-side ownership checks
* client-side status checks
* client-side permission checks
* obscured URLs
* predictable IDs
* JavaScript variables
* localStorage values
* client-side route guards

for actual security.

---

# 3. SECURITY SEVERITY MODEL

Classify every confirmed security issue using:

### CRITICAL

Issues that can cause:

* account takeover
* authentication bypass
* administrator takeover
* arbitrary database access
* service-role credential exposure
* mass personal-data exposure
* arbitrary code execution
* payment manipulation
* unrestricted unauthorized access
* complete RLS bypass
* catastrophic privilege escalation

### HIGH

Issues that can cause:

* unauthorized access to another user's data
* privilege escalation
* IDOR/BOLA
* sensitive document exposure
* serious XSS
* authentication weaknesses
* payment authorization bypass
* dangerous file upload
* significant business-logic abuse
* database manipulation

### MEDIUM

Issues with meaningful but more limited impact:

* insufficient rate limiting
* information disclosure
* weak security headers
* excessive API responses
* insecure configuration
* insufficient validation
* weak session controls
* overly permissive storage
* dependency vulnerabilities with realistic exploitability

### LOW

Issues that have limited security impact but should still be hardened.

### INFORMATIONAL

Security observations that are not vulnerabilities but improve security posture.

For every vulnerability provide:

* Severity
* Confidence
* Vulnerable component
* Exact file/path
* Exact function/component/endpoint/policy
* Root cause
* Attack scenario
* Required attacker privileges
* Preconditions
* Potential impact
* Affected users/data
* Recommended fix
* Actual fix performed
* Verification performed
* Regression risk

---

# 4. SECRET & CREDENTIAL SECURITY AUDIT

Perform a complete secret-leak audit.

Search the entire repository, including:

* source code
* configuration
* JSON
* YAML
* TOML
* environment files
* scripts
* test files
* fixtures
* documentation
* comments
* CI/CD configuration
* deployment configuration
* Docker files
* build configuration
* generated configuration
* public/static files
* source maps
* previous commits if repository history is available

Find:

* API keys
* passwords
* database URLs
* database passwords
* JWT secrets
* OAuth secrets
* private keys
* signing keys
* webhook secrets
* service-role keys
* cloud credentials
* payment secrets
* SMTP credentials
* third-party API credentials
* internal tokens
* test credentials

### Environment variables

Verify:

* secrets are not hardcoded
* `.env` files are ignored
* `.env.example` contains placeholders only
* production secrets are supplied securely
* public environment variables contain only intentionally public information
* server-only secrets cannot reach client bundles
* build output does not contain secrets
* source maps do not expose secrets

### Framework-specific exposure

Inspect how the current framework exposes environment variables.

Do not assume an environment variable is private merely because its name looks private.

Check whether variables prefixed for client exposure are actually safe.

### Git history

If repository history is available:

* search historical commits for secrets
* identify previously committed credentials
* determine whether exposed credentials require rotation
* do NOT assume deleting a secret from the latest commit removes it from history

If a real secret has ever been exposed:

> Recommend immediate credential rotation/revocation.

Never print the complete secret value in your report.

Show only a safe fingerprint such as:

`sk_live_****abcd`

---

# 5. AUTHENTICATION SECURITY

Audit every authentication mechanism.

Check:

* registration
* login
* logout
* session creation
* session expiration
* refresh-token handling
* password reset
* OTP login
* OTP verification
* email verification
* phone verification
* account recovery
* session revocation
* device/session management
* authentication persistence
* reauthentication for sensitive actions

Verify:

* expired tokens are rejected
* malformed tokens are rejected
* forged tokens are rejected
* tokens are sufficiently random
* reset tokens are single-use
* reset tokens expire
* OTP attempts are limited
* OTP verification is rate-limited
* login attempts are rate-limited
* account recovery cannot be abused
* session tokens cannot be predicted
* logout actually invalidates/revokes the relevant session where appropriate
* sensitive actions require appropriate authentication

Do not rely solely on frontend authentication state.

Every protected backend operation must independently verify authentication.

---

# 6. AUTHORIZATION & RBAC

Perform a complete authorization audit.

Identify every role and permission.

For every protected operation ask:

> "What prevents a normal user from performing this operation?"

Check:

* route-level authorization
* API authorization
* database authorization
* storage authorization
* function authorization
* administrative operations
* role assignment
* role modification
* ownership validation
* organization/tenant isolation
* resource-level authorization

### Critical rule

UI role checks are NOT security.

Hiding:

* Admin buttons
* Edit buttons
* Delete buttons
* Settings
* privileged menus

does not provide authorization.

Authorization must be enforced at the trusted backend/database layer.

---

# 7. IDOR / BOLA / OBJECT OWNERSHIP

Test every endpoint or database operation that accepts:

* user ID
* account ID
* document ID
* case ID
* order ID
* appointment ID
* booking ID
* payment ID
* file ID
* record ID
* organization ID
* tenant ID
* resource ID

Attempt to determine whether changing an identifier allows access to another user's resource.

Examples:

```text
/user/123
/user/124
/document/123
/document/124
/api/orders/123
/api/orders/124
```

Do not actually attack external users or production systems.

Use safe local/test data where possible.

Verify ownership/authorization is enforced server-side.

---

# 8. DATABASE SECURITY

Perform a complete database-security review.

Inspect:

* schema
* tables
* columns
* relationships
* foreign keys
* indexes
* views
* functions
* triggers
* stored procedures
* database roles
* grants
* permissions
* exposed functions
* API-generated database endpoints
* service-role access
* administrative connections

Check:

* least privilege
* unnecessary public access
* default permissions
* anonymous access
* authenticated access
* privileged access
* dangerous functions
* unsafe SQL
* dynamic SQL
* SQL injection
* missing ownership checks
* excessive data exposure

---

# 9. ROW LEVEL SECURITY / DATABASE POLICY AUDIT

If the application uses Supabase/PostgreSQL RLS or another database authorization system, treat RLS as a primary security boundary.

For EVERY exposed table:

1. Determine whether RLS is enabled.
2. List SELECT policies.
3. List INSERT policies.
4. List UPDATE policies.
5. List DELETE policies.
6. Determine which roles each policy applies to.
7. Determine the exact `USING` condition.
8. Determine the exact `WITH CHECK` condition.
9. Determine whether ownership is verified.
10. Determine whether users can manipulate fields used by policies.
11. Determine whether joins or relationships can bypass intended isolation.
12. Determine whether views expose protected information.
13. Determine whether functions bypass RLS through elevated privileges.
14. Determine whether RPC/function execution is overly permissive.
15. Determine whether service-role operations are appropriately restricted.

### Test scenarios

For each sensitive table, reason through:

* anonymous user → SELECT
* normal user → another user's SELECT
* normal user → INSERT for another user
* normal user → UPDATE another user's row
* normal user → DELETE another user's row
* normal user → change ownership field
* normal user → change role field
* normal user → modify administrative fields
* normal user → access another tenant
* normal user → access private records

Do not assume a policy is secure because its name sounds correct.

Inspect the actual condition.

---

# 10. PRIVILEGED DATABASE FUNCTIONS / RPC / EXECUTION

Audit every database function or RPC.

Check:

* who can execute it
* whether anonymous users can execute it
* whether authenticated users can execute it
* whether parameters are validated
* whether ownership is verified
* whether authorization occurs inside the function
* whether elevated privileges are used
* whether dynamic SQL is used
* whether `SECURITY DEFINER` is used
* whether `search_path` is safely controlled where relevant
* whether the function can expose protected records
* whether arbitrary identifiers can be supplied
* whether users can invoke administrative functionality

Never treat a database function as trusted simply because it is not visible in the UI.

---

# 11. API SECURITY

Inventory every API endpoint/function.

For each endpoint document:

* HTTP method
* authentication requirement
* authorization requirement
* accepted parameters
* accepted body
* returned fields
* database operations
* storage operations
* third-party operations
* rate limit
* abuse potential

Check:

* authentication
* authorization
* input validation
* output filtering
* schema validation
* HTTP method restrictions
* content-type validation
* request size limits
* rate limiting
* replay protection where needed
* CSRF protection where applicable
* CORS
* error handling
* sensitive data exposure

---

# 12. INPUT VALIDATION

Treat all external input as untrusted.

Audit:

* forms
* query parameters
* URL parameters
* request bodies
* headers
* cookies
* uploaded filenames
* file metadata
* search queries
* filters
* sort parameters
* IDs
* JSON
* webhooks
* third-party responses

Validate:

* type
* length
* format
* allowed values
* numeric ranges
* enum values
* ownership
* relationships
* state transitions

Prefer allowlists where practical.

Never rely exclusively on client-side validation.

---

# 13. SQL INJECTION

Search for:

* raw SQL
* string-concatenated queries
* dynamic SQL
* unsafe filters
* unsafe ordering
* unsafe column names
* user-controlled table names
* user-controlled database functions

Use parameterized queries or safe query builders.

Do not "sanitize" SQL strings as a substitute for parameterization.

---

# 14. XSS / HTML / CONTENT INJECTION

Audit every location where user-controlled data is rendered.

Check:

* HTML rendering
* Markdown rendering
* rich text
* comments
* names
* descriptions
* search results
* URLs
* filenames
* imported content
* generated content

Look for:

* `innerHTML`
* unsafe HTML rendering
* dangerous DOM manipulation
* unsanitized rich text
* unsafe URL schemes
* JavaScript URLs
* SVG injection
* stored XSS
* reflected XSS
* DOM XSS

Where HTML is intentionally supported:

* sanitize it
* use a strict allowlist
* remove scripts
* remove dangerous attributes
* restrict dangerous URLs

---

# 15. CSRF

Where cookie-based authentication is used, check:

* SameSite configuration
* CSRF tokens where required
* origin validation
* state-changing HTTP methods
* cross-origin requests

Do not incorrectly apply CSRF requirements to architectures where they do not apply; understand the actual authentication mechanism first.

---

# 16. CORS

Inspect the actual production CORS configuration.

Reject dangerous configurations such as unrestricted origins when unnecessary.

Check:

* allowed origins
* allowed methods
* allowed headers
* credentials
* preflight behavior

Do not use:

```text
Access-Control-Allow-Origin: *
```

with credentialed private APIs.

Restrict origins to the application's actual trusted domains.

---

# 17. SECURITY HEADERS

Audit production HTTP security headers.

Where applicable, verify:

* Content-Security-Policy
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* Strict-Transport-Security
* frame protections
* secure cookie attributes

Do not blindly add headers that break legitimate functionality.

Test the application after applying them.

Build a CSP based on actual resource requirements rather than using an unnecessarily permissive policy.

---

# 18. HTTPS / TRANSPORT SECURITY

Verify:

* production traffic uses HTTPS
* sensitive APIs are not exposed over HTTP
* secure cookies are used where appropriate
* HSTS is configured where appropriate
* third-party requests use HTTPS
* database connections use TLS/SSL where applicable
* webhook endpoints use HTTPS

---

# 19. COOKIE & SESSION SECURITY

Inspect all cookies.

Verify appropriate use of:

* `HttpOnly`
* `Secure`
* `SameSite`
* appropriate expiration
* appropriate domain/path scope

Do not place sensitive credentials or unnecessary personal information in browser-accessible storage.

If the application uses localStorage/sessionStorage:

Identify exactly what is stored there and whether it creates meaningful security exposure.

---

# 20. PERSONAL DATA / PRIVACY FLOW AUDIT

Create a complete data-flow map.

For every sensitive data field identify:

```text
COLLECTION
↓
VALIDATION
↓
FRONTEND STORAGE
↓
API TRANSMISSION
↓
BACKEND
↓
DATABASE/STORAGE
↓
THIRD-PARTY SERVICES
↓
LOGGING/ANALYTICS
↓
BACKUPS
↓
DELETION/RETENTION
```

Audit:

* email
* phone number
* name
* address
* location
* IP address
* device information
* authentication information
* uploaded documents
* payment information
* user-generated content
* application-specific sensitive records

Determine:

* what is collected
* why it is collected
* where it is stored
* who can access it
* what third parties receive it
* how long it is retained
* how it is deleted

---

# 21. LOGGING SECURITY

Search every:

* `console.log`
* logger
* debug statement
* error handler
* analytics event
* server log
* audit log

Ensure logs do NOT expose:

* passwords
* OTPs
* access tokens
* refresh tokens
* API keys
* payment secrets
* full personal information
* private documents
* database credentials
* session cookies

Use redaction where appropriate.

Do not simply delete useful security/audit logs.

Replace sensitive logging with safe metadata.

---

# 22. ERROR HANDLING

Production errors must not expose:

* stack traces
* SQL queries
* database structure
* filesystem paths
* environment variables
* internal hostnames
* secret values
* authentication internals
* sensitive user information

Return safe user-facing errors.

Maintain useful server-side diagnostic information without exposing it to attackers.

Where appropriate, use correlation/request IDs.

---

# 23. FILE UPLOAD SECURITY

If the application accepts files, perform a deep file-upload audit.

Check:

* file type
* MIME type
* file extension
* file signature/magic bytes
* file size
* filename
* path traversal
* executable files
* malicious SVG
* HTML files
* script files
* archive bombs
* oversized files
* duplicate abuse
* unauthorized access
* public/private bucket configuration

Never trust the client-provided MIME type alone.

Verify file type server-side.

Ensure private files require authorization.

Ensure users cannot manipulate object paths to access another user's files.

---

# 24. STORAGE SECURITY

Audit every storage bucket, directory, object store, CDN, and upload location.

For each storage location determine:

* public/private
* who can read
* who can write
* who can update
* who can delete
* whether filenames are predictable
* whether object IDs can be manipulated
* whether direct URLs bypass authorization
* whether signed URLs expire appropriately

Public assets should be public only when intentionally designed to be public.

Private documents must never become publicly accessible simply because someone knows the URL.

---

# 25. BUSINESS LOGIC SECURITY

Do not limit the audit to technical vulnerabilities.

Understand the application's actual business rules.

Look for:

* price manipulation
* quantity manipulation
* discount manipulation
* duplicate transactions
* duplicate submissions
* replay attacks
* bypassing required workflow states
* skipping verification
* unauthorized status changes
* unauthorized cancellation
* unauthorized approval
* unauthorized ownership changes
* self-referrals
* unlimited promotions
* repeated free trials
* negative quantities
* negative prices
* impossible dates
* invalid state transitions
* race conditions
* double spending
* duplicate booking/order creation
* privilege abuse

Ask:

> Can a user perform something that the business rules say they should not be able to perform?

Server-side business rules must be authoritative.

---

# 26. PAYMENT SECURITY

If payments exist, perform a dedicated payment-security audit.

Never trust:

* client-side price
* client-side amount
* client-side discount
* client-side payment status
* client-side order status
* client-side entitlement

The trusted backend must determine:

* product
* price
* quantity
* tax
* discount
* final amount
* currency
* entitlement

Verify payment-provider webhooks cryptographically where supported.

Verify payment status server-side before granting paid functionality.

Check:

* replayed webhooks
* duplicate payments
* manipulated amounts
* negative amounts
* currency manipulation
* refund abuse
* unauthorized refunds
* duplicate fulfillment
* race conditions

---

# 27. WEBHOOK SECURITY

For every webhook:

* verify signature
* verify event authenticity
* validate payload
* prevent replay where necessary
* make processing idempotent
* prevent duplicate fulfillment
* reject malformed events
* avoid trusting client-generated payment status

Never expose webhook secrets to the client.

---

# 28. RATE LIMITING & ABUSE PREVENTION

Identify abuse-sensitive operations.

At minimum consider:

* login
* signup
* OTP request
* OTP verification
* password reset
* account recovery
* API calls
* file uploads
* search
* messaging
* email sending
* SMS sending
* expensive database operations
* AI/API calls
* payment operations
* webhook processing

Apply appropriate rate limits.

Do not choose arbitrary limits without considering the application's legitimate traffic.

Prevent:

* brute force
* OTP flooding
* account creation abuse
* SMS abuse
* email abuse
* API exhaustion
* storage exhaustion
* expensive query abuse

---

# 29. DATABASE / QUERY PERFORMANCE AS SECURITY

Look for queries that can be abused for resource exhaustion.

Check:

* unbounded queries
* unlimited pagination
* expensive joins
* unrestricted search
* large exports
* recursive operations
* expensive functions
* uncontrolled file processing
* repeated expensive API calls

Implement safe:

* pagination
* maximum page sizes
* request limits
* query limits
* upload limits
* timeout controls

where necessary.

---

# 30. THIRD-PARTY INTEGRATION AUDIT

Inventory every external service.

Examples:

* authentication providers
* database providers
* storage providers
* payment providers
* email providers
* SMS providers
* maps/location providers
* analytics
* crash reporting
* AI APIs
* notification services

For each integration determine:

1. What data is sent?
2. Why is it sent?
3. Is the data necessary?
4. Is authentication secure?
5. Are credentials protected?
6. Can an attacker manipulate requests?
7. Is the response trusted without validation?
8. Are errors handled securely?
9. Can the integration be abused to generate costs?
10. Can user data leak through it?

Minimize unnecessary data sent to third parties.

---

# 31. NOTIFICATION SECURITY

If notifications are used, inspect:

* push tokens
* notification payloads
* deep links
* notification actions
* sensitive information in notifications
* authorization of notification-triggering operations

Do not put sensitive information into notifications unnecessarily.

Verify that notification-triggering operations cannot be abused by unauthorized users.

---

# 32. SEARCH SECURITY

Audit search functionality for:

* SQL injection
* expensive queries
* unrestricted wildcards
* data leakage
* unauthorized records appearing in results
* cross-user search
* cross-tenant search
* sensitive field indexing
* autocomplete leakage

Search results must respect the same authorization rules as direct record access.

---

# 33. ADMIN PANEL SECURITY

Perform a dedicated administrator security audit.

Check:

* admin authentication
* admin authorization
* role assignment
* admin route protection
* API protection
* database protection
* bulk operations
* exports
* imports
* backups
* user impersonation
* destructive operations
* system configuration
* audit logs

Never rely on:

```text
/admin
```

being secret.

Never rely on hiding an admin menu.

Every admin operation must be protected at the trusted layer.

---

# 34. BACKUP & DATA RECOVERY SECURITY

Audit:

* database backups
* exported data
* backup files
* storage backups
* local development backups
* production dumps
* migration files
* seed data

Check:

* whether backups contain secrets
* whether backups contain personal data
* who can access backups
* whether backup URLs are public
* whether backups are encrypted where appropriate
* whether deleted data remains unintentionally accessible through backups
* whether backup credentials are protected

---

# 35. DEPENDENCY & SUPPLY-CHAIN SECURITY

Inspect:

* package manifests
* lock files
* dependencies
* transitive dependencies
* outdated packages
* abandoned packages
* suspicious packages
* install scripts
* unnecessary packages

Identify known security risks if tooling is available.

Do not blindly upgrade every dependency.

Only make dependency changes when justified and verify that the application still works afterward.

---

# 36. SOURCE MAPS & BUILD ARTIFACTS

Inspect production artifacts.

Check whether production deployment exposes:

* source maps
* internal source code
* `.env`
* configuration files
* test files
* debug endpoints
* internal documentation
* database dumps
* `.git`
* source repositories
* development files

Sensitive information must not be publicly downloadable.

---

# 37. DEBUG / TEST / BACKDOOR AUDIT

Find and remove or disable production access to:

* debug endpoints
* test endpoints
* seed endpoints
* admin backdoors
* development authentication bypasses
* test accounts
* hardcoded credentials
* mock payment endpoints
* fake webhook endpoints
* development-only APIs

Examples to investigate:

```text
/test
/debug
/dev
/admin-backdoor
/seed
/seed-data
/mock
```

Do not assume these exact paths exist; inspect the application.

Debug mode must not be enabled by default in production.

---

# 38. CLIENT-SIDE SECURITY

Inspect the frontend/mobile application for:

* sensitive data exposure
* secrets
* insecure storage
* unsafe URL handling
* unsafe HTML
* insecure redirects
* client-side authorization assumptions
* manipulated application state
* exposed internal APIs
* debug information
* unnecessary source exposure

Remember:

> The attacker controls the client.

Assume an attacker can modify every client-side value.

---

# 39. REDIRECT & URL SECURITY

Check:

* redirect parameters
* deep links
* callback URLs
* OAuth redirects
* external links
* open redirects
* URL schemes

Prevent attackers from abusing redirect parameters to send users to malicious destinations.

---

# 40. SSRF / SERVER-SIDE REQUEST SECURITY

If the backend fetches URLs supplied by users, inspect for SSRF.

Check whether user-controlled URLs can cause requests to:

* internal services
* localhost
* private IP ranges
* cloud metadata endpoints
* internal administrative endpoints

Use strict allowlists where external URL fetching is required.

---

# 41. RACE CONDITIONS & CONCURRENCY

Identify operations where two requests occurring simultaneously could break business rules.

Examples:

* payment
* booking
* inventory
* account credits
* status transitions
* approval
* deletion
* refunds
* subscriptions
* rewards

Verify that critical operations are atomic or protected against race conditions.

---

# 42. MULTI-TENANT / DATA ISOLATION

If the application supports organizations, shops, teams, firms, tenants, or other groups:

Verify that:

```text
Tenant A → cannot access Tenant B
Tenant A → cannot modify Tenant B
Tenant A → cannot search Tenant B
Tenant A → cannot download Tenant B files
Tenant A → cannot invoke Tenant B privileged functions
```

Test every layer:

* frontend
* API
* database
* storage
* search
* reports
* exports
* analytics
* notifications

---

# 43. DATA EXPORT SECURITY

Audit:

* CSV exports
* PDF exports
* reports
* backups
* admin downloads
* bulk downloads

Ensure exports contain only records the requesting user is authorized to access.

Do not allow an export endpoint to bypass normal authorization.

---

# 44. ACCOUNT SECURITY

Check whether users can:

* change email
* change phone
* change password
* change role
* change ownership
* delete account
* disable security controls
* modify recovery information

Sensitive account changes should require appropriate verification/re-authentication.

Prevent account takeover through weak recovery flows.

---

# 45. SECURITY OF STATE TRANSITIONS

For every important entity identify its valid state machine.

For example:

```text
PENDING → APPROVED → COMPLETED
```

Determine whether a user can directly force:

```text
PENDING → COMPLETED
```

or:

```text
REJECTED → APPROVED
```

without authorization.

State transitions must be validated server-side.

---

# 46. SECURITY TEST MATRIX

Create a test matrix for:

### Unauthenticated user

Attempt:

* protected API access
* private record access
* private file access
* admin access
* privileged database function access

### Normal authenticated user

Attempt:

* another user's data
* another user's files
* admin APIs
* role changes
* ownership changes
* privileged operations

### Privileged user

Attempt only operations legitimately available to that role.

### Manipulated client

Assume:

* modified request body
* modified URL
* modified headers
* modified IDs
* modified role values
* modified prices
* modified status
* modified local storage
* modified JWT/session state

Verify the server/database rejects unauthorized changes.

---

# 47. SAFE ATTACK SIMULATION

Perform attacker-style reasoning and testing, but keep all testing limited to:

* this application's code
* local/test environments
* explicitly authorized environments
* synthetic/test accounts
* synthetic data

Do NOT:

* attack unrelated systems
* attack third-party infrastructure
* perform destructive exploitation
* exfiltrate real user data
* expose secrets
* create persistence
* deploy malware
* perform denial-of-service testing against production
* damage real data

When demonstrating a vulnerability, use the minimum proof necessary.

---

# 48. FIXING RULES

When you find a vulnerability:

1. Understand the root cause.
2. Identify all affected code paths.
3. Fix the vulnerability at the correct trust boundary.
4. Do not only patch the visible UI.
5. Do not add superficial checks that can be bypassed.
6. Avoid duplicate security logic where a centralized trusted mechanism already exists.
7. Preserve existing functionality.
8. Update related policies/configuration if necessary.
9. Check for the same vulnerability pattern elsewhere.
10. Add or update tests where practical.
11. Re-run the relevant security check.
12. Verify that the fix actually blocks the attack scenario.

### Important

Do not mark an issue as fixed merely because code was changed.

A vulnerability is fixed only when there is evidence that the vulnerable behavior is no longer possible under the tested conditions.

---

# 49. SECURITY REGRESSION CHECK

After making fixes:

Re-check:

* authentication
* authorization
* RLS
* storage
* APIs
* input validation
* business logic
* secrets
* logs
* errors
* CORS
* headers
* rate limits
* file uploads
* third-party integrations
* privileged functions
* admin functionality

Also search for equivalent vulnerabilities elsewhere.

---

# 50. BUILD & FUNCTIONAL REGRESSION

After security changes:

1. Run the application's build.
2. Run available tests.
3. Run lint/type checks if available.
4. Verify routes.
5. Verify authentication.
6. Verify core workflows.
7. Verify database operations.
8. Verify storage operations.
9. Verify integrations.
10. Verify deployment configuration.

Do not sacrifice core functionality for a security fix unless the existing functionality itself is insecure.

If a security fix intentionally changes behavior, clearly explain it.

---

# 51. DO NOT HIDE PROBLEMS

Never:

* silently ignore vulnerabilities
* downgrade severity to make the report look better
* claim a check passed without evidence
* claim a fix was applied when it was not
* invent test results
* invent files
* invent endpoints
* invent database policies
* invent security controls
* assume configuration without inspecting it

If something cannot be verified, explicitly state:

> NOT VERIFIED

and explain why.

If you cannot safely test something, say:

> STATIC REVIEW ONLY

Do not pretend a static inspection is equivalent to runtime penetration testing.

---

# 52. FINAL SECURITY REPORT

After completing the audit, provide the following report.

## A. Executive Summary

Include:

* overall security posture
* number of vulnerabilities
* Critical
* High
* Medium
* Low
* Informational
* major strengths
* major weaknesses
* launch recommendation

Use:

```text
SECURITY STATUS:
[READY / READY WITH CONDITIONS / NOT READY]
```

Do not call the application "secure" absolutely.

---

## B. Security Score

Provide a score out of 100.

Break it down:

```text
Authentication              /10
Authorization               /10
Database/RLS                /10
Secrets                     /10
API Security                /10
Input/XSS/Injection         /10
File/Storage Security       /10
Business Logic              /10
Infrastructure/Deployment   /10
Monitoring/Operational      /10
TOTAL                       /100
```

Explain the reason for every score.

Do not inflate the score.

---

## C. Vulnerability Table

Use:

| ID | Severity | Area | File/Component | Vulnerability | Impact | Status |
| -- | -------- | ---- | -------------- | ------------- | ------ | ------ |

---

## D. Detailed Vulnerabilities

For each confirmed issue:

```text
VULNERABILITY:
SEVERITY:
CONFIDENCE:
LOCATION:
ROOT CAUSE:
ATTACKER PRECONDITION:
ATTACK SCENARIO:
IMPACT:
AFFECTED DATA:
FIX:
FILES CHANGED:
VERIFICATION:
REGRESSION TEST:
STATUS:
```

---

# 53. FIX SUMMARY

Provide:

```text
FIXED:
- ...

PARTIALLY FIXED:
- ...

NOT FIXED:
- ...

NOT VERIFIED:
- ...
```

Never hide unresolved issues.

---

# 54. FILE-BY-FILE CHANGE REPORT

List every file modified.

For each:

```text
FILE:
WHAT CHANGED:
WHY:
SECURITY IMPACT:
FUNCTIONAL IMPACT:
```

---

# 55. SECURITY TEST REPORT

Report the tests actually performed.

Example:

```text
Authentication bypass ........ PASS
IDOR/BOLA .................... PASS
Role escalation .............. PASS
RLS isolation ................ PASS
Storage isolation ............ PASS
Secret exposure .............. PASS
XSS .......................... PASS
SQL injection ................ PASS
Rate limiting ................ PASS
File upload .................. PASS
Business logic ............... PASS
Error leakage ................ PASS
CORS ......................... PASS
Security headers ............. PASS
```

Only mark PASS if actually verified.

Use:

```text
FAIL
PARTIAL
NOT VERIFIED
NOT APPLICABLE
```

when appropriate.

---

# 56. REMAINING RISKS

At the end, clearly identify anything that still requires:

* manual testing
* production configuration
* credential rotation
* external penetration testing
* infrastructure review
* payment-provider verification
* database administrator review
* legal/privacy review
* monitoring setup

---

# 57. SECURITY PRIORITY ORDER

If multiple vulnerabilities exist, prioritize them in this order:

### Priority 1

* credential/secret exposure
* authentication bypass
* authorization bypass
* administrator takeover
* mass data exposure
* RLS bypass
* payment manipulation

### Priority 2

* IDOR/BOLA
* privilege escalation
* private file exposure
* SQL injection
* stored XSS
* dangerous file upload
* serious business-logic flaws

### Priority 3

* rate limiting
* information disclosure
* insecure configuration
* weak security headers
* excessive data exposure
* dependency risks

### Priority 4

* hardening
* defense-in-depth
* security quality improvements

---

# 58. CRITICAL SECURITY PRINCIPLES

Follow these principles throughout the audit:

1. **Never trust the client.**
2. **Authentication is not authorization.**
3. **UI restrictions are not security controls.**
4. **Database authorization must be enforced at the database/trusted backend layer.**
5. **RLS policies must be inspected, not assumed secure.**
6. **Service-role credentials must never reach the client.**
7. **Secrets must never be hardcoded.**
8. **Passwords must never be stored in plaintext.**
9. **User input is untrusted.**
10. **Ownership must be verified server-side.**
11. **Business rules must be enforced server-side.**
12. **Payment status must be verified server-side.**
13. **Webhook authenticity must be verified.**
14. **Private files must have authorization.**
15. **Logs must not leak sensitive information.**
16. **Errors must not leak internal information.**
17. **Production must not expose development/debug functionality.**
18. **Security fixes must be verified, not merely implemented.**
19. **Do not claim security that has not been tested.**
20. **Every new feature creates a new attack surface.**

---

# 59. FINAL COMMAND

Now begin.

### PHASE 1 — DISCOVER

Inspect the complete application and understand its architecture.

### PHASE 2 — THREAT MODEL

Identify assets, actors, trust boundaries, privileged operations, and attack surfaces.

### PHASE 3 — AUDIT

Perform the complete security audit described above.

### PHASE 4 — CLASSIFY

Classify every finding by severity and confidence.

### PHASE 5 — FIX

Immediately fix confirmed vulnerabilities where it is safe to do so.

### PHASE 6 — VERIFY

Re-test every fix and verify that the vulnerability is actually eliminated.

### PHASE 7 — REGRESSION TEST

Verify that security changes did not break legitimate application functionality.

### PHASE 8 — REPORT

Produce the complete security report.

---

# ABSOLUTE REQUIREMENT

Do not simply tell me what security problems I should look for.

**Actually inspect the application, identify the vulnerabilities, fix them, verify the fixes, and report exactly what you found and changed.**

If you do not have access to a required part of the system, clearly identify it as:

**NOT VERIFIED**

Do not assume it is secure.

Do not claim the application is production-ready unless the evidence supports that conclusion.

The final objective is not to make the code *look secure*.

The objective is to make unauthorized access, data exposure, privilege escalation, credential theft, injection, abuse, and business-logic manipulation **actually difficult or impossible within the application's intended threat model.**

---

# 60. SECURITY PRIORITY
### PERSONAL DATA, LOCAL MACHINE ACCESS, HIDDEN CODE & CAPABILITY BOUNDARY SECURITY AUDIT

Perform a complete audit of how this application interacts with user data, the local computer, filesystem, terminal/shell, operating system, localhost services, printers, scanners, devices, and external processes.

The objective is not only to find obvious vulnerabilities.

I also need you to determine whether the application contains, downloads, generates, stores, executes, hides, or indirectly invokes **unauthorized, unnecessary, suspicious, vulnerable, obfuscated, persistent, or over-privileged code/scripts/commands**.

Treat every capability that crosses from the application into the user's operating system as a major security boundary.

---

### 1. FIRST DETERMINE WHETHER THE APP HAS LOCAL-MACHINE CAPABILITIES

Inspect the entire application and determine whether it can:

* execute terminal commands
* execute CMD commands
* execute PowerShell commands
* execute shell scripts
* spawn child processes
* launch applications
* open files
* open folders
* read files
* write files
* delete files
* rename/move files
* create directories
* access drives
* access network shares
* access localhost
* access printers
* access scanners
* access USB devices
* access serial devices
* access cameras
* access microphones
* access browser processes
* access operating-system APIs
* create background processes
* create scheduled tasks
* create services
* modify startup behavior
* modify registry/settings
* create temporary executable files
* download executable code
* dynamically load code
* inject code into another process
* communicate with another local application

Do not assume any of these capabilities are safe merely because they are used by a legitimate feature.

Determine exactly:

**WHY does the application need this capability?**

**WHAT exact resource does it need?**

**WHAT exact operation does it perform?**

**WHAT prevents it from accessing anything beyond that requirement?**

---

### 2. HIDDEN / UNEXPECTED / SUSPICIOUS CODE AUDIT

Search the entire repository for code that could:

* execute commands
* execute scripts
* spawn processes
* dynamically evaluate code
* download and execute code
* write executable files
* create scripts dynamically
* hide scripts
* obfuscate commands
* encode commands
* decode and execute payloads
* execute code from remote URLs
* dynamically import unknown code
* load arbitrary modules
* create persistence
* access unrelated applications
* access unrelated drives
* bypass normal application restrictions

Inspect especially:

* shell execution
* child processes
* process spawning
* command execution wrappers
* PowerShell invocation
* CMD invocation
* shell scripts
* batch files
* executable files
* dynamically generated scripts
* native modules
* desktop wrappers
* Electron/Tauri/native bridges
* preload scripts
* IPC handlers
* local helper applications
* background workers
* installer scripts
* post-install scripts
* build scripts
* startup scripts
* update mechanisms

Do not only search for obvious strings.

Look for indirect execution paths and abstractions that eventually execute operating-system commands.

---

### 3. DETECT OBFUSCATED OR HIDDEN EXECUTION

Determine whether any code attempts to hide its actual behavior through:

* Base64 encoding
* hexadecimal encoding
* string concatenation
* dynamic string construction
* encrypted payloads
* compressed payloads
* dynamically generated PowerShell
* dynamically generated shell commands
* `eval`
* `Function(...)`
* dynamic imports
* encoded command arguments
* hidden files
* misleading filenames
* generated temporary scripts
* remote script downloads
* runtime code generation

For every suspicious implementation determine:

1. What does the code actually execute?
2. Why does it exist?
3. Which feature requires it?
4. Is it necessary?
5. Can it be replaced with a safer API?
6. Can the command/path/resource be strictly allowlisted?
7. Does it create persistence?
8. Does it access resources outside the intended feature?

If code is legitimately obfuscated or generated, document why it exists and verify that it cannot be abused.

---

### 4. TERMINAL / CMD / POWERSHELL SECURITY

If the application uses a terminal, CMD, PowerShell, Bash, shell, or another command interpreter:

#### DO NOT ALLOW ARBITRARY COMMAND EXECUTION

The application must NEVER take arbitrary user-controlled text and execute it directly as a shell command.

Dangerous patterns must be identified and reviewed, including:

* shell command concatenation
* user-controlled command strings
* user-controlled arguments without validation
* shell interpolation
* `exec`
* `execSync`
* unrestricted `spawn`
* unrestricted `spawnSync`
* PowerShell invocation
* CMD invocation
* shell execution with user-controlled input
* dynamically constructed commands

Where possible, use a direct operating-system API instead of a shell.

For example:

Instead of:

```text
shell("open " + userPath)
```

prefer a controlled operation that receives a validated path as data.

---

### 5. COMMAND ALLOWLIST

If terminal execution is genuinely required by the application, create a strict command allowlist.

For every permitted command document:

```text
COMMAND:
PURPOSE:
CALLING FEATURE:
ALLOWED ARGUMENTS:
ALLOWED PATHS:
ALLOWED WORKING DIRECTORY:
ALLOWED ENVIRONMENT VARIABLES:
ALLOWED OUTPUT:
```

The application must reject:

* arbitrary commands
* command chaining
* command substitution
* shell operators
* redirection
* pipelines
* background execution
* arbitrary executable paths
* arbitrary script paths
* arbitrary PowerShell commands
* arbitrary CMD commands

Unless a specific feature explicitly requires them and they are safely constrained.

Examples of dangerous shell features that must be considered:

```text
&
&&
||
|
>
>>
<
;
$
$()
`...`
```

Also check platform-specific command injection techniques.

---

### 6. PATH ALLOWLIST / DRIVE ISOLATION

If the application legitimately needs filesystem access, enforce the smallest possible filesystem boundary.

Example requirement:

If the application is designed to access:

```text
D:\Gist
```

then the application should only be permitted to access the intended resource under:

```text
D:\Gist
```

It must NOT automatically receive access to:

```text
C:\
D:\OtherApp
D:\Users\OtherUser
E:\
F:\
network shares
system directories
other application directories
```

unless those resources are explicitly required and authorized.

Do not consider a UI file picker or text field a security boundary.

The trusted backend/native process must validate the path.

---

### 7. PATH TRAVERSAL PROTECTION

Test whether an attacker can escape an allowed directory using:

```text
..
```

absolute paths, alternate path syntax, symbolic links, junctions, UNC paths, drive-relative paths, encoded paths, or platform-specific path tricks.

For example, if only:

```text
D:\Gist
```

is allowed, an attacker must not be able to transform a permitted path into access to:

```text
D:\Gist\..\OtherApp
```

or another drive/resource.

Resolve and canonicalize paths before authorization.

Authorization must be performed against the resolved/canonical path.

---

### 8. SYMLINK / JUNCTION / REPARSE-POINT SECURITY

On operating systems that support symbolic links, junctions, mount points, or reparse points:

Check whether an attacker can create a filesystem link inside an allowed directory that points outside the allowed directory.

Example:

```text
D:\Gist\allowed-link
        ↓
C:\SensitiveData
```

The application must not treat the apparent path as sufficient authorization.

Verify the actual resolved target.

---

### 9. FILE WRITE SECURITY

Determine every location where the application can write data.

Create a complete map:

```text
FEATURE
↓
FILE/API
↓
WRITE LOCATION
↓
FILE TYPE
↓
WHO CAN TRIGGER IT
↓
WHAT DATA CAN BE WRITTEN
```

The application must not allow arbitrary writing to:

* system directories
* application directories
* another application's directory
* startup directories
* sensitive user directories
* arbitrary drives
* arbitrary network paths

unless explicitly required.

---

### 10. PREVENT MALICIOUS CODE PERSISTENCE

Determine whether the application can create or modify:

* executable files
* scripts
* `.bat`
* `.cmd`
* `.ps1`
* `.vbs`
* `.js`
* `.exe`
* `.dll`
* `.msi`
* shell scripts
* startup scripts
* scheduled tasks
* services
* registry startup entries
* cron jobs
* launch agents
* browser extensions
* other persistence mechanisms

The application must NOT silently create persistence mechanisms.

Search for:

* scheduled task creation
* service creation
* startup folder modification
* registry modification
* cron configuration
* launch agent configuration
* background daemon creation

If persistence is legitimately required, it must be:

1. Explicitly documented.
2. Necessary for the application's functionality.
3. Restricted to the application's own components.
4. Installed with appropriate permissions.
5. Removable/uninstallable.
6. Visible to the user/administrator.
7. Protected against arbitrary modification.

---

### 11. DO NOT STORE VULNERABLE / EXECUTABLE PAYLOADS

Determine whether the application stores:

* downloaded scripts
* dynamically generated scripts
* executable binaries
* shell commands
* PowerShell payloads
* temporary executables
* arbitrary source code
* unknown downloaded files

Check whether those files can later be executed.

An application should not use the user's drive as an unrestricted payload repository.

If temporary files are required:

* use a controlled temporary directory
* use unpredictable filenames
* restrict permissions
* validate contents
* clean them up
* prevent path traversal
* prevent execution where execution is unnecessary
* prevent another user/process from manipulating them where relevant

---

### 12. DOWNLOAD → EXECUTE SECURITY

Search for workflows where the application:

```text
DOWNLOAD FILE
↓
SAVE TO DISK
↓
EXECUTE FILE
```

This is a high-risk operation.

If legitimate, verify:

* trusted source
* HTTPS
* certificate validation
* integrity verification
* signature verification where appropriate
* expected file type
* expected version
* restricted destination
* restricted execution
* no user-controlled execution path
* no arbitrary URL execution
* rollback/failure handling

Never blindly download and execute code from a user-controlled or arbitrary URL.

---

### 13. LOCALHOST SECURITY

If the application uses localhost services, determine exactly why.

Examples:

* printer status
* scanner service
* local helper application
* local API
* development server
* device bridge
* local rendering service

Document:

```text
LOCAL SERVICE:
HOST:
PORT:
ENDPOINT:
PURPOSE:
CALLING FEATURE:
AUTHENTICATION:
ALLOWED METHODS:
ALLOWED REQUESTS:
```

The application must only access the localhost service required for the feature.

For example:

If the application only requires:

```text
localhost printer-status service
```

it must not automatically gain the ability to:

* scan arbitrary localhost ports
* access unrelated local services
* send arbitrary commands to localhost
* access another application's local API
* modify unrelated localhost applications
* read arbitrary local network services

---

### 14. LOCALHOST PORT / ENDPOINT RESTRICTION

If localhost access is required:

Use a strict allowlist for:

* hostname
* port
* protocol
* HTTP method
* endpoint/path
* request schema
* response schema

Example:

```text
Allowed:
http://127.0.0.1:PORT/printer/status

Not automatically allowed:
http://127.0.0.1:PORT/*
http://localhost:*/*
http://127.0.0.1:*/*
```

Do not turn a narrow printer integration into a general local-network access mechanism.

---

### 15. PRINTER / SCANNER / DEVICE ACCESS

If the application interacts with printers, scanners, USB devices, serial devices, or other hardware:

Determine exactly what access is required.

For printer functionality:

* printer discovery
* selected printer
* printer status
* print queue
* print job submission
* cancellation

must each be considered separately.

Do not grant general system-device access when only printer status is required.

For scanners:

* restrict scanner discovery
* restrict selected device
* restrict scan operation
* restrict output location
* prevent arbitrary command execution through scanner interfaces

---

### 16. LOCAL NETWORK SECURITY

Determine whether the application can communicate with:

* localhost
* private IP ranges
* LAN devices
* router interfaces
* network shares
* other computers
* internal services

If the feature only requires localhost, prevent unnecessary access to the wider local network.

Do not allow a user-controlled URL to become a general-purpose network request mechanism.

---

### 17. SSRF / LOCAL RESOURCE ACCESS

If any backend or local helper can request arbitrary URLs, test whether the application can be tricked into requesting:

* localhost
* loopback addresses
* private IP addresses
* internal services
* cloud metadata endpoints
* router/admin interfaces
* local development servers

If URL fetching is required, use strict destination allowlists.

---

### 18. PROCESS ISOLATION

If the application launches a process:

Determine:

* executable
* absolute path
* arguments
* working directory
* environment
* privileges
* stdin
* stdout
* stderr
* lifetime
* termination behavior
* child processes

The process should receive the minimum privileges required.

Do not launch processes with administrator/root/system privileges unless absolutely required.

If a feature only needs to open a specific folder, do not provide a general-purpose terminal.

If a feature only needs printer status, do not provide general process execution.

---

### 19. WORKING DIRECTORY RESTRICTION

If a command/process is required:

Set an explicit working directory.

Do not allow the user to arbitrarily select the working directory unless the feature explicitly requires it.

If the feature requires:

```text
D:\Gist
```

then verify that the process actually starts in the approved directory.

Do not allow:

```text
C:\
D:\
other application directories
```

without explicit authorization.

---

### 20. ENVIRONMENT VARIABLE SECURITY

When spawning processes, inspect what environment variables are inherited.

Prevent unnecessary exposure of:

* API keys
* database credentials
* cloud credentials
* authentication secrets
* signing keys
* tokens

A child process should receive only the environment variables it actually requires.

Do not blindly inherit the entire parent environment if the process does not need it.

---

### 21. COMMAND ARGUMENT INJECTION

Even if the executable itself is trusted, verify that attacker-controlled input cannot modify its arguments.

For every process:

```text
EXECUTABLE
+
ARGUMENTS
+
WORKING DIRECTORY
+
ENVIRONMENT
```

must be independently controlled.

Never assume:

> "The executable is safe, therefore the execution is safe."

The arguments may still be dangerous.

---

### 22. TERMINAL ACCESS MUST BE FEATURE-SCOPED

If the application's business requirement is:

> "Open D:\Gist"

then the implementation should perform only that operation.

It should NOT provide:

> "Run arbitrary commands in a terminal."

If the business requirement is:

> "Check printer status"

then implement a printer-status operation.

Do NOT provide:

> "Execute any command that checks the printer."

Prefer:

```text
Application feature
↓
Dedicated trusted API
↓
Specific operation
↓
Specific resource
```

instead of:

```text
Application feature
↓
General terminal
↓
Arbitrary command
↓
Entire computer
```

---

### 23. NO TERMINAL ESCAPE

If a terminal is legitimately exposed to the application, verify that the user cannot escape the intended sandbox using:

* command chaining
* shell operators
* changing directory
* absolute paths
* environment manipulation
* alternate shells
* script execution
* process spawning
* nested shells
* command substitution
* executable paths
* aliases
* shell profiles

The permitted operation must remain within the intended capability boundary.

---

### 24. HIDDEN NETWORK / REMOTE CONTROL

Search for code that:

* opens outbound sockets
* connects to unknown domains
* downloads commands
* receives remote commands
* polls remote command servers
* executes server-provided commands
* creates reverse connections
* creates tunnels
* establishes remote-control channels

If any such mechanism exists, determine:

1. Why it exists.
2. Which feature requires it.
3. Destination.
4. Protocol.
5. Authentication.
6. Data transmitted.
7. Commands accepted.
8. Whether arbitrary commands can be received.
9. Whether the mechanism creates persistence.

Any unnecessary remote command-execution capability must be removed.

---

### 25. BACKDOOR / ADMINISTRATIVE ACCESS AUDIT

Search for hidden or undocumented:

* admin accounts
* master passwords
* bypass tokens
* secret URLs
* hidden API endpoints
* debug authentication
* maintenance endpoints
* emergency access mechanisms
* hardcoded credentials
* developer-only accounts
* test accounts
* impersonation mechanisms

Do not assume a hidden route is harmless because it is not linked from the UI.

---

### 26. INSTALLER / UPDATE / BUILD SCRIPT AUDIT

Inspect:

* installation scripts
* update scripts
* package scripts
* post-install hooks
* pre-install hooks
* deployment scripts
* startup scripts
* build scripts

Determine whether any script can:

* execute arbitrary commands
* download remote code
* modify system files
* modify registry
* create persistence
* install unrelated software
* access unrelated drives
* transmit sensitive information

Only required behavior should remain.

---

### 27. APPLICATION SELF-PROTECTION

Check whether untrusted users can modify:

* application scripts
* configuration
* executable files
* security policies
* local helper binaries
* authentication configuration
* database configuration
* environment files

If users can modify a file that the application later executes, investigate this as a potential code-execution vulnerability.

---

### 28. TEMPORARY FILE SECURITY

For every temporary file:

Determine:

* creation directory
* filename generation
* permissions
* content
* lifetime
* cleanup
* whether executable
* whether attacker-controllable
* whether another process can replace it

Protect against:

* predictable filenames
* symlink attacks
* race conditions
* arbitrary file replacement
* execution of attacker-controlled temporary files

---

### 29. LOCAL FILE DISCLOSURE

Check whether users can use the application to read arbitrary files.

Examples to investigate:

```text
C:\Users\...
C:\Windows\...
C:\Program Files\...
D:\...
.env
configuration files
database files
private keys
application source
```

The application must only read files explicitly required by the feature.

---

### 30. LOCAL FILE DELETION / MODIFICATION

Similarly check whether users can cause the application to:

* delete arbitrary files
* overwrite arbitrary files
* rename arbitrary files
* move files outside the allowed directory

Any destructive filesystem operation must be strictly scoped.

---

### 31. SECURITY BOUNDARY TABLE

Create a capability matrix:

| Capability        | Required? | Exact Resource       | Allowed Operation  | Who Can Trigger | Security Boundary     | Status    |
| ----------------- | --------- | -------------------- | ------------------ | --------------- | --------------------- | --------- |
| Terminal          | Yes/No    | Specific command     | Specific operation | Role/user       | Allowlist             | PASS/FAIL |
| Filesystem        | Yes/No    | Specific path        | Read/write         | Role/user       | Path allowlist        | PASS/FAIL |
| Localhost         | Yes/No    | Specific host/port   | Specific endpoint  | Feature         | Endpoint allowlist    | PASS/FAIL |
| Printer           | Yes/No    | Selected printer     | Status/print       | Role/user       | Device restriction    | PASS/FAIL |
| Scanner           | Yes/No    | Selected scanner     | Scan               | Role/user       | Device restriction    | PASS/FAIL |
| Process execution | Yes/No    | Specific executable  | Specific operation | Feature         | Executable allowlist  | PASS/FAIL |
| Network           | Yes/No    | Specific destination | Specific request   | Feature         | Destination allowlist | PASS/FAIL |

Do not mark PASS merely because the feature works.

Verify the restriction.

---

### 32. LEAST-PRIVILEGE REQUIREMENT

For every operating-system capability ask:

> "Can this feature work with less privilege?"

If yes, implement the least-privileged version.

Examples:

Instead of:

```text
Full filesystem access
```

use:

```text
Specific directory access
```

Instead of:

```text
Arbitrary shell execution
```

use:

```text
One dedicated operation
```

Instead of:

```text
General localhost access
```

use:

```text
Specific host + port + endpoint
```

Instead of:

```text
Administrator privileges
```

use:

```text
Normal user privileges
```

---

### 33. DATA FLOW + MACHINE ACCESS MAP

Produce two separate maps.

#### PERSONAL DATA FLOW

```text
USER
↓
FRONTEND
↓
API
↓
DATABASE
↓
STORAGE
↓
THIRD-PARTY SERVICES
↓
LOGS
```

#### LOCAL MACHINE CAPABILITY FLOW

```text
USER
↓
APPLICATION
↓
TRUSTED LOCAL API / NATIVE BRIDGE
↓
SPECIFIC OPERATION
↓
SPECIFIC RESOURCE
```

For every step identify:

* data
* permission
* trust boundary
* validation
* authorization
* allowed resource
* possible abuse

---

### 34. FIXING REQUIREMENT

If you discover that the application has excessive operating-system privileges:

DO NOT simply document the problem.

Where safe and practical:

1. Remove unnecessary capabilities.
2. Replace shell execution with dedicated APIs.
3. Replace arbitrary filesystem access with path allowlists.
4. Replace arbitrary localhost access with endpoint allowlists.
5. Replace unrestricted process execution with executable allowlists.
6. Remove hidden scripts.
7. Remove unnecessary persistence.
8. Remove unnecessary downloads/execution.
9. Restrict permissions.
10. Add security tests.

Do not weaken legitimate functionality.

---

### 35. IMPORTANT DISTINCTION

A feature being legitimate does NOT make unrestricted implementation legitimate.

For example:

#### Legitimate requirement

> The application needs to open `D:\Gist`.

#### Secure implementation

> Allow the application to open exactly the approved directory.

#### Insecure implementation

> Give the application a general terminal so it can execute `cd D:\Gist`.

The second implementation grants substantially more capability than the feature requires.

Likewise:

#### Legitimate requirement

> Check printer status.

#### Secure implementation

> Call the specific printer-status API for the selected printer.

#### Insecure implementation

> Execute arbitrary shell commands to inspect printers.

The security audit must identify these unnecessary privilege expansions.

---

### 36. FINAL OUTPUT FOR THIS AUDIT

After completing this audit, provide:

### A. Personal Data Map

What data is collected, stored, transmitted, logged, and deleted.

### B. Local Machine Capability Map

List every capability the application has.

### C. Terminal/Shell Inventory

List every place that can execute:

* CMD
* PowerShell
* Bash
* shell
* child processes
* scripts
* executables

### D. Filesystem Access Inventory

For every filesystem operation provide:

```text
READ:
WRITE:
DELETE:
RENAME:
MOVE:
CREATE:
EXECUTE:
ALLOWED PATH:
```

### E. Localhost Inventory

List every:

* host
* port
* endpoint
* protocol
* method
* purpose

### F. Device Inventory

List:

* printer
* scanner
* USB
* serial
* camera
* microphone
* other devices

and the exact permissions required.

### G. Hidden Code Review

Report:

* suspicious scripts
* obfuscated code
* dynamic execution
* hidden endpoints
* persistence mechanisms
* backdoors
* remote command functionality
* unexpected downloads
* unexpected file writes

### H. Capability Boundary Results

For every capability:

```text
REQUIRED
MINIMUM ACCESS
ACTUAL ACCESS
EXCESS ACCESS
VULNERABILITY
FIX
VERIFICATION
```

### I. Final Status

Use:

```text
LOCAL MACHINE SECURITY:
[PASS / PASS WITH CONDITIONS / FAIL]

TERMINAL SECURITY:
[PASS / PASS WITH CONDITIONS / FAIL]

FILESYSTEM SECURITY:
[PASS / PASS WITH CONDITIONS / FAIL]

LOCALHOST SECURITY:
[PASS / PASS WITH CONDITIONS / FAIL]

DEVICE SECURITY:
[PASS / PASS WITH CONDITIONS / FAIL]

HIDDEN CODE/BACKDOOR REVIEW:
[PASS / PASS WITH CONDITIONS / FAIL]

PERSISTENCE REVIEW:
[PASS / PASS WITH CONDITIONS / FAIL]

OVERALL PROMPT 2 STATUS:
[PASS / PASS WITH CONDITIONS / FAIL]
```

#### ABSOLUTE RULE

Never assume that a terminal, native process, filesystem permission, localhost connection, printer integration, scanner integration, or system-level capability is safe merely because the application legitimately needs the feature.

**The application must have exactly the capability it needs—and no more.**

If a feature requires access to one path, restrict it to that path.

If it requires one command, restrict it to that command.

If it requires one executable, restrict it to that executable.

If it requires one localhost endpoint, restrict it to that endpoint.

If it requires one printer, restrict it to that printer.

If it requires one device, restrict it to that device.

If it does not need a capability, remove it.

If you find hidden, unnecessary, suspicious, obfuscated, persistent, or remotely controlled code, investigate it, report it, and remove it when it is not required by legitimate application functionality.

Do not claim that the application is secure unless these restrictions have actually been inspected and verified.

# 61. SECURITY ANALYSIS AND IMPLEMENTATION AND TO-DO LIST
## MASTER 10/10 SECURITY AUDIT, VULNERABILITY DISCOVERY, HARDENING & VERIFICATION 

## IMPORTANT: DO NOT START CODING IMMEDIATELY

Before modifying **ANY** code, configuration, database policy, dependency, script, deployment setting, or file:

> **FIRST perform a complete security analysis of the entire application.**

You must first understand the application, identify every security boundary and attack surface, find vulnerable/suspicious/malicious/unnecessary code or configuration, create a **complete security remediation TODO list**, validate that the TODO list is complete, and ONLY THEN begin implementation.

The workflow is mandatory:

```text
PHASE 0
Repository Discovery
        ↓
PHASE 1
Architecture & Capability Analysis
        ↓
PHASE 2
Security Threat Modeling
        ↓
PHASE 3
Complete Vulnerability / Malicious-Code Audit
        ↓
PHASE 4
Create Exhaustive Security TODO List
        ↓
PHASE 5
TODO Completeness Verification
        ↓
PHASE 6
Implement TODO #1
        ↓
PHASE 7
Verify TODO #1
        ↓
PHASE 8
Implement TODO #2
        ↓
PHASE 9
Verify TODO #2
        ↓
...
        ↓
PHASE 10
Full Security Re-Scan
        ↓
PHASE 11
Regression Testing
        ↓
PHASE 12
Final Security Verification
        ↓
PHASE 13
Final Security Report
```

**DO NOT SKIP A PHASE.**

---

### 0. YOUR ROLE

Act as all of the following simultaneously:

* Senior Application Security Engineer
* Senior Penetration Tester
* Secure Software Architect
* Backend Security Engineer
* Frontend Security Engineer
* Database Security Engineer
* DevSecOps Engineer
* Infrastructure Security Engineer
* OS/Filesystem Security Engineer
* API Security Engineer
* Authentication/Authorization Specialist
* Secure Coding Reviewer
* Malware/Suspicious-Code Reviewer
* Threat Modeler
* Business Logic Security Auditor
* Security QA Engineer

Your job is not merely to find obvious bugs.

Your job is to determine whether this application can be:

* compromised
* bypassed
* abused
* manipulated
* escalated
* used to access unauthorized data
* used to access unauthorized files
* used to execute unauthorized commands
* used to access unauthorized localhost services
* used to access unauthorized devices
* used to create persistence
* used to hide malicious code
* used to download/execute unwanted code
* used to expose secrets
* used to manipulate business logic
* used to access another user's resources
* used to bypass database security
* used to bypass role restrictions

Then fix confirmed problems and verify every fix.

---

### 1. ABSOLUTE RULE: ANALYSIS BEFORE CODING

Do NOT immediately start editing files.

Do NOT immediately refactor.

Do NOT immediately install packages.

Do NOT immediately change database policies.

Do NOT immediately delete suspicious-looking code.

First determine what the code does.

For every suspicious item:

```text
DISCOVER
↓
UNDERSTAND
↓
CLASSIFY
↓
DETERMINE LEGITIMATE PURPOSE
↓
DETERMINE SECURITY RISK
↓
DECIDE FIX
```

Do not remove legitimate functionality merely because it looks unusual.

However:

If code is clearly malicious, hidden, unnecessary, exploitable, or provides excessive privileges without legitimate justification, identify it and remediate it.

---

### 2. PHASE 0 — COMPLETE REPOSITORY DISCOVERY

Before writing the TODO list, inspect the entire project.

Determine:

#### Application

* framework
* language
* runtime
* frontend
* backend
* APIs
* server functions
* edge functions
* workers
* native components
* desktop wrappers
* mobile components
* browser extensions
* local helper applications

#### Infrastructure

* hosting
* deployment
* CI/CD
* environment variables
* databases
* storage
* authentication provider
* DNS/domain configuration if available
* CDN
* reverse proxy
* serverless functions

#### Database

Identify:

* tables
* collections
* views
* functions
* procedures
* triggers
* policies
* RLS
* roles
* permissions
* indexes
* relationships
* foreign keys

### Storage

Identify:

* buckets
* directories
* uploaded files
* public/private resources
* signed URLs
* download APIs
* upload APIs

### External Services

Identify every:

* API
* SDK
* authentication service
* payment service
* email service
* SMS service
* analytics service
* AI service
* storage service
* monitoring service
* printer service
* scanner service
* localhost service

### Code Execution

Identify every mechanism capable of:

* command execution
* script execution
* process spawning
* dynamic code execution
* native API access
* filesystem access
* localhost communication
* device access

---

### 3. PHASE 1 — ARCHITECTURE MAP

Create an architecture map before making changes.

Example:

```text
USER
 ↓
FRONTEND
 ↓
AUTHENTICATION
 ↓
API / SERVICE
 ↓
DATA LAYER
 ↓
DATABASE
 ↓
STORAGE
```

Also identify:

```text
FRONTEND
 ↓
LOCAL/NATIVE BRIDGE
 ↓
OPERATING SYSTEM
 ↓
FILESYSTEM / TERMINAL / DEVICE / PRINTER
```

And:

```text
APPLICATION
 ↓
THIRD-PARTY SERVICE
```

For every connection identify:

* trust boundary
* authentication
* authorization
* validation
* data transferred
* privileges
* possible abuse

---

### 4. PHASE 2 — COMPLETE THREAT MODEL

Identify:

## Assets

* accounts
* passwords
* tokens
* sessions
* API keys
* database credentials
* service-role credentials
* personal data
* uploaded documents
* private files
* application records
* administrator data
* payment information
* business information
* logs
* backups
* configuration
* source code

## Attackers

Consider:

* unauthenticated attacker
* normal user
* malicious authenticated user
* compromised account
* malicious administrator
* attacker controlling browser/client
* attacker controlling request parameters
* attacker manipulating local files
* attacker manipulating IDs
* automated attacker/bot

## Trust Boundaries

Identify:

* browser → backend
* frontend → database
* frontend → local machine
* frontend → native bridge
* backend → database
* backend → storage
* application → third party
* webhook → application
* user → uploaded file
* local application → OS

---

### 5. PHASE 3 — EXHAUSTIVE SECURITY AUDIT

Perform ALL of the following.

Do not consider the audit complete until every category has been inspected.

---

## 5.1 SECRET LEAK AUDIT

Search the entire project and, where available, Git history for:

* passwords
* API keys
* tokens
* database URLs
* service-role keys
* private keys
* JWT secrets
* OAuth secrets
* payment secrets
* webhook secrets
* cloud credentials
* SMTP credentials
* third-party credentials

Check:

* source code
* configuration
* `.env`
* `.env.example`
* logs
* comments
* tests
* fixtures
* scripts
* CI/CD
* build output
* source maps
* public files

Never expose full secrets in the report.

If a previously exposed secret exists, recommend rotation/revocation.

---

# 5.2 PERSONAL DATA FLOW AUDIT

Trace:

```text
COLLECTION
↓
VALIDATION
↓
STORAGE
↓
TRANSMISSION
↓
THIRD-PARTY SERVICES
↓
LOGGING
↓
BACKUP
↓
DELETION
```

Inspect:

* email
* phone
* name
* address
* IP
* device data
* authentication data
* uploaded documents
* payment data
* application-specific sensitive data

Ensure:

* minimum data collection
* no unnecessary third-party sharing
* no sensitive logging
* appropriate storage
* proper deletion
* correct authorization

---

# 5.3 AUTHENTICATION AUDIT

Audit:

* signup
* login
* logout
* session creation
* session expiration
* refresh
* password reset
* OTP
* email verification
* recovery
* reauthentication

Check:

* brute-force protection
* token security
* session invalidation
* reset-token expiration
* reset-token reuse
* OTP abuse
* malformed tokens
* expired tokens
* forged tokens
* default credentials

---

# 5.4 AUTHORIZATION / RBAC AUDIT

Identify every:

* role
* permission
* protected route
* protected API
* privileged operation

Verify server-side enforcement.

Never trust:

* hidden UI
* disabled button
* frontend role
* client-side state
* client-provided role
* client-provided ownership

---

# 5.5 IDOR / BOLA AUDIT

Test every resource identifier:

* user ID
* document ID
* case ID
* order ID
* payment ID
* file ID
* organization ID
* tenant ID

Determine whether changing IDs can expose another user's resource.

---

# 5.6 DATABASE SECURITY AUDIT

Inspect:

* permissions
* grants
* exposed tables
* functions
* RPC
* views
* triggers
* dynamic SQL
* database roles
* privileged functions

Check for:

* SQL injection
* excessive access
* unauthorized functions
* unsafe views
* privilege escalation

---

# 5.7 RLS / DATABASE POLICY AUDIT

For every exposed table:

Check:

* RLS enabled?
* SELECT policy?
* INSERT policy?
* UPDATE policy?
* DELETE policy?
* `USING`?
* `WITH CHECK`?
* ownership?
* role?
* tenant isolation?
* role-field manipulation?
* privileged functions bypassing RLS?

Test:

```text
anonymous → protected data
user A → user B
user → modify user B
user → delete user B
user → modify ownership
user → modify role
user → access another tenant
```

---

# 5.8 API SECURITY AUDIT

Inventory every endpoint.

For each:

```text
METHOD
PATH
AUTH
AUTHORIZATION
INPUT
OUTPUT
DATABASE ACCESS
STORAGE ACCESS
THIRD-PARTY ACCESS
RATE LIMIT
ABUSE RISK
```

Check:

* authentication
* authorization
* validation
* output filtering
* rate limiting
* CORS
* CSRF where applicable
* error leakage
* request limits

---

# 5.9 INPUT / INJECTION AUDIT

Audit:

* SQL injection
* XSS
* command injection
* template injection
* path traversal
* SSRF
* unsafe redirects
* unsafe deserialization
* unsafe file handling

Treat all external input as untrusted.

---

# 5.10 FILE UPLOAD / STORAGE AUDIT

Check:

* file type
* MIME validation
* file signature
* file size
* filename
* path traversal
* SVG/HTML
* executable files
* private/public storage
* authorization
* signed URLs
* object IDs

---

# 5.11 BUSINESS LOGIC AUDIT

Look for:

* price manipulation
* negative amounts
* duplicate transactions
* duplicate submissions
* status bypass
* approval bypass
* cancellation abuse
* free-trial abuse
* discount abuse
* referral abuse
* race conditions
* unauthorized ownership changes

---

# 5.12 PAYMENT SECURITY

If applicable:

* server-side price calculation
* server-side entitlement
* webhook verification
* duplicate webhook protection
* replay protection
* amount manipulation
* currency manipulation
* refund abuse
* negative amounts

---

# 5.13 SECURITY HEADERS / CORS / HTTPS

Inspect:

* CSP
* HSTS
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* frame protection
* CORS
* HTTPS
* secure cookies

---

# 5.14 LOGGING / ERROR SECURITY

Search all logs and errors.

Ensure they do not expose:

* passwords
* tokens
* API keys
* personal data
* SQL
* filesystem paths
* stack traces
* environment variables
* credentials

---

### 6. PHASE 3A — LOCAL MACHINE / TERMINAL / HIDDEN CODE SECURITY

This section is mandatory even if the application appears to be a normal web application.

Determine whether the application can access:

* CMD
* PowerShell
* Bash
* shell
* child processes
* filesystem
* drives
* local network
* localhost
* printer
* scanner
* USB
* serial devices
* camera
* microphone
* OS APIs
* registry
* scheduled tasks
* services
* startup
* executable files

---

## 6.1 HIDDEN / MALICIOUS / SUSPICIOUS CODE

Search for:

* hidden scripts
* obfuscated code
* Base64 payloads
* encoded PowerShell
* dynamic execution
* `eval`
* dynamic imports
* remote code downloads
* generated scripts
* suspicious binaries
* backdoors
* hidden admin routes
* bypass tokens
* master passwords
* persistence
* command-and-control behavior
* reverse connections
* unexplained network connections

For every suspicious item determine:

```text
WHAT
WHY
WHERE
WHO CAN TRIGGER IT
WHAT IT ACCESSES
WHAT IT EXECUTES
WHETHER IT IS REQUIRED
SECURITY RISK
```

Do NOT delete it blindly.

Understand it first.

---

# 6.2 TERMINAL SECURITY

If terminal access is required:

There must be:

* command allowlist
* argument allowlist
* executable allowlist
* working-directory allowlist
* environment allowlist
* resource allowlist

Never permit arbitrary command execution when a dedicated API can perform the required operation.

---

# 6.3 FILESYSTEM SECURITY

If only:

```text
D:\Gist
```

is required, the application must not gain unrestricted access to:

```text
C:\
D:\
E:\
F:\
other applications
system folders
other users
network shares
```

Check:

* path traversal
* `..`
* absolute paths
* UNC paths
* symbolic links
* junctions
* reparse points
* encoded paths
* drive-relative paths

Canonicalize paths before authorization.

---

# 6.4 FILE WRITE / DELETE / MODIFY

Determine whether the application can:

* create
* write
* overwrite
* rename
* move
* delete
* execute

files.

Prevent access outside the approved path.

---

# 6.5 MALICIOUS CODE PERSISTENCE

Check whether the application can create:

* `.exe`
* `.dll`
* `.bat`
* `.cmd`
* `.ps1`
* `.vbs`
* scripts
* services
* scheduled tasks
* startup entries
* registry persistence
* cron jobs
* launch agents

Any unnecessary persistence must be removed.

---

# 6.6 LOCALHOST SECURITY

If the application needs localhost:

Restrict:

```text
HOST
PORT
PROTOCOL
ENDPOINT
METHOD
REQUEST
RESPONSE
```

Example:

```text
Allowed:
127.0.0.1:PORT/printer/status

Not automatically allowed:
127.0.0.1:*
localhost:*
localhost/*
```

The printer feature must not become a general localhost-access mechanism.

---

# 6.7 PRINTER / SCANNER / DEVICE SECURITY

If printer access is required:

Restrict access to:

* selected printer
* printer status
* queue
* print
* cancellation

Do not provide general OS command execution merely to access printer functionality.

The same principle applies to:

* scanners
* USB devices
* serial devices
* cameras
* microphones

---

# 6.8 PROCESS SECURITY

For every spawned process identify:

```text
EXECUTABLE
ABSOLUTE PATH
ARGUMENTS
WORKING DIRECTORY
ENVIRONMENT
PRIVILEGES
INPUT
OUTPUT
LIFETIME
CHILD PROCESSES
```

Use the minimum required privilege.

---

### 7. PHASE 4 — CREATE THE MASTER SECURITY TODO LIST

After completing the discovery and audit, STOP CODING.

Now create an **exhaustive security remediation TODO list**.

Every discovered issue must become a TODO item.

Do not group unrelated vulnerabilities into vague items such as:

> "Fix security."

Each issue gets its own item.

Use this format:

| ID      | Priority | Security Area | Vulnerability | Exact Location | Risk | Required Fix | Verification |
| ------- | -------- | ------------- | ------------- | -------------- | ---- | ------------ | ------------ |
| SEC-001 | CRITICAL | Auth          | ...           | ...            | ...  | ...          | ...          |
| SEC-002 | HIGH     | RLS           | ...           | ...            | ...  | ...          | ...          |

---

### 8. TODO PRIORITY

Use:

### P0 — CRITICAL

* secret exposure
* authentication bypass
* admin takeover
* mass data exposure
* RLS bypass
* arbitrary command execution
* arbitrary filesystem access
* remote code execution
* dangerous persistence
* payment compromise

### P1 — HIGH

* IDOR/BOLA
* privilege escalation
* private file exposure
* SQL injection
* stored XSS
* command injection
* serious business logic vulnerability
* localhost escape
* unauthorized device access

### P2 — MEDIUM

* rate-limit weaknesses
* information disclosure
* weak configuration
* excessive permissions
* insecure headers
* dependency risks

### P3 — LOW

* defense-in-depth
* hardening
* minor security improvements

---

### 9. TODO COMPLETENESS CHECK — MANDATORY

Before implementing ANY TODO:

Perform a second review of the TODO list.

Ask:

> "If I implement every item in this list, could a security vulnerability discovered during the previous audit still remain?"

Check the TODO against EVERY category:

```text
[ ] Secrets
[ ] Authentication
[ ] Authorization
[ ] RBAC
[ ] IDOR/BOLA
[ ] Database
[ ] RLS
[ ] RPC/functions
[ ] APIs
[ ] SQL injection
[ ] XSS
[ ] CSRF
[ ] SSRF
[ ] CORS
[ ] Security headers
[ ] Cookies
[ ] Sessions
[ ] Personal data
[ ] Logs
[ ] Errors
[ ] File uploads
[ ] Storage
[ ] Payments
[ ] Webhooks
[ ] Rate limiting
[ ] Business logic
[ ] Race conditions
[ ] Dependencies
[ ] Build/deployment
[ ] Source maps
[ ] Debug endpoints
[ ] Test endpoints
[ ] Admin panel
[ ] Backups
[ ] Terminal
[ ] CMD
[ ] PowerShell
[ ] Shell
[ ] Process execution
[ ] Filesystem
[ ] Drive isolation
[ ] Path traversal
[ ] Symlinks/junctions
[ ] File writes
[ ] File deletion
[ ] Executable files
[ ] Persistence
[ ] Scheduled tasks
[ ] Services
[ ] Registry/startup
[ ] Localhost
[ ] Local network
[ ] Printer
[ ] Scanner
[ ] USB
[ ] Serial devices
[ ] Native bridges
[ ] IPC
[ ] Hidden scripts
[ ] Obfuscated code
[ ] Dynamic execution
[ ] Remote code download
[ ] Backdoors
[ ] Remote control
[ ] Third-party integrations
```

If anything is not examined:

> **ADD A TODO ITEM.**

Do not begin implementation until every applicable category is accounted for.

---

### 10. IMPLEMENTATION RULE — ONE TODO AT A TIME

Now begin implementation.

You MUST process the TODO list sequentially.

Example:

```text
SEC-001
↓
ANALYZE
↓
IMPLEMENT
↓
TEST
↓
VERIFY
↓
MARK COMPLETE

SEC-002
↓
ANALYZE
↓
IMPLEMENT
↓
TEST
↓
VERIFY
↓
MARK COMPLETE
```

Do NOT implement 20 security changes simultaneously and then claim everything works.

Process one logical security issue at a time.

---

### 11. BEFORE EACH TODO ITEM

Before modifying code for a TODO:

Explain internally:

```text
TODO:
ROOT CAUSE:
AFFECTED FILES:
AFFECTED FLOW:
SECURITY IMPACT:
EXACT FIX:
POSSIBLE SIDE EFFECTS:
VERIFICATION METHOD:
```

Then implement.

---

### 12. AFTER EACH TODO ITEM

Immediately verify:

### Code

* implementation correct
* no syntax errors
* no broken imports
* no broken dependencies

### Security

* vulnerability no longer exploitable
* bypass path does not remain
* equivalent path does not remain

### Functionality

* intended feature still works

### Regression

* related functionality still works

Only then mark:

```text
SEC-XXX = VERIFIED COMPLETE
```

If verification fails:

```text
SEC-XXX = FAILED VERIFICATION
```

Fix it before moving to the next item.

---

### 13. NEVER MARK "FIXED" WITHOUT VERIFICATION

A code modification is NOT a verified security fix.

For every TODO provide evidence.

Examples:

```text
RLS policy changed
→ tested unauthorized SELECT
→ denied
→ verified

Path restriction added
→ attempted ../ escape
→ denied
→ verified

Command allowlist added
→ unauthorized command attempted
→ rejected
→ verified
```

If runtime verification is unavailable:

```text
STATICALLY VERIFIED ONLY
```

Do not claim runtime verification.

---

### 14. CHECK FOR SECONDARY VULNERABILITIES AFTER EVERY FIX

After fixing a vulnerability, inspect related code.

Example:

If fixing:

```text
/api/users/:id
```

also inspect:

```text
/api/users
/api/users/:id/files
/api/users/:id/settings
/api/users/:id/export
/api/users/:id/delete
```

If fixing a database policy:

inspect:

* related tables
* views
* RPC
* functions
* storage
* joins

If fixing filesystem access:

inspect:

* read
* write
* delete
* rename
* move
* execute

Do not patch only the first discovered entry point.

---

### 15. MALICIOUS CODE DECISION PROCESS

If suspicious code is discovered:

DO NOT immediately call it malicious.

Classify it:

```text
LEGITIMATE
SUSPICIOUS
UNNECESSARY
VULNERABLE
MALICIOUS / BACKDOOR-LIKE
UNKNOWN / NOT VERIFIED
```

For suspicious/malicious-looking code:

1. Determine origin if possible.
2. Determine purpose.
3. Determine when it executes.
4. Determine who can trigger it.
5. Determine what it accesses.
6. Determine what network connections it creates.
7. Determine what files it creates.
8. Determine whether it persists.
9. Determine whether it can execute arbitrary commands.
10. Determine whether it can bypass application security.

Then remediate appropriately.

---

### 16. NO UNAUTHORIZED CLEANUP

Do not remove:

* libraries
* scripts
* native modules
* services
* APIs
* configuration

simply because they look unusual.

First establish whether they are required.

However, if a component is confirmed unnecessary and introduces security risk:

* remove it
* remove references
* remove dependencies
* remove configuration
* remove permissions
* verify build
* verify functionality

---

### 17. SECURITY CHANGE MINIMIZATION

Do not rewrite the entire application.

Make the smallest secure change that properly fixes the root cause.

Do not introduce:

* unnecessary architecture
* unnecessary wrappers
* unnecessary adapters
* unnecessary providers
* unnecessary abstractions
* duplicate security systems

unless required.

---

### 18. FULL SECURITY RE-SCAN AFTER ALL TODO ITEMS

After every TODO is marked verified:

STOP.

Perform a completely fresh security audit from the beginning.

Do NOT simply trust the previous audit.

Search again for:

* secrets
* hidden code
* suspicious code
* command execution
* filesystem access
* localhost access
* device access
* persistence
* authorization bypass
* RLS bypass
* IDOR
* injection
* XSS
* SSRF
* file upload vulnerabilities
* business logic flaws
* API vulnerabilities
* logging leaks
* error leaks

The second audit must be independent of the first TODO list.

---

### 19. REGRESSION AUDIT

Verify that the security work did not break:

* login
* registration
* logout
* password reset
* user roles
* admin functionality
* database operations
* storage
* uploads
* downloads
* printing
* printer status
* localhost functionality
* intended filesystem functionality
* application routes
* APIs
* core business workflows

---

### 20. BUILD VERIFICATION

Run available:

* build
* tests
* lint
* type checking
* static analysis
* security scanners
* dependency checks

Do not invent results.

Report exactly what was actually executed.

---

### 21. FINAL SECURITY CHECKLIST

Before declaring completion, check every applicable category:

```text
[ ] Secrets
[ ] Authentication
[ ] Authorization
[ ] RBAC
[ ] IDOR/BOLA
[ ] Database
[ ] RLS
[ ] RPC
[ ] API
[ ] SQL injection
[ ] XSS
[ ] CSRF
[ ] SSRF
[ ] CORS
[ ] Security headers
[ ] Cookies
[ ] Sessions
[ ] Personal data
[ ] Logging
[ ] Errors
[ ] File upload
[ ] Storage
[ ] Payments
[ ] Webhooks
[ ] Rate limiting
[ ] Business logic
[ ] Race conditions
[ ] Dependencies
[ ] Deployment
[ ] Build artifacts
[ ] Source maps
[ ] Debug endpoints
[ ] Test endpoints
[ ] Admin security
[ ] Backup security
[ ] Terminal
[ ] CMD
[ ] PowerShell
[ ] Shell
[ ] Process execution
[ ] Filesystem
[ ] Drive isolation
[ ] Path traversal
[ ] Symlinks
[ ] Junctions
[ ] File writes
[ ] File deletion
[ ] Executables
[ ] Persistence
[ ] Scheduled tasks
[ ] Services
[ ] Startup/registry
[ ] Localhost
[ ] Local network
[ ] Printer
[ ] Scanner
[ ] USB
[ ] Serial
[ ] Native bridge
[ ] IPC
[ ] Hidden scripts
[ ] Obfuscated code
[ ] Dynamic execution
[ ] Remote downloads
[ ] Backdoors
[ ] Remote control
[ ] Third-party integrations
```

For every item mark:

```text
PASS
FAIL
PARTIAL
NOT VERIFIED
NOT APPLICABLE
```

Never leave an applicable item without a status.

---

### 22. FINAL VULNERABILITY REPORT

Produce:

## Executive Summary

```text
Overall Security Status:
READY
READY WITH CONDITIONS
NOT READY
```

## Security Score

```text
Authentication              /10
Authorization               /10
Database/RLS                /10
Secrets                     /10
API Security                /10
Injection/XSS               /10
Storage/Files               /10
Business Logic              /10
Local Machine Security      /10
Infrastructure              /10
Monitoring/Operations       /10
TOTAL                       /110
```

If using a score out of 100 instead, normalize it and explain the methodology.

Do not inflate the score.

---

### 23. FINAL TODO STATUS

Provide:

```text
TOTAL TODO ITEMS:
COMPLETED:
FAILED:
PARTIAL:
NOT VERIFIED:
NOT APPLICABLE:
```

Then list every incomplete item.

---

### 24. FILE CHANGE REPORT

For every modified file:

```text
FILE:
CHANGE:
SECURITY REASON:
FUNCTIONAL IMPACT:
VERIFICATION:
```

---

### 25. VULNERABILITY REPORT

For every vulnerability found:

```text
ID:
SEVERITY:
CONFIDENCE:
CATEGORY:
FILE:
FUNCTION:
ROOT CAUSE:
ATTACK SCENARIO:
IMPACT:
FIX:
VERIFICATION:
STATUS:
```

---

### 26. REMAINING RISKS

Clearly identify anything that could not be verified because of:

* unavailable production environment
* unavailable database
* unavailable local machine
* unavailable credentials
* unavailable hardware
* unavailable deployment configuration
* unavailable runtime environment
* unavailable third-party service

Use:

> NOT VERIFIED

rather than assuming PASS.

---

### 27. CRITICAL FINAL RULE

Never say:

> "The application is secure."

Instead say:

> "The audited security controls were verified within the available environment and test scope."

Security is never proven absolutely by static code review alone.

---

### 28. MOST IMPORTANT EXECUTION RULE

The following sequence is mandatory:

```text
1. DO NOT CODE
        ↓
2. INSPECT EVERYTHING
        ↓
3. UNDERSTAND EVERYTHING
        ↓
4. FIND VULNERABILITIES
        ↓
5. FIND SUSPICIOUS / HIDDEN / MALICIOUS CODE
        ↓
6. FIND EXCESSIVE SYSTEM CAPABILITIES
        ↓
7. FIND AUTHORIZATION BYPASSES
        ↓
8. FIND DATA EXPOSURE
        ↓
9. FIND BUSINESS-LOGIC FLAWS
        ↓
10. CREATE COMPLETE TODO LIST
        ↓
11. CHECK TODO LIST FOR MISSING CATEGORIES
        ↓
12. IMPLEMENT TODO #1
        ↓
13. VERIFY TODO #1
        ↓
14. IMPLEMENT TODO #2
        ↓
15. VERIFY TODO #2
        ↓
16. CONTINUE UNTIL EVERY TODO IS VERIFIED
        ↓
17. PERFORM FRESH FULL SECURITY SCAN
        ↓
18. RUN REGRESSION TESTS
        ↓
19. RUN BUILD / TEST / LINT / SECURITY CHECKS
        ↓
20. VERIFY EVERY SECURITY CATEGORY
        ↓
21. REPORT EVERYTHING
```

## DO NOT SKIP ITEMS BECAUSE THEY LOOK UNIMPORTANT.

## DO NOT ASSUME SOMETHING IS SAFE BECAUSE IT IS NOT CURRENTLY USED.

## DO NOT ASSUME THE UI IS A SECURITY BOUNDARY.

## DO NOT ASSUME THE CLIENT IS TRUSTED.

## DO NOT ASSUME RLS IS CORRECT WITHOUT INSPECTING EACH POLICY.

## DO NOT ASSUME LOCALHOST IS SAFE.

## DO NOT ASSUME TERMINAL ACCESS IS SAFE.

## DO NOT ASSUME A SCRIPT IS SAFE BECAUSE IT IS IN THE REPOSITORY.

## DO NOT ASSUME A FILE PATH IS SAFE BECAUSE IT COMES FROM YOUR UI.

## DO NOT ASSUME A COMMAND IS SAFE BECAUSE ITS EXECUTABLE IS TRUSTED.

## DO NOT ASSUME PRINTER ACCESS MEANS GENERAL DEVICE ACCESS IS SAFE.

## DO NOT ASSUME A HIDDEN FILE IS HARMLESS.

## DO NOT ASSUME OBFUSCATED CODE IS NECESSARY.

## DO NOT ASSUME A SECURITY FIX WORKS WITHOUT VERIFYING IT.

---

### FINAL COMMAND TO THE AI

**Start with PHASE 0.**

Do not modify code yet.

First inspect the complete application and produce:

1. Repository/architecture inventory.
2. Data-flow map.
3. Authentication/authorization map.
4. Database/RLS map.
5. API inventory.
6. Storage inventory.
7. Third-party integration inventory.
8. Local-machine capability inventory.
9. Terminal/CMD/PowerShell/process inventory.
10. Filesystem/drive access inventory.
11. Localhost/network/device inventory.
12. Hidden/obfuscated/suspicious-code findings.
13. Persistence/backdoor findings.
14. Complete vulnerability inventory.
15. Complete security TODO list.
16. TODO completeness verification.

**Only after the complete analysis and TODO list are produced may you begin implementing fixes.**

Then execute the TODO list **strictly one item at a time**.

For every item:

```text
ANALYZE
→ IMPLEMENT
→ TEST
→ VERIFY
→ REGRESSION CHECK
→ MARK COMPLETE
→ NEXT ITEM
```

After all items are complete:

```text
FULL FRESH SECURITY RE-SCAN
→ FULL REGRESSION TEST
→ BUILD
→ TEST
→ FINAL SECURITY CHECKLIST
→ FINAL SECURITY REPORT
```

Your success criterion is:

> **No known security issue identified during the audit remains unaddressed without an explicit documented reason, and every implemented security fix has been individually verified.**

If anything cannot be verified, explicitly mark it **NOT VERIFIED**.

**Do not skip. Do not guess. Do not claim success without evidence. Do not start coding before the analysis and complete TODO list.**
