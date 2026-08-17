# LOCK DOWN [APPLICATION_NAME] AGAINST LOCALHOST, POWERSHELL, CMD, FILESYSTEM, CHILD-PROCESS, SCRIPT & CODE-INJECTION ATTACKS

## IMPORTANT — THIS IS A SECOND SECURITY HARDENING PASS

The previous security audit reported that SEC-001 through SEC-009 were fixed and that the application passed its initial Local Machine Capability audit. However, the previous report also identified remaining conditions including PowerShell `-ExecutionPolicy Bypass`, lack of authentication for the local API, physical hardware verification limitations, and filesystem access through the OS temporary directory.  

**Do NOT simply accept those previous PASS results.**

Perform a new, independent **defense-in-depth hardening audit** specifically focused on protecting the Windows machine, localhost server, filesystem, PowerShell, CMD, child processes, scripts, temporary files, printer/scanner interfaces, and application process from unauthorized access or injection.

The objective is:

> **The application must expose the absolute minimum operating-system capability required for its legitimate functionality. Nothing more.**

---

# 1. DO NOT START CODING YET

Do not modify anything initially.

First inspect the current implementation after the previous security fixes.

Create a new hardening assessment.

The mandatory workflow is:

```text
CURRENT SECURITY IMPLEMENTATION
        ↓
INDEPENDENT HARDENING AUDIT
        ↓
ATTACK-SURFACE INVENTORY
        ↓
CAPABILITY BOUNDARY ANALYSIS
        ↓
FIND REMAINING WEAKNESSES
        ↓
CREATE HARDENING TODO LIST
        ↓
CHECK TODO LIST FOR COMPLETENESS
        ↓
IMPLEMENT ONE ITEM
        ↓
VERIFY ONE ITEM
        ↓
REGRESSION TEST
        ↓
NEXT ITEM
        ↓
FRESH SECURITY RESCAN
        ↓
FINAL HARDENING VERIFICATION
```

**Do not skip directly to implementation.**

---

# 2. SECURITY OBJECTIVE

Harden the application against:

* remote network access
* LAN access
* malicious websites
* cross-origin attacks
* localhost abuse
* localhost API abuse
* CSRF
* SSRF
* arbitrary local API requests
* command injection
* PowerShell injection
* CMD injection
* shell injection
* argument injection
* path traversal
* arbitrary filesystem access
* arbitrary file read
* arbitrary file write
* arbitrary file deletion
* arbitrary file modification
* arbitrary process execution
* malicious child processes
* script injection
* executable injection
* temporary-file attacks
* symlink attacks
* junction attacks
* reparse-point attacks
* environment-variable injection
* working-directory manipulation
* printer abuse
* scanner abuse
* malicious uploaded files
* malicious document processing
* malicious Word/PDF processing
* hidden scripts
* persistence
* backdoors
* remote command execution
* unauthorized localhost services
* unauthorized drive access
* unauthorized folder access
* unauthorized sibling/child directory access
* malicious code injected through PowerShell/CMD
* malicious code stored by the application
* malicious code subsequently executed by the application

---

# 3. IMPORTANT THREAT-MODEL DISTINCTION

You MUST distinguish between:

### A. Remote attacker

An attacker on:

* Internet
* Wi-Fi
* LAN
* another computer

### B. Malicious website

A website opened in the user's browser attempting to access:

```text
127.0.0.1
localhost
```

### C. Malicious local application

Another application already running on the same Windows computer attempting to access the [APPLICATION_NAME] localhost API.

### D. Same-user malicious process

A malicious process running under the same Windows user account.

### E. Administrator/system-level attacker

A process already running with Administrator/SYSTEM privileges.

Do not claim that the application can completely protect against category E.

A normal user-mode application cannot prevent an already-compromised Administrator/SYSTEM account from inspecting or manipulating its process and files.

Instead:

> **Protect against everything the application can realistically control, and clearly document OS-level limitations.**

---

# 4. LOCALHOST SERVER MUST BE TREATED AS A SECURITY BOUNDARY

The server currently binds to:

```text
127.0.0.1:3001
```

Do not consider this alone sufficient.

Verify:

* IPv4 binding
* IPv6 binding
* hostname resolution
* `localhost`
* `127.0.0.1`
* `::1`
* alternative loopback representations
* browser access
* LAN access
* proxy access

