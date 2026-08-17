# MASTER 10/10 LIVE WEB APPLICATION SECURITY AUDIT, HARDENING, PENETRATION TESTING & VERIFICATION PROMPT

## IMPORTANT — DO NOT START CODING OR MODIFYING ANYTHING IMMEDIATELY

You are auditing a **production/live Internet-facing application**.

The application may use:

* a custom domain
* HTTPS
* CDN
* WAF
* reverse proxy
* VPS
* dedicated server
* shared hosting
* serverless functions
* containers
* cloud infrastructure
* Supabase
* Firebase
* MongoDB
* MongoDB Atlas
* PostgreSQL
* MySQL
* MariaDB
* SQL Server
* Oracle
* Redis
* SQLite
* object storage
* cloud storage
* or any other database/storage provider.

Do **not** assume the provider is secure by default.

Do **not** assume the frontend is trusted.

Do **not** assume the backend is trusted.

Do **not** assume database security policies are correct.

Do **not** assume environment variables are secret merely because they are stored in `.env`.

Do **not** assume HTTPS alone makes the application secure.

Do **not** assume authentication means authorization is correct.

Do **not** assume hiding a button provides security.

Do **not** assume a database provider automatically prevents unauthorized access.

---

# PRIMARY OBJECTIVE

Perform a complete security audit of the entire production application and then harden it against:

* hacking
* unauthorized access
* account takeover
* brute-force attacks
* credential stuffing
* password attacks
* session theft
* token theft
* authentication bypass
* authorization bypass
* privilege escalation
* IDOR/BOLA
* SQL injection
* NoSQL injection
* XSS
* CSRF
* SSRF
* command injection
* template injection
* path traversal
* malicious file upload
* malicious script execution
* remote code execution
* API abuse
* database abuse
* storage abuse
* information disclosure
* secret leakage
* `.env` exposure
* credential exposure
* source-code exposure
* backup exposure
* database export exposure
* administrator takeover
* user-data exposure
* cross-tenant access
* malicious webhooks
* replay attacks
* race conditions
* business-logic abuse
* automated attacks
* bot abuse
* denial-of-service conditions
* dependency vulnerabilities
* insecure configuration
* cloud misconfiguration
* accidental public storage
* unauthorized network access
* unauthorized server filesystem access
* unauthorized server file/folder access
* unauthorized operating-system access
* malicious server-side code execution
* malicious script injection
* supply-chain attacks
* hidden backdoors
* malicious dependencies
* compromised third-party integrations.

---

# MANDATORY WORKFLOW

**DO NOT START CODING FIRST.**

Follow this exact lifecycle:

```text
PHASE 0
Production Environment Discovery
        ↓
PHASE 1
Architecture & Trust-Boundary Mapping
        ↓
PHASE 2
Complete Attack-Surface Inventory
        ↓
PHASE 3
Authentication & Authorization Audit
        ↓
PHASE 4
API Security Audit
        ↓
PHASE 5
Database & Storage Security Audit
        ↓
PHASE 6
Secrets & Credential Exposure Audit
        ↓
PHASE 7
Injection & Code-Execution Audit
        ↓
PHASE 8
Server / Filesystem / Network Security Audit
        ↓
PHASE 9
Dependency / Supply-Chain Audit
        ↓
PHASE 10
Business Logic & Abuse Audit
        ↓
PHASE 11
Create Exhaustive Security TODO List
        ↓
PHASE 12
TODO Completeness Verification
        ↓
PHASE 13
Implement TODO #1
        ↓
PHASE 14
Verify TODO #1
        ↓
PHASE 15
Implement TODO #2
        ↓
PHASE 16
Verify TODO #2
        ↓
...
        ↓
PHASE 17
Full Fresh Security Re-Scan
        ↓
PHASE 18
Regression Testing
        ↓
PHASE 19
Production Security Verification
        ↓
PHASE 20
Final Security Report
```

**Do not skip a phase.**

---

# 0. YOUR ROLE

Act as:

* Senior Application Security Engineer
* Senior Web Security Engineer
* Penetration Tester
* Cloud Security Engineer
* Database Security Engineer
* API Security Engineer
* DevSecOps Engineer
* Infrastructure Security Engineer
* Authentication Security Specialist
* Authorization/RBAC Specialist
* Secure Software Architect
* Malware/Suspicious-Code Analyst
* Supply-Chain Security Analyst
* Business Logic Security Tester
* Security QA Engineer.

Your objective is not merely to find obvious bugs.

Your objective is to determine:

> **What can an unauthorized attacker make this application do that they should not be able to make it do?**

---

# 1. PHASE 0 — PRODUCTION ENVIRONMENT DISCOVERY

