#!/usr/bin/env python3
"""
Skill Validator Script for agent-skills
Validates YAML frontmatter, naming conventions, scope taxonomy (generic vs codebase-{name}),
and structural integrity for all SKILL.md files across the repository.
"""

import sys
import re
from pathlib import Path

# Prohibited codebase leakage terms that must NEVER appear in generic skills
GENERIC_PROHIBITED_TERMS = [
    "github-backup",
    "curiotech",
    "careercafe",
    "/home/ms22",
    "shardendumishra",
]

def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse YAML frontmatter delimited by ---."""
    if not content.startswith("---"):
        return {}, content
    
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content
    
    raw_frontmatter = parts[1]
    body = parts[2]
    
    data = {}
    lines = raw_frontmatter.strip().split("\n")
    current_key = None
    multiline_val = []
    
    for line in lines:
        if ":" in line and not line.startswith(" ") and not line.startswith("\t"):
            if current_key and multiline_val:
                data[current_key] = " ".join(multiline_val).strip()
                multiline_val = []
            
            key, val = line.split(":", 1)
            current_key = key.strip()
            val = val.strip()
            if val in (">", ">-", "|", "|-"):
                multiline_val = []
            elif val:
                data[current_key] = val.strip("\"'")
                current_key = None
        elif current_key:
            multiline_val.append(line.strip().strip("\"'"))
    
    if current_key and multiline_val:
        data[current_key] = " ".join(multiline_val).strip()
        
    return data, body

def validate_skill(skill_path: Path, expected_scope: str = None) -> list[str]:
    """Validate an individual skill directory or skill markdown file with scope enforcement."""
    errors = []
    if skill_path.is_file():
        skill_md = skill_path
        skill_name = skill_path.stem
        expected_dir_name = skill_path.parent.name if skill_name == "SKILL" else skill_name
    else:
        skill_md = skill_path / "SKILL.md"
        skill_name = skill_path.name
        expected_dir_name = skill_path.name
    
    if not skill_md.is_file():
        return [f"Missing SKILL.md in {skill_name}"]
    
    content = skill_md.read_text(encoding="utf-8")
    frontmatter, body = parse_frontmatter(content)
    
    if not frontmatter:
        errors.append(f"{skill_name}: Missing or malformed YAML frontmatter ('---')")
        return errors
    
    name = frontmatter.get("name")
    if not name:
        errors.append(f"{skill_name}: Missing 'name' field in frontmatter")
    elif name != expected_dir_name:
        errors.append(f"{skill_name}: Name '{name}' does not match expected '{expected_dir_name}'")
        
    description = frontmatter.get("description")
    if not description:
        errors.append(f"{skill_name}: Missing 'description' field in frontmatter")
    elif len(description.strip()) < 15:
        errors.append(f"{skill_name}: Description is too short (< 15 characters)")
        
    if not body.strip():
        errors.append(f"{skill_name}: Body content is empty")
        
    if not re.search(r"^#\s+.+", body, re.MULTILINE):
        errors.append(f"{skill_name}: Missing top-level Markdown heading (# Title)")

    # Scope field validation
    scope = frontmatter.get("scope")
    if not scope:
        errors.append(f"{skill_name}: Missing 'scope' field (must be 'generic' or 'codebase-<name>')")
    else:
        if expected_scope:
            if scope != expected_scope:
                errors.append(f"{skill_name}: Scope '{scope}' does not match expected '{expected_scope}'")
        elif not (scope == "generic" or scope.startswith("codebase-")):
            errors.append(f"{skill_name}: Invalid scope '{scope}'. Must be 'generic' or start with 'codebase-'")

    # Generic scope isolation check: zero codebase leakage terms allowed
    if scope == "generic":
        for term in GENERIC_PROHIBITED_TERMS:
            # Check body and description case-insensitively, except if in governance definition
            if skill_name != "skill-taxonomy-and-scope-governance":
                if term.lower() in content.lower():
                    errors.append(f"{skill_name}: Forbidden codebase-specific term '{term}' found in generic skill")
    elif scope and scope.startswith("codebase-"):
        # Codebase skills must have an explicit scope disclaimer in markdown body
        if not re.search(r"CODEBASE-SPECIFIC|PROJECT-SPECIFIC", body, re.IGNORECASE):
            errors.append(f"{skill_name}: Codebase skill must include an explicit '[!IMPORTANT]' disclaimer declaring its codebase scope")
        
    return errors

def main():
    repo_root = Path(__file__).resolve().parent.parent
    skills_dirs = [
        repo_root / ".agents" / "skills",
        repo_root / "skills",
    ]
    
    target_dir = None
    for d in skills_dirs:
        if d.is_dir() and not d.is_symlink():
            target_dir = d
            break
            
    if not target_dir:
        print("[ERROR] Could not locate skills directory (.agents/skills)")
        sys.exit(1)
        
    all_errors = []
    
    # 1. Discover all skills in .agents/skills
    skill_folders = [p for p in target_dir.iterdir() if p.is_dir() and not p.name.startswith(".")]
    if not skill_folders:
        print("[ERROR] No skills found in", target_dir)
        sys.exit(1)

    generic_skills = []
    codebase_skills = []

    for p in sorted(skill_folders):
        md_files = [f for f in p.glob("*.md") if not f.name.startswith("README")]
        skill_md_files = []
        for f in md_files:
            try:
                fm, _ = parse_frontmatter(f.read_text(encoding="utf-8"))
                if fm.get("name"):
                    skill_md_files.append((f, fm))
            except Exception:
                continue

        if len(skill_md_files) > 1:
            for f, fm in sorted(skill_md_files, key=lambda x: x[0].name):
                if fm.get("scope", "generic") == "generic":
                    generic_skills.append(f)
                else:
                    codebase_skills.append((f, fm.get("scope")))
        elif skill_md_files:
            f, fm = skill_md_files[0]
            if fm.get("scope", "generic") == "generic":
                generic_skills.append(p)
            else:
                codebase_skills.append((p, fm.get("scope")))
        else:
            generic_skills.append(p)

    # Validate Generic Skills
    print(f"[INFO] Validating {len(generic_skills)} generic skills in {target_dir.relative_to(repo_root)} (scope: generic)...\n")
    generic_valid = 0
    for skill_path in generic_skills:
        errors = validate_skill(skill_path, expected_scope="generic")
        if errors:
            all_errors.extend(errors)
            print(f"  [FAIL] {skill_path.name}: {len(errors)} error(s)")
            for err in errors:
                print(f"         - {err}")
        else:
            generic_valid += 1
            print(f"  [PASS] {skill_path.name}")

    print(f"\nGeneric Skills Summary: {generic_valid}/{len(generic_skills)} valid.\n")

    # Validate Codebase Skills inside .agents/skills
    codebase_valid = 0
    if codebase_skills:
        print(f"[INFO] Validating {len(codebase_skills)} codebase-specific skills in {target_dir.relative_to(repo_root)}...")
        for skill_path, scope in codebase_skills:
            errors = validate_skill(skill_path, expected_scope=scope)
            if errors:
                all_errors.extend(errors)
                print(f"  [FAIL] {skill_path.name} (scope: {scope}): {len(errors)} error(s)")
                for err in errors:
                    print(f"         - {err}")
            else:
                codebase_valid += 1
                print(f"  [PASS] {skill_path.name} (scope: {scope})")
        print(f"\nCodebase Skills Summary: {codebase_valid}/{len(codebase_skills)} valid.\n")

    # Optional: Backwards compatibility check for any legacy root-level codebase-* directories
    legacy_codebase_dirs = [p for p in repo_root.iterdir() if p.is_dir() and not p.is_symlink() and p.name.startswith("codebase-")]
    legacy_total = 0
    legacy_valid = 0
    if legacy_codebase_dirs:
        print(f"[INFO] Discovered {len(legacy_codebase_dirs)} legacy root codebase directory suite(s)...")
        for cb_dir in sorted(legacy_codebase_dirs):
            cb_name = cb_dir.name
            skills = [p for p in cb_dir.iterdir() if p.is_dir() and (p / "SKILL.md").is_file()]
            for skill_path in sorted(skills):
                legacy_total += 1
                errors = validate_skill(skill_path, expected_scope=cb_name)
                if errors:
                    all_errors.extend(errors)
                else:
                    legacy_valid += 1

    total_validated = len(generic_skills) + len(codebase_skills) + legacy_total
    total_valid = generic_valid + codebase_valid + legacy_valid
    print(f"Total Validation Summary: {total_valid}/{total_validated} skills valid across all scopes.")
    
    if all_errors:
        print(f"\n[ERROR] Validation failed with {len(all_errors)} error(s).")
        sys.exit(1)
    else:
        print("\n[SUCCESS] All skills passed validation across all scopes.")
        sys.exit(0)

if __name__ == "__main__":
    main()