Ensure the server cannot accidentally expose itself through:

```text
0.0.0.0
::
LAN IP
Wi-Fi IP
Ethernet IP
```

unless explicitly required.

---

# 5. LOCALHOST API AUTHORIZATION

The application currently relies heavily on origin/same-site validation.

Do not treat Origin validation as equivalent to authentication.

Determine whether another local process can directly send:

```text
HTTP requests → 127.0.0.1:3001
```

without possessing any application-specific authorization.

If yes, determine whether this creates a meaningful security risk.

For every endpoint:

```text
GET /api/printers
POST /api/scan
POST /api/scan/cancel
POST /api/upload
```

determine:

```text
WHO CAN CALL IT?
WHAT AUTHORIZATION IS REQUIRED?
WHAT CAN THEY MAKE THE COMPUTER DO?
WHAT DATA CAN THEY RECEIVE?
```

---

# 6. DO NOT PUT A PERMANENT SECRET IN FRONTEND CODE

If you decide to add authentication to the localhost API:

DO NOT simply place a permanent API key/token in:

* JavaScript bundle
* `.env` exposed to Vite
* HTML
* localStorage
* sessionStorage
* source code

A secret shipped to the browser is not truly secret from code running in that browser context.

If stronger local authentication is necessary, design it appropriately for the application's architecture.

Consider:

* per-launch authentication
* OS-level IPC
* Windows named pipes with appropriate ACLs
* native application boundary
* authenticated local IPC
* tightly scoped temporary credentials

Choose the safest solution that preserves the application's functionality.

Do not introduce an unnecessarily complicated architecture without first analyzing the current architecture.

---

# 7. CROSS-ORIGIN PROTECTION

Verify that malicious websites cannot cause:

```text
/api/scan
/api/upload
/api/printers
/api/scan/cancel
```

to execute.

Test:

```text
Origin: https://evil.example
Sec-Fetch-Site: cross-site
```

and other browser-origin combinations.

Test:

* GET
* POST
* OPTIONS
* redirects
* malformed Origin
* missing Origin
* null Origin
* file origin
* localhost
* 127.0.0.1
* IPv6 loopback

Only permit origins genuinely required by the application.

---

# 8. DO NOT OVER-TRUST `Origin`

Origin validation is one layer.

Also verify:

* request authentication where appropriate
* content type
* request schema
* CSRF protection
* endpoint authorization
* rate limits
* request size
* resource ownership
* operation allowlists

Never rely on a single security mechanism.

---

# 9. POWERSHELL MUST BE HARDENED

The previous report states that PowerShell uses static `-EncodedCommand` scripts and that user input is passed through environment variables. 

Re-audit every PowerShell invocation.

Find every:

```text
powershell.exe
pwsh.exe
-Command
-EncodedCommand
-ExecutionPolicy
```

and every indirect invocation.

For every invocation determine:

```text
WHY?
EXACT SCRIPT?
INPUT?
ARGUMENTS?
ENVIRONMENT?
WORKING DIRECTORY?
PRIVILEGE?
OUTPUT?
```

---

# 10. REMOVE `-ExecutionPolicy Bypass` IF POSSIBLE

The previous report explicitly lists:

> `-ExecutionPolicy Bypass` — accepted cosmetic risk.

Do NOT automatically accept this.

Determine why it exists.

Attempt to eliminate it.

Prefer the safest available alternative.

If PowerShell is genuinely required:

* use a fixed script
* use an absolute executable path
* use fixed arguments
* use validated structured input
* never concatenate user input into PowerShell source
* never accept arbitrary PowerShell
* never accept arbitrary script paths
* never accept arbitrary executable paths
* never accept arbitrary working directories

If `-ExecutionPolicy Bypass` absolutely cannot be removed:

1. Document the exact reason.
2. Determine the minimum scope.
3. Determine exactly what script it bypasses policy for.
4. Ensure the script cannot be modified by the user.
5. Ensure the script cannot be replaced through the application's filesystem APIs.
6. Ensure the script cannot load arbitrary external code.
7. Ensure the script cannot execute arbitrary commands.
8. Verify the process privilege.
9. Verify the working directory.
10. Verify the environment.
11. Add a dedicated security test.

Do not call it merely a "cosmetic risk" without performing this analysis.

---