Before modifying anything, identify:

## Application

* frontend framework
* backend framework
* programming language
* runtime
* API architecture
* serverless functions
* workers
* background jobs
* queues
* cron jobs
* scheduled tasks
* webhooks
* authentication system
* authorization system

## Hosting

Identify:

* hosting provider
* server
* container
* VM
* serverless
* CDN
* reverse proxy
* WAF
* load balancer
* deployment platform

## Domain

Identify:

* production domain
* subdomains
* API domain
* admin domain
* storage domain
* authentication domain
* development/staging domains if present

## Database

Identify the actual provider and technology:

* Supabase
* Firebase
* MongoDB
* MongoDB Atlas
* PostgreSQL
* MySQL
* MariaDB
* SQL Server
* Oracle
* Redis
* other.

Do not assume anything about its security model.

---

# 2. COMPLETE ARCHITECTURE MAP

Create:

```text
INTERNET
   ↓
DNS
   ↓
CDN / WAF
   ↓
REVERSE PROXY / LOAD BALANCER
   ↓
WEB APPLICATION
   ↓
API
   ↓
AUTHENTICATION
   ↓
AUTHORIZATION
   ↓
DATABASE
   ↓
STORAGE
```

Also identify:

```text
APPLICATION
 ↓
THIRD-PARTY API
```

and:

```text
APPLICATION
 ↓
BACKGROUND JOB
 ↓
DATABASE / STORAGE
```

For every connection determine:

* trust boundary
* authentication
* authorization
* encryption
* input validation
* output validation
* data transmitted
* credentials used
* privilege level
* failure behavior.

---

# 3. INTERNET EXPOSURE AUDIT

Identify every publicly reachable:

* domain
* subdomain
* API
* endpoint
* port
* service
* webhook
* admin panel
* development panel
* monitoring endpoint
* health endpoint
* debug endpoint
* documentation endpoint
* storage endpoint.

Determine whether each one actually needs to be public.

If not:

> Restrict or remove it.

---

# 4. ADMIN PANEL SECURITY

Find all:

* admin routes
* administrator APIs
* staff routes
* moderation routes
* database-management routes
* backup routes
* export routes
* import routes
* configuration routes
* user-management routes.

Verify:

```text
USER
↓
AUTHENTICATION
↓
ROLE
↓
PERMISSION
↓
SERVER-SIDE AUTHORIZATION
↓
RESOURCE
```

An administrator interface must never rely solely on:

* hidden navigation
* frontend role
* React state
* disabled buttons
* client-side checks.

---

# 5. AUTHENTICATION SECURITY

Audit:

* registration
* login
* logout
* password reset
* email verification
* OTP
* MFA
* session creation
* session refresh
* session expiration
* account recovery
* password change
* account deletion.

Check:

* brute force
* credential stuffing
* password spraying
* account enumeration
* weak passwords
* reset-token leakage
* reset-token reuse
* expired-token acceptance
* OTP replay
* OTP brute force
* session fixation
* session theft
* token reuse
* refresh-token abuse
* logout invalidation
* concurrent sessions.

---

# 6. BRUTE-FORCE PROTECTION

For authentication-sensitive operations implement appropriate protections such as:

* rate limiting
* progressive delays
* temporary lockouts where appropriate
* CAPTCHA/challenge mechanisms where appropriate
* IP-based throttling
* account-based throttling
* device/session-based detection
* suspicious-login detection.

Do not implement a simplistic IP-only limit that can be trivially bypassed.

Do not permanently lock users in a way that enables attackers to lock out accounts deliberately.

Test:

```text
100 failed logins
100 password-reset attempts
100 OTP attempts
100 API authentication attempts
```

using a safe test environment or controlled production testing where authorized.

Verify that abuse is throttled.

---

# 7. CREDENTIAL SECURITY

Never store passwords in plaintext.

Never log:

* passwords
* OTPs
* access tokens
* refresh tokens
* API keys
* database passwords
* private keys.

Verify password hashing uses an appropriate password-hashing mechanism.

Never create:

* master passwords
* hidden administrator passwords
* bypass passwords
* universal login credentials.

Search for hardcoded credentials.

---

# 8. SESSION SECURITY

Audit:

* cookies
* access tokens
* refresh tokens
* JWTs
* session IDs.

Check:

* Secure
* HttpOnly
* SameSite
* expiration
* rotation
* revocation
* logout behavior
* refresh behavior
* token audience
* issuer
* signature validation
* algorithm restrictions.

Never trust a JWT merely because it is syntactically valid.

---

# 9. AUTHORIZATION SECURITY

For every protected resource determine:

```text
WHO
↓
WHAT ROLE
↓
WHAT PERMISSION
↓
WHAT RESOURCE
↓
WHAT OPERATION
```

