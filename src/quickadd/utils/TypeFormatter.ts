// =====================================
// 📸 SNAPSHOT — UTILS LAYER (FINAL)
// =====================================

FILES:
- PreviewFormatter.ts
- TypeFormatter.ts

// =====================================
// 🧠 SYSTEM UNDERSTANDING
// =====================================

Role:
- pure formatting layer (UI / presentation support)
- no business logic
- no mutations

Responsibilities:
- PreviewFormatter → builds user-facing preview text
- TypeFormatter → formats enum-like types into readable labels

✔ strictly presentation layer
✔ clean separation from core logic


// =====================================
// 🔴 CRITICAL ISSUES
// =====================================

// 1. ❌ TRACE SYSTEM BROKEN (PreviewFormatter)
log.trace("event", { ... }) ❌

EXPECTED:
log.trace("event", traceId, { ... })

IMPACT:
- breaks TRACE_ID_SYSTEM
- formatter logs not attached to session trace


// 2. ❌ MISSING traceId IN API (PreviewFormatter)

formatPreview(entries)

EXPECTED:
formatPreview(entries, traceId)

IMPACT:
- no observability in formatting layer
- breaks end-to-end trace chain


// =====================================
// ⚠️ HIGH RISK ISSUES
// =====================================

// 3. ⚠️ STRING COUPLING (PreviewFormatter)

returns raw formatted string with emojis + layout

IMPACT:
- tightly coupled to Discord UI
- hard to reuse in other outputs (e.g. web, logs)


// =====================================
// 🟡 DESIGN LIMITATIONS
// =====================================

// 4. ⚠️ HARDCODED LOCALE

value.toLocaleString("en-US")

IMPACT:
- ignores user locale
- inconsistent formatting in international environments


// 5. ⚠️ TYPE LOOSENESS

status?: string

EXPECTED:
use EntryStatus type

IMPACT:
- weak typing
- possible mismatch with validation layer


// =====================================
// 🟢 WHAT IS GOOD
// =====================================

✔ pure functions (no side effects)
✔ deterministic output
✔ no mutation of input
✔ clear formatting separation
✔ TypeFormatter is minimal and correct


// =====================================
// 🔗 CROSS-LAYER RISKS
// =====================================

// VALIDATION → UTILS
Preview depends on:
- confidence
- suggestion
- status

→ contract drift risk


// DISCORD → UTILS
Formatter directly shapes Discord output

→ coupling UI with formatter


// GLOBAL LOGGER
same systemic issue:
→ missing traceId


// =====================================
// 🧾 FINAL VERDICT
// =====================================

🟢 ARCHITECTURE: GOOD
🔴 TRACE SYSTEM: BROKEN
🟠 COUPLING: MODERATE
🟡 TYPES: IMPROVABLE

STATUS:
→ ANALYZED (COMPLETE)