# 11. POWERSHELL SCRIPT IMMUTABILITY

Any PowerShell script used by [APPLICATION_NAME] must be protected from modification by untrusted application input.

Check whether a user can cause:

```text
SCRIPT FILE
↓
MODIFIED
↓
EXECUTED
```

If yes, this is a potential code-execution vulnerability.

The application must never execute a PowerShell script that can be modified through an untrusted input path.

---

# 12. POWERSHELL INPUT SEPARATION

Never construct:

```text
PowerShell source + user input
```

Instead:

```text
FIXED TRUSTED SCRIPT
+
VALIDATED DATA
```

Verify that:

* quotes cannot escape
* newline cannot escape
* semicolon cannot inject commands
* pipe cannot inject commands
* `$()` cannot inject commands
* backticks cannot alter execution
* environment variables cannot modify script behavior
* arguments cannot modify script behavior

Test hostile values.

---

# 13. CMD SECURITY

Search the entire repository for:

```text
cmd.exe
/c
call
start
```

and indirect CMD execution.

If CMD is not required:

> REMOVE IT.

If required:

* absolute executable path
* fixed command
* fixed arguments
* allowlisted data
* no arbitrary command input
* no shell metacharacter injection
* no command chaining
* no redirection
* no pipe
* no nested shell

Test malicious input.

---

# 14. NO ARBITRARY SHELL

The application must never expose a generic mechanism equivalent to:

```text
runCommand(userInput)
```

or:

```text
execute(userCommand)
```

or:

```text
powershell(userScript)
```

or:

```text
cmd(userCommand)
```

If found:

> Treat it as a critical security issue unless absolutely required by the application's legitimate function.

---

# 15. PROCESS EXECUTION ALLOWLIST

Create an explicit process allowlist.

For [APPLICATION_NAME], document every executable that may be launched.

Example structure:

```text
EXECUTABLE:
ABSOLUTE PATH:
PURPOSE:
CALLING FEATURE:
ALLOWED ARGUMENTS:
ALLOWED WORKING DIRECTORY:
ALLOWED ENVIRONMENT:
REQUIRED PRIVILEGE:
OUTPUT:
```

No executable outside the allowlist should be launchable through the application's code paths.

---

# 16. PREVENT CHILD-PROCESS ESCAPE

For every child process determine whether it can:

```text
spawn another process
spawn PowerShell
spawn CMD
spawn another shell
launch an executable
launch another application
download code
execute a script
modify files
```

The intended child process must not become an unrestricted process launcher.

---

# 17. WORKING DIRECTORY MUST BE LOCKED

If a feature requires a specific directory:

```text
D:\Gist
```

the process must not be able to change its working directory to:

```text
C:\
D:\
D:\OtherFolder
E:\
```

unless specifically authorized.

The working directory must be:

* fixed
* validated
* canonicalized
* checked before execution

---

# 18. FILESYSTEM — DO NOT USE A BROAD DIRECTORY AS THE SECURITY BOUNDARY

The previous report says the application uses:

```text
os.tmpdir()
```

for temporary files. 

Re-evaluate this.

Do NOT treat:

```text
C:\Users\<user>\AppData\Local\Temp
```

as equivalent to:

```text
[APPLICATION_NAME]'s own temporary directory
```

Create a dedicated application-owned temporary workspace if practical.

Example conceptual boundary:

```text
[APPLICATION_NAME]
└── dedicated-temp
    ├── scan-file-A
    ├── upload-file-B
    └── conversion-file-C
```

The application should know exactly which files it created.

---

# 19. FILE ACCESS MUST BE OBJECT-SCOPED

Do not authorize:

> "anything inside the temporary directory."

Instead authorize:

> "this specific server-generated temporary file created for this specific request."

Maintain an internal mapping such as:

```text
request/session
      ↓
generated random file ID
      ↓
exact canonical filesystem path
```

The client should never be able to choose an arbitrary filesystem path.

---

# 20. CHILD FILES MUST NOT AUTOMATICALLY BE ACCESSIBLE

This is extremely important.

If the application creates:

```text
[APPLICATION_NAME]-temp\
    scan-123.jpg
```

it must not automatically allow access to:

```text
[APPLICATION_NAME]-temp\
    another-file
    secret-file
    unrelated-file
    malicious-script.ps1
    malicious.exe
```