Test:

```text
Anonymous → protected resource
User A → User B
User → Admin
User → Staff
Staff → Admin
Tenant A → Tenant B
```

Authorization must be enforced server-side.

---

# 10. IDOR / BOLA SECURITY

Test every identifier:

* user ID
* profile ID
* document ID
* order ID
* invoice ID
* payment ID
* file ID
* case ID
* organization ID
* tenant ID
* database record ID.

Change:

```text
/resource/123
```

to:

```text
/resource/124
```

and verify unauthorized access is denied.

Do not rely on obscure IDs alone.

---

# 11. MULTI-TENANT SECURITY

If the application supports organizations, companies, teams, groups, or tenants:

Every database query must enforce tenant ownership.

Test:

```text
Tenant A
↓
attempt Tenant B resource
```

Verify:

* SELECT denied
* INSERT denied
* UPDATE denied
* DELETE denied
* export denied
* storage access denied
* API access denied.

---

# 12. DATABASE SECURITY — UNIVERSAL PROVIDER RULE

The application may use any database.

Do not assume:

> "Supabase is secure."

Do not assume:

> "Firebase is secure."

Do not assume:

> "MongoDB is secure."

Do not assume:

> "PostgreSQL is secure."

The application must correctly configure the provider's security model.

---

# 13. DATABASE CREDENTIAL SEPARATION

Identify every database credential.

Separate:

### Public/client credential

May be intentionally exposed if the provider's architecture specifically designs it to be public and its security is enforced through rules/policies.

### Privileged/server credential

Must NEVER be exposed to:

* frontend
* browser
* public JavaScript
* HTML
* public source maps
* client-side logs
* localStorage
* sessionStorage
* URL
* query parameters.

Examples include:

* Supabase service-role keys
* Firebase Admin credentials
* MongoDB connection strings containing credentials
* PostgreSQL passwords
* MySQL passwords
* cloud service credentials.

---

# 14. IMPORTANT PUBLIC-KEY RULE

Do NOT incorrectly classify every frontend configuration value as a secret.

Some providers intentionally expose client configuration.

For example, a provider may require a public client identifier or public API key.

Determine whether a value is:

```text
PUBLIC CLIENT CONFIGURATION
```

or:

```text
PRIVILEGED SECRET
```

before deciding it is vulnerable.

However:

> A public client key must NEVER be treated as authorization by itself.

Its security must come from:

* authentication
* database rules
* RLS
* security rules
* API authorization
* resource ownership.

---

# 15. `.ENV` SECURITY

Search for accidental exposure of:

```text
.env
.env.local
.env.production
.env.development
.env.* 
```

Verify the web server cannot serve them.

Test:

```text
https://example.com/.env
https://example.com/.env.local
https://example.com/.env.production
```

and equivalent paths.

They must return:

```text
404
```

or an appropriate denial response.

Also inspect:

* backup directories
* deployment artifacts
* temporary directories
* source maps
* build output
* Git repositories
* archive files.

---

# 16. SOURCE-CODE EXPOSURE

Verify attackers cannot download:

* source code
* backend source
* server configuration
* `.git`
* `.svn`
* backup files
* `.zip`
* `.tar`
* database dumps
* source maps containing sensitive information
* deployment files.

Check:

```text
/.git/
/.git/config
/.env
/package.json
/server/
/src/
/backup/
/database.sql
```

Do not expose sensitive server-side source through static hosting.

---

# 17. SECRET LEAKAGE THROUGH FRONTEND

Search the final production JavaScript bundle.

Do NOT merely inspect source code.

Search built artifacts for:

* API secrets
* database passwords
* service-role keys
* private keys
* OAuth secrets
* webhook secrets
* JWT signing secrets
* SMTP credentials
* cloud credentials.

A secret is still exposed if it is:

```text
minified
obfuscated
Base64 encoded
split into strings
embedded in JavaScript
```

Obfuscation does not make a secret secret.

---

# 18. SOURCE MAP SECURITY

Inspect:

```text
*.map
```

Determine whether source maps expose:

* backend source
* internal endpoints
* secrets
* private filenames
* credentials
* development code
* internal configuration.

Do not expose production source maps unnecessarily.

---

# 19. API SECURITY INVENTORY

Create a complete endpoint table:

| Method | Endpoint | Auth | Role | Resource | Input | Output | Rate Limit | Risk |
| ------ | -------- | ---- | ---- | -------- | ----- | ------ | ---------- | ---- |

Inventory:

* REST
* GraphQL
* RPC
* server actions
* serverless functions
* edge functions
* webhooks.

---

# 20. API AUTHORIZATION

