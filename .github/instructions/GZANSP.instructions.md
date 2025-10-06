---
applyTo: '**'
---
# GZANSP × AOC — Universal Agent Constraint Protocol
## Zero-Assumption, Method-First, Source-Backed Agent Operating Contract

---

## **Core Principle:**
**Every decision must cite an explicit source. Every operation must use exactly one method. Every constant must originate from a single source of truth. No exceptions.**

---

## **Agent Oath (Mandatory Preface)**
```
I MUST follow GZANSP × AOC verbatim in EVERY response.
I WILL NOT assume, invent, skip, or deviate from provided sources.
Any violation INVALIDATES my output and requires complete restart.
CONFIRMATION: "GZANSP Adhered: Sources listed, no inventions."
```

---

## **Critical Constraints**

### **1. Zero-Assumption Policy**
- **Source everything**: Every decision cites exact source fragment (request text, code line, spec section, dataset cell)
- **Process**: Identify source location → Quote minimal relevant fragment → Apply without alteration
- **Missing data**: HALT and request Information
- **Validation line**: `Assumption Check: Zero assumptions made — Sources: [list exact paths/lines/sections]`

### **2. Absolute Type Strictness**
- **FORBIDDEN**: `any` type in any form (annotations, assertions, generics, casts)
- **REQUIRED**: Explicit, concrete, narrowest possible types
- **Unknown data**: Use `unknown` with type guards, never `any`
- **Rule**: Any code containing `any` is automatically rejected and must be refactored

### **3. Single Source of Truth (SSOT)**
- **Constants**: Import from centralized location only, never duplicate
- **Change logging**: Record exact file path and diff when constants/configs change
- **No local copies**: Always reference the authoritative source
- **Validation**: Automated checks prevent constant duplication

### **4. Method-First Architecture**
- **Adapter selection**: Single flag selects one method per operation (`IO_METHOD = {socket|http|serial|mq}`)
- **Zero legacy**: No legacy names, values, or patterns—methods only
- **No defaults**: Never hardcode fallbacks—use placeholders, throw on persistence
- **Resolver-driven**: All targets (host, port, URL, device) come from resolver, not hardcoded lists

### **5. Endpoint Standardization**
- **REQUIRED**: `/api/[module]/[resource]` format only
- **FORBIDDEN**: Versioned paths (`/api/v1/...`, `/api/v2/...`)
- **Validation**: Automated blocking of version patterns in commits/PRs

---

## **Forbidden Terminology**
**BANNED TERMS** (in names, comments, docs, UI, commits):
```
Comprehensive, Enhanced, Advanced, Corrected, Fixed, Implemented,
Future, Final, Improved, Upgraded, Perfected, Complete, Newer,
Refined, Optimized, Best, Ideal, Flawless, Optimal, Executive,
New, Old, Updated, Modified, Migrated
```

---

## **Execution Protocol**

### **Mandatory Scope Declaration**
```
Scope:
- Files: [list every file]
- Endpoints: [list every endpoint]
- Sections: [list every section/screen]
- Datasets: [list every dataset/sheet]
- Assets: [list every asset]

Status per item: Reviewed—No Issues | Reviewed—Issues: [details] | Reviewed—Irrelevant
Coverage requirement: 100% of items must be accounted for
```

### **Content Modes (Select Exactly One)**
- **Factual**: No fabrication; external facts require sources
- **Procedural**: Steps/scripts from sources only
- **Transformation**: Transform provided input with minimal additions
- **Creative** (opt-in only): Must be explicitly requested and labeled

### **Deterministic Workflow**
1. **Oath** and **Scope Declaration**
2. **Source Inventory**: Enumerate all usable sources
3. **Mode Selection** and labeling
4. **Item-by-Item Review** with source citations
5. **Constants Application** from SSOT only
6. **Endpoint Audit**: Verify format compliance
7. **Terminology Sweep**: Check for banned terms
8. **File Replacement**: In-place updates (no suffixes/prefixes)
9. **Assumption Check** and **Coverage Table**
10. **Artifact Delivery** per exact request

---

## **Configuration Patterns**

### **Placeholder-Only Config**
```bash
# Adapter Selection
IO_METHOD={socket|http|serial|mq}

# Universal Knobs
TIMEOUT_MS={ms}
RETRY_ATTEMPTS={count}
RETRY_INTERVAL_MS={ms}

# Socket Specific
TARGET_HOST={host}
TARGET_PORT={port}

# HTTP Specific
BASE_URL={url}
AUTH_TOKEN={token}
REQUEST_PATH={path}

# Serial Specific
DEVICE_PATH={device}
BAUD_RATE={baud}

# Message Queue Specific
BROKER_URL={url}
TOPIC_NAME={topic}
```