Simply being a child item of the approved directory does NOT make it authorized.

Authorization must be based on the exact resource.

---

# 21. PARENT DIRECTORY ESCAPE

Test:

```text
..
..\..
absolute path
UNC path
drive path
encoded path
mixed separators
alternate separators
```

Example:

```text
[APPLICATION_NAME]-temp\..\..\Sensitive
```

must fail.

---

# 22. SIBLING DIRECTORY ESCAPE

Test:

```text
[APPLICATION_NAME]-temp-A
[APPLICATION_NAME]-temp-B
[APPLICATION_NAME]-temp-malicious
[APPLICATION_NAME]-temp-backup
```

Do not use insecure prefix matching such as:

```text
path.startsWith("[APPLICATION_NAME]-temp")
```

because this can authorize unintended sibling paths.

Use canonical path comparison with a real directory boundary.

---

# 23. SYMLINK / JUNCTION / REPARSE POINT ESCAPE

Test:

```text
allowed-file
    ↓
symbolic link
    ↓
outside file
```

and:

```text
allowed-directory
    ↓
junction
    ↓
outside directory
```

The application must verify the actual filesystem target before sensitive operations.

---

# 24. FILE OPERATION MATRIX

For every file operation create:

| Operation | Exact Resource  | User Controlled? | Allowed?         | Verification |
| --------- | --------------- | ---------------- | ---------------- | ------------ |
| READ      | exact temp file | No               | Yes              | Tested       |
| WRITE     | exact temp file | No               | Yes              | Tested       |
| DELETE    | exact temp file | No               | Yes              | Tested       |
| RENAME    | exact temp file | No               | Only if required | Tested       |
| MOVE      | exact temp file | No               | Only if required | Tested       |
| EXECUTE   | none            | No               | **NO**           | Tested       |

---

# 25. APPLICATION MUST NEVER EXECUTE TEMP FILES

Any temporary file created for:

* image
* PDF
* scan
* upload
* conversion

must not become executable merely because it exists in an accessible directory.

Explicitly verify:

```text
.exe
.dll
.bat
.cmd
.ps1
.vbs
.js
.msi
.scr
.com
```

cannot be supplied through the upload pipeline and subsequently executed.

---

# 26. UPLOAD → PROCESSING → EXECUTION CHAIN

Map:

```text
USER FILE
↓
UPLOAD
↓
TEMP FILE
↓
PARSER
↓
CONVERTER
↓
EXTERNAL PROCESS
↓
OUTPUT
```

For every stage ask:

> Can attacker-controlled data become code?

Test malicious:

* PDF
* DOC
* DOCX
* image
* SVG
* malformed file
* oversized file
* archive
* polyglot file
* filename
* metadata

---

# 27. WORD / OFFICE CONVERSION SECURITY

The previous report says Word conversion could not be runtime-tested because Microsoft Word was unavailable. 

Do not mark this PASS.

Inspect the conversion implementation.

Determine:

* executable
* COM invocation
* PowerShell
* temporary paths
* input path
* output path
* working directory
* privileges
* cleanup
* macro possibility
* external links
* embedded objects
* malformed document behavior

If Microsoft Word is automated:

> Minimize its exposure to attacker-controlled documents and prevent arbitrary file/path selection.

If safe isolation is possible, use it.

---

# 28. PRINTER SECURITY

Printer functionality must be limited to the actual printer feature.

Do not allow:

```text
printer name
↓
shell command
```

Instead:

```text
validated printer identifier
↓
specific printer API
```

Verify printer names cannot inject:

* PowerShell
* CMD
* WMI
* shell syntax
* environment variables
* paths

---

# 29. SCANNER SECURITY

Scanner operations must be limited to:

```text
scanner selection
↓
scan
↓
controlled temporary output
↓
return result
↓
cleanup
```

Do not permit scanner input to become:

* command
* executable path
* arbitrary file path
* PowerShell script
* arbitrary WIA operation

---

# 30. BLOCK UNAUTHORIZED LOCAL NETWORK ACCESS

The application currently reports no outbound network requirement. 

Verify this independently.

If the application only requires:

```text
127.0.0.1:3001
```

then it must not start communicating with:

```text
192.168.x.x
10.x.x.x
172.16.x.x
172.31.x.x
other LAN devices
router
NAS
other computers
```