For every endpoint test:

```text
Anonymous
User A
User B
Staff
Admin
Tenant A
Tenant B
```

Do not assume authentication automatically grants correct authorization.

---

# 21. INPUT VALIDATION

Every external input is untrusted.

Audit:

* query parameters
* path parameters
* request body
* headers
* cookies
* JSON
* multipart forms
* filenames
* URLs
* IDs
* sorting
* filtering
* pagination
* search queries.

Validate:

* type
* length
* format
* range
* allowed values
* encoding.

Reject invalid input.

---

# 22. SQL INJECTION

If SQL is used:

Never construct SQL using raw user input.

Check:

* prepared statements
* parameterized queries
* ORM safety
* dynamic table names
* dynamic column names
* sorting
* filtering
* search.

Test safely for:

```text
'
"
OR
AND
UNION
comment syntax
```

Do not expose database errors to users.

---

# 23. NOSQL INJECTION

If MongoDB or another NoSQL database is used:

Check whether user input can become query operators such as:

```text
$ne
$gt
$gte
$lt
$in
$nin
$regex
$where
```

Do not allow arbitrary query objects from users.

Convert user input into explicitly validated fields.

---

# 24. XSS SECURITY

Audit:

* reflected XSS
* stored XSS
* DOM XSS
* HTML injection
* Markdown rendering
* rich text
* user profile fields
* comments
* forum content
* admin content.

Never render untrusted HTML without sanitization.

Also implement an appropriate Content Security Policy.

---

# 25. CSRF SECURITY

For cookie-based authentication:

Verify CSRF protection for state-changing operations:

* POST
* PUT
* PATCH
* DELETE.

Check:

* SameSite cookies
* CSRF tokens
* Origin/Referer validation where appropriate.

Do not assume CORS alone prevents CSRF.

---

# 26. SSRF SECURITY

Find every server-side feature that accepts a URL.

Examples:

* image import
* URL preview
* webhook configuration
* PDF fetching
* external document import
* remote image loading.

Prevent requests to:

```text
localhost
127.0.0.1
::1
private IP ranges
cloud metadata services
internal services
database hosts
admin interfaces
```

Use strict destination allowlists when possible.

---

# 27. COMMAND INJECTION

Search server-side code for:

* shell execution
* child process execution
* PowerShell
* CMD
* Bash
* system commands
* OS APIs.

If not required:

> REMOVE IT.

If required:

* fixed executable
* fixed command
* allowlisted arguments
* no shell interpolation
* no user-controlled command
* least privilege.

---

# 28. SERVER FILESYSTEM SECURITY

A production web application must NOT give users arbitrary access to the server filesystem.

Verify users cannot:

* read `/etc`
* read environment files
* read application source
* read another user's files
* read database files
* write server source
* overwrite configuration
* delete application files
* execute uploaded scripts
* access another application's directories.

---

# 29. PATH TRAVERSAL

Test:

```text
../
..\ 
../../
..\..\ 
absolute paths
UNC paths
encoded traversal
double encoding
mixed separators
```

Never trust:

```text
filename
path
folder
directory
```

from a user.

Canonicalize and authorize the resolved path.

---

# 30. FILE UPLOAD SECURITY

If uploads exist:

Validate:

* file size
* MIME type
* file signature
* extension
* filename
* storage location.

Never allow uploaded files to become executable server-side.

Store uploads outside executable application directories where possible.

---

# 31. MALICIOUS DOCUMENT SECURITY

If the application processes:

* PDF
* DOC
* DOCX
* XLS
* XLSX
* PPT
* images
* archives
* SVG.

Determine whether malicious files can trigger:

* code execution
* parser vulnerabilities
* SSRF
* resource exhaustion
* command injection
* path traversal.

Use isolated processing where appropriate.

---

# 32. STORAGE SECURITY

For every storage provider:

Determine:

* public/private
* bucket permissions
* object permissions
* upload permissions
* download permissions
* delete permissions
* signed URL behavior
* expiration
* ownership.

Test:

```text
User A → User B file
Anonymous → private file
User → arbitrary object
User → delete another user's file
```

---

# 33. DATABASE EXPORT / BACKUP SECURITY

Search for:

* database dumps
* backups
* exports
* snapshots
* CSV exports
* JSON exports
* administrative downloads.

Ensure they cannot be accessed by unauthorized users.

Backups must not be accidentally published through the website.

---

# 34. WEBHOOK SECURITY

For every webhook:

Verify:

* signature
* secret
* timestamp
* replay protection
* payload validation
* idempotency
* authorization.

Never trust a webhook simply because it comes from a URL that is difficult to guess.

---

# 35. RATE LIMITING

Identify sensitive endpoints:

* login
* signup
* password reset
* OTP
* email verification
* search
* upload
* export
* expensive AI calls
* database-heavy queries
* admin operations.

Apply appropriate limits.

Also protect against:

* request flooding
* large payloads
* expensive queries
* pagination abuse
* recursive queries
* file upload abuse.

---

# 36. DENIAL-OF-SERVICE RESILIENCE

Check:

* maximum request body
* maximum upload size
* maximum query depth
* maximum pagination
* maximum execution time
* database query limits
* memory-intensive operations
* image processing
* PDF processing
* archive extraction.

Prevent:

```text
ZIP bombs
decompression bombs
huge JSON
huge multipart requests
regex DoS
expensive database queries
```

---

# 37. SECURITY HEADERS

Inspect production response headers.

Implement appropriate:

* Content-Security-Policy
* Strict-Transport-Security
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* frame protection.

Do not blindly copy a CSP without testing application requirements.

---

# 38. HTTPS / TLS

Verify:

* HTTPS enforced
* HTTP redirected safely
* secure cookies
* no mixed content
* no sensitive HTTP endpoints
* valid certificate
* secure external integrations.

---

# 39. CORS

Do not use:

```text
Access-Control-Allow-Origin: *
```

for authenticated/private APIs unless there is a very specific justified design.

Never combine:

```text
*
```

with credentialed requests.

Allow only required origins.

---

# 40. DATABASE PRIVILEGE

The application database account should have the minimum required privileges.

Do not use an unrestricted database administrator account for normal application queries.

Separate:

```text
APPLICATION
↓
LIMITED DATABASE USER
```

from:

```text
ADMINISTRATION
↓
PRIVILEGED DATABASE USER
```

---

# 41. SERVICE-ROLE / ADMIN CREDENTIAL SECURITY

Privileged credentials must exist only where required:

```text
SERVER
```

Never:

```text
FRONTEND
```

Never expose them through API responses.

Never return them through:

```text
/debug
/config
/status
/environment
/admin
```

---

# 42. ERROR MESSAGE SECURITY

Production errors must not reveal:

* SQL queries
* database credentials
* filesystem paths
* stack traces
* source code
* environment variables
* internal IP addresses
* private service URLs
* tokens.

Return safe generic errors.

Log detailed diagnostics securely server-side.

---

# 43. DEBUG / DEVELOPMENT MODE

Search for:

* debug mode
* development mode
* test routes
* debug APIs
* mock authentication
* fake payment mode
* test accounts
* development credentials
* admin bypasses.

Production must not expose development-only functionality.

---

# 44. DEPENDENCY SECURITY

Inspect:

* package.json
* lock files
* dependencies
* plugins
* libraries
* native modules
* Git dependencies.

Check:

* known vulnerabilities
* abandoned packages
* suspicious packages
* typosquatting
* install scripts
* postinstall scripts
* unnecessary packages.

Do not automatically update everything.

Determine compatibility first.

---

# 45. SUPPLY-CHAIN SECURITY

Search for suspicious:

* npm packages
* Python packages
* Git repositories
* remote scripts
* CDN scripts
* dynamically loaded JavaScript.

Verify third-party scripts are necessary.

Remove unnecessary third-party code.

---

# 46. THIRD-PARTY SCRIPT SECURITY

For:

* analytics
* advertising
* chat
* payment
* social login
* maps
* AI
* monitoring.

Determine:

```text
WHAT DATA
↓
IS SENT
↓
TO WHOM
↓
WHY
↓
WITH WHAT PERMISSION
```

Do not send unnecessary personal information.

---

# 47. ENVIRONMENT SEPARATION

Ensure:

```text
DEVELOPMENT
STAGING
PRODUCTION
```

credentials and databases are separate.

Never allow a production deployment to accidentally use:

* development database
* test credentials
* development API
* test payment system.

---

# 48. SERVER FILE AND FOLDER ISOLATION

If the application has access to the server filesystem:

Determine its exact required directories.

It must not automatically access:

```text
other applications
other users
system files
database files
SSH keys
cloud credentials
deployment credentials
.env
server configuration
```

Use least privilege.

If the application does not need filesystem access:

> Remove it.

---

# 49. SERVER NETWORK ISOLATION

Determine every network destination the server can access.

If the application only needs:

```text
Database
Storage
Payment API
Email API
```

it should not have unrestricted access to unrelated internal services where infrastructure allows network controls.

Use:

* firewall rules
* security groups
* network policies
* private networking
* allowlists.

---

# 50. CLOUD METADATA PROTECTION

If running in a cloud environment, verify SSRF cannot access cloud instance metadata or credentials.

Do not expose cloud credentials to application users.