### **Validation Contract**
```typescript
// Generic validation interface
interface ConfigValidator {
  validatePlaceholders(): ValidationResult;
  validateTypes(): ValidationResult;
  validateAdapterRequirements(method: IOMethod): ValidationResult;
  throwOnFailure(): void;
}
```

---

## **Resolver & Adapter Contracts**

### **Resolver Interface**
```typescript
interface EndpointResolver {
  resolveEndpoint(subjectId: string): Promise<{
    target: string;
    params: Record<string, unknown>;
  }>;
}
```

### **Adapter Interface**
```typescript
interface MethodAdapter {
  connect(target: string, params: Record<string, unknown>): Promise<Connection>;
  execute(connection: Connection): Promise<RawData>;
  parse(data: RawData): Promise<ParsedResult>;
  validate(result: ParsedResult): Promise<ValidatedResult>;
}
```

---

## **Guardrails & Enforcement**

### **Pre-commit Hook Template**
```bash
#!/usr/bin/env bash
set -euo pipefail

# Block versioned endpoints
if git diff --cached -U0 | grep -E "/api/.*/v[0-9]+/" -q; then
  echo "GZANSP: Versioned API path detected" >&2
  exit 1
fi

# Block hardcoded defaults
if git diff --cached -U0 | grep -E "(getenv|process\.env).*\?\?|\|\|.*['\"]" -q; then
  echo "GZANSP: Hardcoded fallback detected" >&2
  exit 1
fi

# Check banned lexicon
LEXICON=".guard/banned_lexicon.txt"
if [ -f "$LEXICON" ]; then
  PATTERN=$(tr '\n' '|' < "$LEXICON" | sed 's/|$//')
  if git diff --cached -U0 | grep -Eio "($PATTERN)" -q; then
    echo "GZANSP: Banned terminology detected" >&2
    exit 1
  fi
fi

# Block 'any' type usage
if git diff --cached -U0 | grep -E ":\s*any\s*[,;]|<any>|\(any\)" -q; then
  echo "GZANSP: 'any' type usage forbidden" >&2
  exit 1
fi
```

### **CI Validation Jobs**
```yaml
validation:
  runs-on: ubuntu-latest
  steps:
    - name: GZANSP Endpoint Check
      run: |
        if grep -r "/api/.*/v[0-9]/" src/; then
          echo "Versioned endpoints detected"
          exit 1
        fi

    - name: GZANSP Type Check
      run: |
        if grep -r ": any\|<any>\|(any)" src/; then
          echo "'any' type usage detected"
          exit 1
        fi

    - name: GZANSP Constants Check
      run: |
        if find . -name "*.ts" -exec grep -l "const.*=" {} \; | xargs -I {} sh -c 'test $(grep -c "const.*=" "{}") -gt 1' 2>/dev/null; then
          echo "Duplicate constants detected"
          exit 1
        fi
```

---

## **Reporting Template**

```markdown
## GZANSP × AOC Compliance Report

**Oath Confirmation**: GZANSP Adhered: Sources listed, no inventions.

**Mode**: [Factual|Procedural|Transformation|Creative]

**Sources**:
- [source1]: "[quoted fragment]"
- [source2]: "[quoted fragment]"

**Scope Coverage**:
| Item | Type | Status | Issues |
|------|------|--------|--------|
| [item] | [File/Endpoint/Asset] | [Reviewed/Issues/Irrelevant] | [details] |

**Validations**:
- ✅ Endpoint Format: `/api/[module]/[resource]` only
- ✅ Constants: Imported from SSOT at [path]
- ✅ Terminology: No banned terms detected
- ✅ Types: No 'any' usage detected
- ✅ File Handling: In-place replacement completed

**Assumption Check**: Zero assumptions made — Sources: [list]

**Coverage**: [X/X items] (100% required)
```

---

## **Quick Compliance Checklist**

- [ ] Oath printed
- [ ] Scope declared (immutable)
- [ ] Mode selected and labeled
- [ ] All sources enumerated with quotes
- [ ] Constants imported from SSOT only
- [ ] Endpoints follow `/api/[module]/[resource]`
- [ ] No banned terminology used
- [ ] No 'any' types present
- [ ] Files replaced in-place
- [ ] 100% coverage achieved
- [ ] Assumption check completed
- [ ] Compliance report generated

---

**Outcome**: Universal protocol that prevents assumption-based development, eliminates legacy drift, enforces architectural consistency, and guarantees auditable, source-backed deliverables across all technology stacks.

**When You Made A Mistake**

> **"Do Not Apologize, And Don’T Try To Confirm That I’M Right—I Already Know I Am. Fix IT."**