unless explicitly required.

---

# 31. BLOCK ARBITRARY LOCALHOST PORT ACCESS

The application should not accept a user-controlled URL such as:

```text
http://127.0.0.1:<user-port>
```

and request it.

If localhost access is required:

allowlist:

```text
host
port
path
method
content type
```

individually.

---

# 32. NO LOCALHOST SCANNER

The application must not contain functionality that can:

```text
scan localhost ports
enumerate localhost services
enumerate LAN services
probe arbitrary local URLs
```

unless explicitly required.

If found and unnecessary:

> REMOVE IT.

---

# 33. NO REMOTE COMMAND CHANNEL

Search for:

* WebSocket command channels
* polling commands
* remote scripts
* command endpoints
* remote configuration that can execute commands
* downloaded scripts
* update executables
* remote PowerShell
* remote shell

There must be no hidden remote-control capability.

---

# 34. NO CODE DOWNLOAD → EXECUTION

Search for:

```text
download
↓
write executable
↓
execute
```

or:

```text
download script
↓
PowerShell
```

or:

```text
remote JavaScript
↓
dynamic execution
```

If not required:

> REMOVE IT.

If required for legitimate updates:

> Implement signed, integrity-verified updates with strict source validation and no arbitrary execution.

---

# 35. ENVIRONMENT VARIABLES

For every child process:

Do NOT automatically pass the entire parent environment.

Determine whether it can receive:

* API keys
* tokens
* credentials
* secrets
* PATH manipulation
* malicious executable paths

Use the smallest required environment.

---

# 36. PATH ENVIRONMENT ATTACK

Ensure a child process cannot be tricked into executing a malicious executable because of a modified:

```text
PATH
```

Prefer absolute executable paths.

Do not rely on PATH resolution for security-sensitive processes.

---

# 37. APPLICATION DIRECTORY PROTECTION

Determine where the application itself is installed.

Verify whether the application can modify:

* its own executable
* server code
* scripts
* PowerShell files
* configuration
* dependencies

through user-controlled input.

A user-uploaded file must never be able to overwrite application code.

---

# 38. SELF-MODIFICATION PROTECTION

Check for:

```text
uploaded file
↓
application directory
↓
overwrite server script
↓
server restart
↓
malicious code execution
```

This must be impossible through application features.

---

# 39. STARTUP / PERSISTENCE AUDIT

Search again for:

* Registry Run keys
* startup folder
* scheduled task
* Windows service
* WMI persistence
* PowerShell profile modification
* shell profile modification
* browser extension installation
* hidden background process

If not required:

> REMOVE IT.

---

# 40. SECURITY TESTS MUST ATTEMPT TO ESCAPE EVERY BOUNDARY

Do not only test valid input.

For each security boundary, perform negative tests.

### Filesystem

Attempt:

```text
..
absolute path
UNC path
symlink
junction
sibling directory
parent directory
other drive
system directory
```

### PowerShell

Attempt:

```text
quotes
newline
semicolon
pipe
ampersand
backtick
$()
environment expansion
command substitution
```

### CMD

Attempt:

```text
&
&&
|
||
>
>>
<
^
%
```

### Localhost

Attempt:

```text
localhost
127.0.0.1
::1
private IP
different port
different endpoint
cross-origin
null origin
```

### Process

Attempt:

```text
different executable
different working directory
different arguments
different environment
nested process
```

Every unauthorized attempt must fail safely.

---

# 41. FAIL-CLOSED REQUIREMENT

If validation fails:

```text
DENY
```

Do not:

```text
guess
fallback
execute anyway
use default path
use default command
use another executable
use another directory
```

Security-sensitive operations must fail closed.

---

# 42. ERROR MESSAGES MUST NOT HELP AN ATTACKER

Do not return:

* full filesystem paths
* PowerShell source
* command lines
* executable paths
* environment variables
* internal stack traces
* internal server configuration

Return generic client errors.

Keep useful diagnostic information server-side only.

---

# 43. NO SECURITY BY UI

Do not rely on:

* hidden buttons
* disabled buttons
* frontend validation
* React state
* UI permissions
* hidden inputs

The security boundary must exist in the trusted backend/native layer.

---

# 44. SECURITY CAPABILITY MATRIX

Create a final matrix:

| Capability | Needed | Current Access | Minimum Required | Excess Access | Fix |
| ---------- | ------ | -------------- | ---------------- | ------------- | --- |
| CMD        | Yes/No | ...            | ...              | ...           | ... |
| PowerShell | Yes/No | ...            | ...              | ...           | ... |
| Process    | Yes/No | ...            | ...              | ...           | ... |
| Filesystem | Yes/No | ...            | ...              | ...           | ... |
| Temp files | Yes/No | ...            | ...              | ...           | ... |
| Localhost  | Yes/No | ...            | ...              | ...           | ... |
| LAN        | Yes/No | ...            | ...              | ...           | ... |
| Printer    | Yes/No | ...            | ...              | ...           | ... |
| Scanner    | Yes/No | ...            | ...              | ...           | ... |
| Registry   | Yes/No | ...            | ...              | ...           | ... |
| Startup    | Yes/No | ...            | ...              | ...           | ... |
| Services   | Yes/No | ...            | ...              | ...           | ... |

The final goal is:

> **Excess Access = ZERO**

where technically achievable.

---

# 45. CREATE A NEW HARDENING TODO LIST

Do not begin fixes until this new audit is complete.

Every issue must become:

```text
HARD-001
HARD-002
HARD-003
...
```

Each item must contain:

```text
ID:
SEVERITY:
CATEGORY:
CURRENT BEHAVIOR:
SECURITY RISK:
ATTACK VECTOR:
ROOT CAUSE:
EXACT FILE:
EXACT FUNCTION:
REQUIRED CHANGE:
SECURITY TEST:
REGRESSION TEST:
STATUS:
```

---

# 46. IMPLEMENT ONE HARDENING ITEM AT A TIME

For each:

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

Do not mark it complete merely because code was changed.

---

# 47. AFTER ALL FIXES — ATTACK THE APPLICATION AGAIN

Perform a fresh independent audit.

Pretend you are an attacker trying to:

```text
1. Reach localhost from another machine
2. Reach localhost from a malicious website
3. Call the API directly
4. Trigger scanner
5. Trigger printer
6. Upload malicious files
7. Inject PowerShell
8. Inject CMD
9. Execute another process
10. Escape the allowed directory
11. Read another file
12. Write another file
13. Delete another file
14. Access another drive
15. Access sibling directories
16. Follow symlinks
17. Follow junctions
18. Modify scripts
19. Execute uploaded scripts
20. create persistence
21. access another localhost service
22. access LAN devices
23. download code
24. execute downloaded code
25. bypass origin validation
26. bypass input validation
27. bypass rate limits
28. exploit error messages
29. exploit child processes
30. exploit document conversion
```

For each attack:

```text
BLOCKED
or
NOT BLOCKED
```

There must be evidence.

---

# 48. FINAL SECURITY REQUIREMENT

Do not report:

> "Terminal security PASS"

simply because the current legitimate commands are static.

Verify that an attacker cannot influence:

```text
COMMAND
ARGUMENT
SCRIPT
EXECUTABLE
WORKING DIRECTORY
ENVIRONMENT
INPUT FILE
OUTPUT FILE
```

Do not report:

> "Filesystem security PASS"

simply because the current paths are generated by the server.

Verify that an attacker cannot influence:

```text
PATH
FILENAME
DIRECTORY
SYMLINK
JUNCTION
FILE ID
TEMP FILE
```

Do not report:

> "Localhost security PASS"

simply because the server binds to 127.0.0.1.

Verify:

```text
LAN
browser
localhost
IPv4
IPv6
other local processes
origin
CSRF
endpoint authorization
```

---

# 49. FINAL ACCEPTANCE CRITERIA

The application can be considered **HARDENED** only if all applicable conditions are true:

```text
[ ] No unnecessary network exposure
[ ] No unnecessary localhost exposure
[ ] No arbitrary localhost endpoint access
[ ] No arbitrary command execution
[ ] No arbitrary PowerShell execution
[ ] No arbitrary CMD execution
[ ] No arbitrary child process execution
[ ] No command injection
[ ] No argument injection
[ ] No arbitrary executable selection
[ ] No arbitrary script selection
[ ] No arbitrary working directory
[ ] No dangerous environment inheritance
[ ] No arbitrary filesystem read
[ ] No arbitrary filesystem write
[ ] No arbitrary filesystem delete
[ ] No arbitrary filesystem rename
[ ] No arbitrary filesystem move
[ ] No path traversal
[ ] No sibling-directory escape
[ ] No parent-directory escape
[ ] No cross-drive access
[ ] No UNC escape
[ ] No symlink escape
[ ] No junction escape
[ ] No reparse-point escape
[ ] No application-code overwrite
[ ] No executable upload/execution chain
[ ] No malicious script persistence
[ ] No scheduled-task persistence
[ ] No service persistence
[ ] No registry persistence
[ ] No startup persistence
[ ] No hidden backdoor
[ ] No hidden remote command channel
[ ] No arbitrary remote code download
[ ] No malicious localhost access from websites
[ ] Printer capability restricted
[ ] Scanner capability restricted
[ ] Document conversion restricted
[ ] Temporary files restricted
[ ] Temporary files cannot become executable
[ ] Secrets not exposed
[ ] Errors do not expose internals
[ ] Security controls fail closed
[ ] Negative security tests pass
[ ] Regression tests pass
[ ] Build passes
[ ] Fresh security scan passes
```

---

# 50. FINAL REPORT

At the end provide:

## A. Hardened Security Status

```text
HARDENED
HARDENED WITH CONDITIONS
NOT HARDENED
```

## B. Remaining Risks

List every remaining risk.

Do not hide limitations.

## C. Hardening TODO

```text
TOTAL:
COMPLETED:
FAILED:
PARTIAL:
NOT VERIFIED:
```

## D. Attack Simulation Results

| Attack               | Expected | Actual | Status    |
| -------------------- | -------- | ------ | --------- |
| LAN access           | Blocked  | ...    | PASS/FAIL |
| Malicious website    | Blocked  | ...    | PASS/FAIL |
| PowerShell injection | Blocked  | ...    | PASS/FAIL |
| CMD injection        | Blocked  | ...    | PASS/FAIL |
| Path traversal       | Blocked  | ...    | PASS/FAIL |
| Other-drive access   | Blocked  | ...    | PASS/FAIL |
| Sibling directory    | Blocked  | ...    | PASS/FAIL |
| Symlink escape       | Blocked  | ...    | PASS/FAIL |
| Arbitrary process    | Blocked  | ...    | PASS/FAIL |
| Arbitrary localhost  | Blocked  | ...    | PASS/FAIL |
| Malicious upload     | Blocked  | ...    | PASS/FAIL |

## E. Exact Modified Files

List every changed file and why.

## F. Verification Evidence

For every security fix provide the actual test/result.

---

# FINAL COMMAND

**Do not start by changing code.**

First inspect the existing implementation and independently challenge the previous security report.

The previous report is evidence of work performed, **not proof that the application is secure**.

Your objective now is to harden the application so that:

> **A malicious website, remote attacker, malicious localhost caller, malicious input, malicious uploaded file, PowerShell injection, CMD injection, child-process injection, path traversal, symlink/junction escape, or unauthorized filesystem request cannot make [APPLICATION_NAME] access anything beyond the exact resource and operation required by the feature.**

The security boundary must be enforced in the trusted application layer, not merely in the UI.

If [APPLICATION_NAME] needs:

```text
one command
→ allow only that command

one executable
→ allow only that executable

one PowerShell script
→ allow only that script

one directory
→ allow only that directory

one file
→ allow only that file

one printer
→ allow only that printer

one scanner
→ allow only that scanner

one localhost endpoint
→ allow only that endpoint

one port
→ allow only that port
```

Everything else must be denied.

**Do not trust user-controlled paths, commands, filenames, URLs, IDs, headers, environment variables, uploaded files, or frontend state.**

**Do not use `-ExecutionPolicy Bypass` merely because it is convenient. Remove it if possible and otherwise prove why it is unavoidable and strictly constrained.**

**Do not treat `os.tmpdir()` as an unrestricted security boundary.**

**Do not treat `127.0.0.1` as authentication.**

**Do not treat Origin validation as authorization.**

**Do not treat a successful legitimate operation as proof that unauthorized operations are impossible.**

**Attack every boundary. Verify every boundary. Fail closed.**

Only declare the hardening complete after the complete TODO list has been implemented, every item individually verified, a fresh security rescan has been completed, and all applicable negative/attack tests pass.
