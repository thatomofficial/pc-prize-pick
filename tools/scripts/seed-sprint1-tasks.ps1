#requires -version 5.1
<#
.SYNOPSIS
  Add task-list checkboxes to each Sprint 1 issue's body.

.DESCRIPTION
  Pulls the existing body for each Sprint 1 story by title, splices in a
  '## Tasks' section before the BACKLOG footer separator, and pushes the
  edit via 'gh issue edit'. Idempotent: re-running detects an existing
  '## Tasks' section and replaces it rather than stacking duplicates.

  Run from repo root:
    pwsh -File tools/scripts/seed-sprint1-tasks.ps1
#>
$ErrorActionPreference = 'Stop'

$Repo = (gh repo view --json nameWithOwner -q .nameWithOwner)
Write-Host "Target repo: $Repo`n" -ForegroundColor Cyan

# Each entry: issue title (must match exactly) → tasks (markdown checklist items).
# Order matters — list tasks in the order a dev should execute them.
$plan = [ordered]@{
    'F1.1 — Define ApiClientService wrapper' = @(
        'Create `src/app/_shared/services/api-client.service.ts` skeleton'
        'Implement typed `get<T>(path, params?)` helper'
        'Implement `post<T>`, `put<T>`, `delete<T>` helpers'
        'Inject `environment.apiEndpoint` as base URL'
        'Add `x-request-id` correlation header per request'
        'Vitest spec: URL composition + header injection'
        'Vitest spec: error response shape mapping'
    )

    'F1.2 — authInterceptor for bearer tokens' = @(
        'Create `src/app/_shared/interceptors/auth.interceptor.ts`'
        'Attach `Authorization: Bearer <jwt>` from `AuthService`'
        'Allowlist `/api/auth/*` endpoints (no token attached)'
        'On 401, attempt a single silent refresh + retry'
        'On the second consecutive 401, call `AuthService.signOut()` and route to `/login`'
        'Register the interceptor in `app.config.ts` via `provideHttpClient(withInterceptors([authInterceptor]))`'
        'Vitest spec: happy path attaches header'
        'Vitest spec: 401 → refresh → retry succeeds'
        'Vitest spec: double 401 signs the user out'
    )

    'F1.3 — Global API error mapping' = @(
        'Define `ApiError` type in `src/app/_shared/models/api-error.model.ts`'
        'Map backend `{ code, message, fields }` payload to `ApiError`'
        'Surface 5xx + network errors via `ToastService` (depends on F3.1)'
        'Forward unmapped errors to Sentry (depends on F7.2 — leave TODO until that lands)'
        'Vitest spec: known codes map cleanly, unknown codes fall through to generic'
    )

    'F2.1 — AuthService with signal-backed currentUser state' = @(
        'Replace `AuthService.signIn()` mock body with `POST /api/auth/sign-in`'
        'Replace `signUp()` with `POST /api/auth/sign-up`'
        'Replace `requestPasswordReset()` with `POST /api/auth/password-reset` (always 200)'
        'Namespace token storage under `pcp.auth.token` in `localStorage`'
        'Add boot-time `verifyToken()` call → clear if invalid'
        'Confirm public surface (`currentUser`, `isAuthed`, `initials`, `signOut`) is identical to the mock'
        'Vitest specs for each flow against `HttpTestingController`'
    )

    'F2.2 — authGuard and guestGuard' = @(
        'Verify `authGuard` still gates `/account` after F2.1 lands'
        'Verify `guestGuard` still bounces from `/login`, `/register`, `/forgot-password`'
        'Add `returnUrl` round-trip test (gated → login → submit → original URL)'
        'Document guard behaviour in `CLAUDE.md`'
    )

    'F3.1 — ToastService + <app-toast-host>' = @(
        'Create `src/app/_shared/services/toast.service.ts` with a signal-backed queue'
        'Implement `success(message, options?)`, `error()`, `info()`'
        'Auto-dismiss timer (default 5 s, configurable per toast)'
        'Cap queue at 4 — drop oldest on overflow'
        'Create `src/app/_shared/components/toast-host/toast-host.component.{ts,html,scss}`'
        'Mount `<app-toast-host>` in the `App` shell'
        'Honor `prefers-reduced-motion` (no slide / scale animations)'
        'Vitest spec: success → queue → dismiss timing + cap behaviour'
    )

    'F3.2 — LoadingState pattern' = @(
        'Export `LoadingState<T>` discriminated union in `_shared/models/loading-state.model.ts`'
        'Helpers: `idle()`, `loading()`, `ready(data)`, `error(err)`'
        'Create `LoadingStateComponent` with `<ng-content select>` slots: skeleton, error, content'
        'Adopt in one real consumer (e.g. account dashboard entry list)'
        'Vitest spec covering the four states'
    )

    'F4.1 — Reactive form helpers' = @(
        'Create `src/app/_shared/components/form-field/form-field.component.{ts,html,scss}`'
        'Create `src/app/_shared/components/form-error/form-error.component.{ts,html,scss}`'
        'Define `ValidationCopy` map (`required`, `email`, `minlength`, custom keys)'
        'Refactor `SignInScreenComponent` form to use them'
        'Refactor `RegisterScreenComponent` form to use them'
        'Refactor `ForgotPasswordScreenComponent` form to use them'
        'Document the convention in `DESIGN.md` (or a new `FORMS.md` if it outgrows a section)'
    )

    'F5.1 — Routes restructure' = @(
        'Create `src/app/home/home.routes.ts` exporting `homeRoutes`'
        'Create `src/app/auth/auth.routes.ts` (login, register, forgot-password with guards)'
        'Create `src/app/competitions/competitions.routes.ts`'
        'Create `src/app/account/account.routes.ts` (auth-guarded)'
        'Create `src/app/support/support.routes.ts` (placeholder for /faq, /contact)'
        'Create `src/app/legal/legal.routes.ts` (placeholder for /legal/*)'
        'Update `app.routes.ts` to import and spread these as flat children'
        'Verify every existing route still resolves (build + manual smoke)'
    )
}

