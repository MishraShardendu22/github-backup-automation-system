#!/usr/bin/env python3
"""
Unit Test Suite for Skill Scope Taxonomy & Codebase Isolation
Enforces that generic skills cannot leak codebase-specific patterns,
and codebase skills strictly maintain isolated scope flags and disclaimers.
"""

import unittest
import tempfile
from pathlib import Path
import sys

# Add scripts directory to sys.path to import validation functions
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from importlib import import_module
validate_module = import_module("validate-skills")
parse_frontmatter = getattr(validate_module, "parse_frontmatter")
validate_skill = getattr(validate_module, "validate_skill")
GENERIC_PROHIBITED_TERMS = getattr(validate_module, "GENERIC_PROHIBITED_TERMS")

class TestSkillsScopeTaxonomy(unittest.TestCase):
    def setUp(self):
        self.generic_dir = REPO_ROOT / ".agents" / "skills"
        self.codebase_dirs = [
            p for p in REPO_ROOT.iterdir()
            if p.is_dir() and not p.is_symlink() and p.name.startswith("codebase-")
        ]

    def test_generic_skills_all_have_generic_scope(self):
        """Verify that every skill in .agents/skills has scope: generic."""
        for skill_dir in self.generic_dir.iterdir():
            if skill_dir.is_dir() and not skill_dir.name.startswith("."):
                skill_md = skill_dir / "SKILL.md"
                self.assertTrue(skill_md.is_file(), f"Missing SKILL.md in {skill_dir.name}")
                fm, _ = parse_frontmatter(skill_md.read_text(encoding="utf-8"))
                self.assertEqual(
                    fm.get("scope"),
                    "generic",
                    f"Skill '{skill_dir.name}' must have 'scope: generic' in frontmatter",
                )

    def test_generic_skills_zero_codebase_leaks(self):
        """Verify that generic skills contain no prohibited codebase-specific leakage terms."""
        for skill_dir in self.generic_dir.iterdir():
            if skill_dir.is_dir() and not skill_dir.name.startswith("."):
                if skill_dir.name == "skill-taxonomy-and-scope-governance":
                    continue
                content = (skill_dir / "SKILL.md").read_text(encoding="utf-8").lower()
                for term in GENERIC_PROHIBITED_TERMS:
                    self.assertNotIn(
                        term.lower(),
                        content,
                        f"Generic skill '{skill_dir.name}' contains forbidden term: '{term}'",
                    )

    def test_codebase_skills_match_container_directory(self):
        """Verify that skills in codebase-* directories have scope matching the folder name."""
        self.assertGreater(len(self.codebase_dirs), 0, "Expected at least one codebase-* directory")
        for cb_dir in self.codebase_dirs:
            expected_scope = cb_dir.name
            skills = [p for p in cb_dir.iterdir() if p.is_dir() and (p / "SKILL.md").is_file()]
            self.assertGreater(len(skills), 0, f"Directory {cb_dir.name} contains no skills")
            for skill_dir in skills:
                fm, _ = parse_frontmatter((skill_dir / "SKILL.md").read_text(encoding="utf-8"))
                self.assertEqual(
                    fm.get("scope"),
                    expected_scope,
                    f"Skill '{skill_dir.name}' scope must be '{expected_scope}'",
                )

    def test_codebase_skills_contain_disclaimer(self):
        """Verify that every codebase-specific skill contains an explicit disclaimer in its body."""
        for cb_dir in self.codebase_dirs:
            skills = [p for p in cb_dir.iterdir() if p.is_dir() and (p / "SKILL.md").is_file()]
            for skill_dir in skills:
                content = (skill_dir / "SKILL.md").read_text(encoding="utf-8")
                has_disclaimer = (
                    "CODEBASE-SPECIFIC" in content or "PROJECT-SPECIFIC" in content
                )
                self.assertTrue(
                    has_disclaimer,
                    f"Codebase skill '{skill_dir.name}' must contain a CODEBASE-SPECIFIC or PROJECT-SPECIFIC alert block",
                )

    def test_cross_contamination_detected_by_validator(self):
        """Verify that validate_skill fails when a codebase-specific skill is tested against scope: generic."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            bad_skill = Path(tmp_dir) / "leaked-codebase-skill"
            bad_skill.mkdir()
            bad_md = bad_skill / "SKILL.md"
            bad_md.write_text(
                "---\n"
                "name: leaked-codebase-skill\n"
                "scope: codebase-foo\n"
                "description: A test skill that accidentally has codebase scope.\n"
                "---\n"
                "# Leaked Codebase Skill\n"
                "This skill should fail when expected_scope is generic.\n",
                encoding="utf-8",
            )
            errors = validate_skill(bad_skill, expected_scope="generic")
            self.assertTrue(any("does not match expected 'generic'" in err for err in errors))

    def test_prohibited_term_detected_in_generic_skill(self):
        """Verify that validate_skill fails when a generic skill contains a prohibited codebase term."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            leaky_skill = Path(tmp_dir) / "leaky-generic-skill"
            leaky_skill.mkdir()
            leaky_md = leaky_skill / "SKILL.md"
            leaky_md.write_text(
                "---\n"
                "name: leaky-generic-skill\n"
                "scope: generic\n"
                "description: A test skill that contains a forbidden codebase leak.\n"
                "---\n"
                "# Leaky Generic Skill\n"
                "This skill mentions github-backup which is forbidden.\n",
                encoding="utf-8",
            )
            errors = validate_skill(leaky_skill, expected_scope="generic")
            self.assertTrue(any("Forbidden codebase-specific term 'github-backup'" in err for err in errors))

    def test_missing_scope_detected(self):
        """Verify that validate_skill fails when a skill is missing the scope field."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            no_scope_skill = Path(tmp_dir) / "no-scope-skill"
            no_scope_skill.mkdir()
            no_scope_md = no_scope_skill / "SKILL.md"
            no_scope_md.write_text(
                "---\n"
                "name: no-scope-skill\n"
                "description: A test skill without a scope field.\n"
                "---\n"
                "# No Scope Skill\n"
                "Content here.\n",
                encoding="utf-8",
            )
            errors = validate_skill(no_scope_skill)
            self.assertTrue(any("Missing 'scope' field" in err for err in errors))

if __name__ == "__main__":
    unittest.main()