Use appropriate cloud identity mechanisms instead of hardcoded credentials where possible.

---

# 51. LOG SECURITY

Logs must never contain:

* passwords
* access tokens
* refresh tokens
* API keys
* database passwords
* private keys
* full payment information
* unnecessary personal data.

Also protect the logging system itself.

---

# 52. MONITORING / SECURITY ALERTING

For production applications consider monitoring:

* repeated failed logins
* impossible login patterns
* unusual admin actions
* privilege changes
* mass downloads
* mass exports
* unusual API usage
* repeated authorization failures
* suspicious file uploads
* abnormal database usage.

Do not log sensitive secrets while monitoring.

---

# 53. ACCOUNT TAKEOVER PROTECTION

Protect:

* password reset
* email change
* password change
* MFA change
* recovery methods
* session management.

Sensitive account changes should require appropriate reauthentication or verification.

---

# 54. PRIVILEGE ESCALATION TEST

Attempt:

```text
User
↓
modify role
↓
Admin
```

Also test:

```text
User
↓
modify permissions
↓
Admin functionality
```

Role and permission changes must be controlled server-side.

---

# 55. MASS ASSIGNMENT / OBJECT PROPERTY INJECTION

Test whether users can submit:

```json
{
  "role": "admin",
  "isAdmin": true,
  "ownerId": "other-user",
  "permissions": ["admin"]
}
```

and whether the server accidentally accepts protected fields.

Only explicitly allowed fields should be writable.

---

# 56. BUSINESS LOGIC SECURITY

Test:

* duplicate actions
* race conditions
* negative values
* zero values
* huge values
* unauthorized cancellation
* unauthorized approval
* status manipulation
* skipped workflow steps
* repeated rewards
* repeated coupons
* repeated refunds
* repeated submissions.

---

# 57. DATA ENUMERATION

Determine whether attackers can enumerate:

* users
* emails
* phone numbers
* order IDs
* document IDs
* organization IDs
* internal IDs.

Where appropriate, use generic responses.

---

# 58. SEARCH / FILTER SECURITY

Search endpoints can become expensive.

Protect against:

* wildcard abuse
* regex abuse
* huge result sets
* unrestricted sorting
* arbitrary field selection
* expensive joins
* unrestricted database queries.

---

# 59. GRAPHQL SECURITY — IF APPLICABLE

Check:

* introspection
* authorization
* query depth
* query complexity
* batching
* field-level authorization
* nested resource access.

Do not assume GraphQL automatically handles authorization.

---

# 60. SECURITY TODO LIST

After the complete audit:

**STOP.**

Do not start fixing yet.

Create an exhaustive TODO list.

Every vulnerability gets a unique ID:

```text
SEC-001
SEC-002
SEC-003
...
```

Use:

| ID | Severity | Category | Vulnerability | Location | Risk | Fix | Verification |
| -- | -------- | -------- | ------------- | -------- | ---- | --- | ------------ |

---

# 61. TODO COMPLETENESS VERIFICATION

Before implementation check:

```text
[ ] Authentication
[ ] Password security
[ ] MFA
[ ] Session security
[ ] Brute force
[ ] Credential stuffing
[ ] Authorization
[ ] RBAC
[ ] IDOR/BOLA
[ ] Multi-tenancy
[ ] API
[ ] SQL injection
[ ] NoSQL injection
[ ] XSS
[ ] CSRF
[ ] SSRF
[ ] Command injection
[ ] File upload
[ ] Path traversal
[ ] Filesystem
[ ] Database
[ ] RLS/security rules
[ ] Database permissions
[ ] Storage
[ ] Backups
[ ] Secrets
[ ] .env
[ ] Frontend bundle
[ ] Source maps
[ ] Git exposure
[ ] Debug endpoints
[ ] Admin endpoints
[ ] Webhooks
[ ] Rate limits
[ ] DoS
[ ] CORS
[ ] CSP
[ ] HTTPS
[ ] Cookies
[ ] Error handling
[ ] Logging
[ ] Dependencies
[ ] Supply chain
[ ] Third-party services
[ ] Cloud security
[ ] Server filesystem
[ ] Server network
[ ] Business logic
[ ] Race conditions
[ ] Data enumeration
[ ] Account takeover
[ ] Privilege escalation
```

If anything applicable has not been examined:

> **CREATE A TODO ITEM.**

---

# 62. IMPLEMENT ONE SECURITY TODO AT A TIME

For each item:

```text
ANALYZE
↓
IMPLEMENT
↓
BUILD
↓
SECURITY TEST
↓
NEGATIVE TEST
↓
REGRESSION TEST
↓
VERIFY
↓
MARK COMPLETE
```

Do not implement everything at once.

---