# Fetch all open Sprint 1 issues with number + title + body, so we can map
# titles → numbers and pull current bodies in one round-trip.
$rawIssues = gh issue list --milestone 'Sprint 1 — Foundations' --state open --limit 50 --json number,title,body
$issues = $rawIssues | ConvertFrom-Json

$utf8NoBom = [Text.UTF8Encoding]::new($false)
$tasksHeader = '## Tasks'
$footerSep   = "`n---`nSourced from"

$updated = 0
$missing = 0

foreach ($title in $plan.Keys) {
    $issue = $issues | Where-Object { $_.title -eq $title } | Select-Object -First 1
    if (-not $issue) {
        Write-Host "  ! missing issue: $title" -ForegroundColor Red
        $missing++
        continue
    }

    $body = $issue.body

    # If the body already has a '## Tasks' block, strip it (and anything after
    # it up to the footer separator) so we can replace cleanly.
    $tasksIdx  = $body.IndexOf($tasksHeader)
    $footerIdx = $body.IndexOf($footerSep)

    if ($tasksIdx -ge 0) {
        $prefix = $body.Substring(0, $tasksIdx).TrimEnd()
        if ($footerIdx -gt $tasksIdx) {
            $suffix = $body.Substring($footerIdx)
        }
        else {
            $suffix = ''
        }
        $body = $prefix + "`n`n" + $suffix
    }

    # Build the new '## Tasks' block.
    $taskLines = ($plan[$title] | ForEach-Object { "- [ ] $_" }) -join "`n"
    $tasksBlock = "$tasksHeader`n$taskLines"

    # Splice the block in just before the BACKLOG footer separator (if any),
    # otherwise append to the end.
    $footerIdx = $body.IndexOf($footerSep)
    if ($footerIdx -ge 0) {
        $prefix = $body.Substring(0, $footerIdx).TrimEnd()
        $suffix = $body.Substring($footerIdx)
        $newBody = "$prefix`n`n$tasksBlock`n$suffix"
    }
    else {
        $newBody = "$($body.TrimEnd())`n`n$tasksBlock"
    }

    # Push the edit using --body-file so quoting / backticks / pipes stay intact.
    $tempBody = [IO.Path]::GetTempFileName()
    try {
        [IO.File]::WriteAllText($tempBody, $newBody, $utf8NoBom)
        & gh issue edit $issue.number --body-file $tempBody | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  x failed to edit #$($issue.number): $title" -ForegroundColor Red
            continue
        }
        $taskCount = $plan[$title].Count
        Write-Host "  + #$($issue.number) — $title ($taskCount tasks)"
        $updated++
    }
    finally {
        if (Test-Path $tempBody) { Remove-Item $tempBody -Force -ErrorAction SilentlyContinue }
    }
}

Write-Host "`nDone. Updated: $updated · Missing: $missing" -ForegroundColor Green
