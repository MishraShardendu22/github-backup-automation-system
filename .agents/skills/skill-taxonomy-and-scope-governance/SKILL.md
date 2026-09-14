---
name: skill-taxonomy-and-scope-governance
scope: generic
description: >-
  Standard operating rules for skill scope taxonomy (generic vs codebase-{codebase-name}), directory boundary isolation, and preventing accidental cross-codebase skill contamination.
---

# Skill Taxonomy & Scope Governance Standard

This skill defines the mandatory classification, directory isolation, and validation protocols for authoring and maintaining AI agent skills across the ecosystem.

---

## 1. The Scope Taxonomy

Every skill in the ecosystem MUST belong to exactly one of two distinct categories:

| Scope | Directory Location | Target Audience | Frontmatter Requirement |
|---|---|---|---|
| **`generic`** | `.agents/skills/<skill-name>/` | Any repository across all languages and frameworks | `scope: generic` |
| **`codebase-{name}`** | `codebase-{name}/<skill-name>/` | Exclusively the specified codebase / project | `scope: codebase-{name}` |

```mermaid
flowchart TD
    Catalog[Skills Repository Root]
    Catalog --> Generic[".agents/skills/ (Universal Catalog)"]
    Catalog --> Codebase1["codebase-curiotech-careercafe/"]
    Catalog --> Codebase2["codebase-github-backup-automation-system/"]

    Generic --> G1["git-commit-workflow (scope: generic)"]
    Generic --> G2["docker-first-architecture (scope: generic)"]
    Generic --> G3["modern-toolchain-standard (scope: generic)"]

    Codebase1 --> C1["careercafe-visual-design-system (scope: codebase-curiotech-careercafe)"]
    Codebase2 --> C2["github-backup-architecture (scope: codebase-github-backup-automation-system)"]
```

---

## 2. Invariants for `scope: generic` Skills

Skills located under `.agents/skills/` are distributed to downstream projects via `skills-sync pull`. They must remain strictly universal:

1. **Frontmatter**: Must explicitly set `scope: generic`.
2. **Zero Hardcoded Paths**: Never reference local machine paths (e.g. `file:///home/...`, `/Users/...`). Use relative or conceptual directory paths (`backend/`, `src/`, `config/`).
3. **Zero Hardcoded Usernames**: Never hardcode GitHub usernames or email addresses. Use parameters like `<github-username>`, `<developer-or-agent>`, `@me`, or `@$(gh api user -q .login)`.
4. **Zero Project-Specific Leaks**: Never mention specific proprietary product names, specific microservice package names, or proprietary database schemas in normative rules. Examples must be generalized.
5. **No Domain-Specific UI Palettes**: Project-specific design tokens (e.g. brand-specific hex codes, product-specific color palettes) belong in `codebase-{name}/`, not in generic skills.

---

## 3. Invariants for `scope: codebase-{codebase-name}` Skills

Skills located under `codebase-{codebase-name}/` are tailored exclusively to a single application or product:

1. **Naming Convention**: The parent directory MUST follow `codebase-{codebase-name}/` (kebab-case).
2. **Frontmatter Matching**: The `scope` field in `SKILL.md` MUST exactly equal the container directory name (e.g. `scope: codebase-curiotech-careercafe`).
3. **Explicit Disclaimer**: The body of every codebase-specific `SKILL.md` MUST begin with an explicit alert block declaring its target repository:
   ```markdown
   > [!IMPORTANT]
   > **CODEBASE-SPECIFIC SCOPE**: This skill is strictly specific to **<Codebase Name>**.
   ```
4. **Concrete Runbooks**: May contain exact file paths, exact service names, specific database schemas, and project-specific CLI workflows.

---

## 4. Cross-Contamination Prevention Rule

> [!CAUTION]
> **STRICT PROHIBITION ON COPY-PASTING ACROSS BOUNDARIES**:
> - AI agents and human contributors MUST NEVER copy a codebase-specific skill into `.agents/skills/`.
> - Automated CI validators and pre-commit hooks will automatically reject any skill in `.agents/skills/` that lacks `scope: generic` or contains codebase-specific leaks.
> - Downstream synchronization engines (`skills-sync`) pull ONLY `generic` skills by default, preventing project-specific skills from leaking into unrelated repositories.

---

## 5. Authoring & Validation Runbook

When creating a new skill:

1. **Determine Scope**:
   - Is this skill applicable to any standard software repository? $\rightarrow$ Place in `.agents/skills/<name>/` with `scope: generic`.
   - Is this skill tightly coupled to a specific product, schema, or brand? $\rightarrow$ Place in `codebase-<name>/<name>/` with `scope: codebase-<name>`.

2. **Execute Validation**:
   ```bash
   # Run the unified validator across all scopes
   python3 scripts/validate-skills.py

   # Run the scope boundary unit test suite
   python3 -m unittest discover -s tests -p "test_*.py"
   ```