# 63. SECURITY FIX VERIFICATION

Never say:

> "Fixed."

unless you actually verify the vulnerability.

Example:

```text
Authorization fixed
↓
User A attempts User B resource
↓
Request denied
↓
Verified
```

Example:

```text
.env exposure fixed
↓
Request /.env
↓
404/denied
↓
Verified
```

Example:

```text
Admin endpoint protected
↓
Anonymous request
↓
401/403
↓
Verified
```

---

# 64. FRESH SECURITY RESCAN

After all TODOs are completed:

Perform a completely new security audit.

Do not simply review your own changes.

Search again for the original vulnerability and equivalent bypasses.

---

# 65. ATTACK SIMULATION

Where authorized and safe, test the application as an attacker would.

Test:

```text
Anonymous
↓
Login
↓
User
↓
Another User
↓
Admin
```

Attempt:

* unauthorized API access
* ID manipulation
* role manipulation
* token manipulation
* parameter manipulation
* malicious uploads
* injection
* brute force
* rate-limit bypass
* storage access
* database access
* endpoint enumeration.

Do not perform destructive attacks against production.

Use controlled test accounts/resources.

---

# 66. PRODUCTION SAFETY RULE

Do NOT perform destructive penetration tests against a live production system.

Never:

* delete production data
* corrupt production database
* intentionally crash production
* flood production with traffic
* run uncontrolled brute-force attacks
* exploit third-party systems
* scan infrastructure you do not own/control.

Use:

* staging
* local test environment
* test accounts
* test records
* controlled requests.

---

# 67. FINAL SECURITY MATRIX

Produce:

| Security Area       | Status    | Evidence |
| ------------------- | --------- | -------- |
| Authentication      | PASS/FAIL | ...      |
| Authorization       | PASS/FAIL | ...      |
| Database            | PASS/FAIL | ...      |
| Storage             | PASS/FAIL | ...      |
| Secrets             | PASS/FAIL | ...      |
| API                 | PASS/FAIL | ...      |
| XSS                 | PASS/FAIL | ...      |
| SQL/NoSQL Injection | PASS/FAIL | ...      |
| CSRF                | PASS/FAIL | ...      |
| SSRF                | PASS/FAIL | ...      |
| Filesystem          | PASS/FAIL | ...      |
| Brute Force         | PASS/FAIL | ...      |
| Rate Limiting       | PASS/FAIL | ...      |
| Cloud               | PASS/FAIL | ...      |
| Dependencies        | PASS/FAIL | ...      |
| Business Logic      | PASS/FAIL | ...      |

---

# 68. FINAL SECRET EXPOSURE VERIFICATION

Perform a final search of:

### Source

```text
src/
server/
api/
functions/
workers/
```

### Configuration

```text
.env
.env.*
config
```

### Build

```text
dist/
build/
public/
```

### Git

```text
.git/
history
```

### Logs

```text
logs/
monitoring
```

### Backups

```text
*.sql
*.dump
*.json
*.zip
*.tar
*.backup
```

Verify no privileged secrets are publicly accessible.

---

# 69. IMPORTANT SECRET CLASSIFICATION

Do not make the incorrect claim:

> "No API key can ever appear in frontend code."

Some public client configuration values are intentionally designed to be present in frontend applications.

Instead determine:

### SAFE TO EXPOSE

Only if the provider explicitly designs it as public and access is securely controlled through:

* RLS
* security rules
* backend authorization
* resource permissions.

### MUST NEVER BE EXPOSED

Examples:

* database passwords
* service-role keys
* admin SDK credentials
* private keys
* JWT signing secrets
* cloud secret credentials
* SMTP passwords
* payment secret keys
* webhook signing secrets
* privileged API keys.

---

# 70. FINAL ACCESS CONTROL PRINCIPLE

The application must follow:

```text
AUTHENTICATION
+
AUTHORIZATION
+
RESOURCE OWNERSHIP
+
LEAST PRIVILEGE
```

Not:

```text
LOGIN = ACCESS TO EVERYTHING
```

---

# 71. FINAL ACCEPTANCE CRITERIA

The application is not considered hardened until:

```text
[ ] No authentication bypass
[ ] No authorization bypass
[ ] No IDOR/BOLA
[ ] No privilege escalation
[ ] No brute-force weakness
[ ] No credential stuffing weakness
[ ] No session vulnerability
[ ] No sensitive secret exposure
[ ] No .env exposure
[ ] No database credential exposure
[ ] No service-role credential exposure
[ ] No private storage exposure
[ ] No unauthorized database access
[ ] No unauthorized cross-tenant access
[ ] No SQL injection
[ ] No NoSQL injection
[ ] No XSS
[ ] No CSRF
[ ] No SSRF
[ ] No command injection
[ ] No arbitrary code execution
[ ] No arbitrary file access
[ ] No path traversal
[ ] No malicious upload execution
[ ] No unauthorized server filesystem access
[ ] No unauthorized server network access
[ ] No debug endpoint exposure
[ ] No hidden admin bypass
[ ] No unsafe webhook
[ ] No unrestricted API
[ ] Rate limits implemented where required
[ ] DoS protections implemented where required
[ ] CORS correctly configured
[ ] CSP correctly configured
[ ] HTTPS enforced
[ ] Cookies securely configured
[ ] Errors sanitized
[ ] Logs sanitized
[ ] Dependencies audited
[ ] Supply chain audited
[ ] Cloud configuration audited
[ ] Backups protected
[ ] Business logic audited
[ ] Race conditions considered
[ ] Third-party integrations audited
[ ] Fresh security rescan completed
[ ] Regression testing completed
```

---

# 72. FINAL REPORT

Provide:

## Overall Status

```text
HARDENED
HARDENED WITH CONDITIONS
NOT HARDENED
```

## Vulnerabilities

```text
CRITICAL:
HIGH:
MEDIUM:
LOW:
```

## TODO

```text
TOTAL:
COMPLETED:
FAILED:
PARTIAL:
NOT VERIFIED:
```

## Remaining Risks

List every unresolved risk.

Do not hide anything.

---

# 73. FINAL COMMAND TO THE AI

**START WITH ANALYSIS ONLY.**

Do not modify code yet.

First produce:

1. Complete production architecture.
2. Complete Internet attack surface.
3. Complete domain/subdomain/API inventory.
4. Authentication inventory.
5. Authorization/RBAC inventory.
6. Database inventory.
7. Database policy/security-rule inventory.
8. Storage inventory.
9. API inventory.
10. Secret inventory.
11. Frontend exposure inventory.
12. `.env` exposure analysis.
13. Server filesystem analysis.
14. Server network analysis.
15. Dependency/supply-chain analysis.
16. Third-party integration analysis.
17. Injection vulnerability analysis.
18. Brute-force/abuse analysis.
19. Business-logic analysis.
20. Complete vulnerability inventory.
21. Complete security TODO list.
22. TODO completeness verification.

**DO NOT BEGIN FIXING UNTIL THE COMPLETE TODO LIST HAS BEEN CREATED AND VERIFIED FOR COMPLETENESS.**

Then:

```text
TODO #1
→ ANALYZE
→ IMPLEMENT
→ TEST
→ VERIFY
→ REGRESSION CHECK
→ MARK COMPLETE

TODO #2
→ ANALYZE
→ IMPLEMENT
→ TEST
→ VERIFY
→ REGRESSION CHECK
→ MARK COMPLETE
```

Continue until every TODO is completed or explicitly documented as unable to be verified.

Then perform:

```text
FRESH SECURITY AUDIT
↓
ATTACK-SURFACE RESCAN
↓
SECRET RESCAN
↓
DATABASE RESCAN
↓
API RESCAN
↓
AUTHORIZATION RESCAN
↓
INJECTION RESCAN
↓
FILESYSTEM RESCAN
↓
DEPENDENCY RESCAN
↓
REGRESSION TEST
↓
FINAL SECURITY REPORT
```

### ABSOLUTE RULES

**Never trust the client.**

**Never trust frontend authorization.**

**Never expose privileged secrets to the frontend.**

**Never trust a user-supplied database ID.**

**Never trust a user-supplied file path.**

**Never trust a user-supplied filename.**

**Never trust a user-supplied URL.**

**Never trust a user-supplied role.**

**Never trust a user-supplied permission.**

**Never trust a user-supplied database query.**

**Never trust uploaded files.**

**Never trust webhook payloads without verification.**

**Never assume the database provider is secure without auditing its actual configuration.**

**Never assume HTTPS solves authorization.**

**Never assume login means authorization.**

**Never assume a public API key is a security boundary.**

**Never expose privileged credentials.**

**Never allow arbitrary server-side command execution.**

**Never allow arbitrary server filesystem access.**

**Never allow arbitrary server network access.**

**Never allow unauthorized users to access another user's resources.**

**Never mark a vulnerability fixed without verification.**

**Never mark an untested control as PASS.**

If something cannot be tested, explicitly report:

> **NOT VERIFIED**

Do not guess.

Do not hide limitations.

Do not claim the application is "100% secure."

The goal is to achieve the strongest practical security posture through **defense in depth, least privilege, strict authentication, strict authorization, input validation, resource isolation, secret protection, secure database policies, secure storage, rate limiting, monitoring, and continuous verification.**

