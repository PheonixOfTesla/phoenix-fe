#!/usr/bin/env python3
"""
Fix phase numbering - we have duplicate Phase 4s and old Phase 7 needs removal
Current structure should be:
Phase 0: Init
Phase 1: Language
Phase 2: Voice (iOS)
Phase 3persona: Personality (NEW)
Phase 4: Auth (first one - KEEP)
Phase 4: Verification (second one - change to Phase 5)
Phase 4b: Phone verify - change to Phase 5b
Phase 5: Sync - change to Phase 6
Phase 6: Goals - change to Phase 7
Phase 7: OLD voice/personality - REMOVE
Phase 8: Launch - change to Phase 8
"""

import re

print("🔧 Fixing phase numbering...\n")

with open('onboarding.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Track phase indices
phase_sections = []
for i, line in enumerate(lines):
    if 'id="phase' in line and '<div class="phase"' in line:
        phase_sections.append((i, line))

print(f"Found {len(phase_sections)} phase divs:\n")
for idx, (line_num, line) in enumerate(phase_sections):
    phase_id = re.search(r'id="(phase\w+)"', line)
    if phase_id:
        print(f"  Line {line_num}: {phase_id.group(1)}")

print("\n📝 Making corrections...\n")

content = ''.join(lines)

# Step 1: Fix duplicate Phase 4 (verification) -> Phase 5
print("1. Renaming second Phase 4 (Verification) to Phase 5...")
# Find the second occurrence of Phase 4
second_phase4_start = content.find('<!-- Phase 4: Verification Choice -->')
if second_phase4_start > -1:
    # Replace this section's phase4 with phase5
    before = content[:second_phase4_start]
    after = content[second_phase4_start:]

    # Find the closing tag of this phase
    next_phase_start = after.find('<!-- Phase', 100)  # Look for next phase comment
    phase_section = after[:next_phase_start]
    rest = after[next_phase_start:]

    # Replace phase4 with phase5 in this section
    phase_section = phase_section.replace('<!-- Phase 4: Verification Choice -->', '<!-- Phase 5: Verification Choice -->')
    phase_section = phase_section.replace('id="phase4"', 'id="phase5"')
    phase_section = phase_section.replace('id="avatarCircle4"', 'id="avatarCircle5"')
    phase_section = phase_section.replace('id="voiceStatus4"', 'id="voiceStatus5"')

    content = before + phase_section + rest
    print("   ✅ Phase 5 (Verification) updated\n")

# Step 2: Fix Phase 4b (Phone verify) -> Phase 5b
print("2. Renaming Phase 4b (Phone verify) to Phase 5b...")
content = content.replace('id="phase4b"', 'id="phase5b"')
print("   ✅ Phase 5b updated\n")

# Step 3: Fix old Phase 5 (Sync) -> Phase 6
print("3. Renaming old Phase 5 (Sync) to Phase 6...")
old_phase5_start = content.find('<!-- Phase 5: Device Connections -->')
if old_phase5_start > -1:
    before = content[:old_phase5_start]
    after = content[old_phase5_start:]

    next_phase = after.find('<!-- Phase 6')
    section = after[:next_phase]
    rest = after[next_phase:]

    section = section.replace('<!-- Phase 5: Device Connections -->', '<!-- Phase 6: Device Connections -->')
    section = section.replace('id="phase5"', 'id="phase6"')
    section = section.replace('id="avatarCircle5"', 'id="avatarCircle6"')
    section = section.replace('id="voiceStatus5"', 'id="voiceStatus6"')

    content = before + section + rest
    print("   ✅ Phase 6 (Sync) updated\n")

# Step 4: Fix old Phase 6 (Goals) -> Phase 7
print("4. Renaming old Phase 6 (Goals) to Phase 7...")
old_phase6_start = content.find('<!-- Phase 6: Goals Setup (Open Text) -->')
if old_phase6_start > -1:
    before = content[:old_phase6_start]
    after = content[old_phase6_start:]

    next_phase = after.find('<!-- Phase 7')
    section = after[:next_phase]
    rest = after[next_phase:]

    section = section.replace('<!-- Phase 6: Goals Setup (Open Text) -->', '<!-- Phase 7: Goals Setup (Open Text) -->')
    section = section.replace('id="phase6"', 'id="phase7"')
    section = section.replace('id="avatarCircle6"', 'id="avatarCircle7"')
    section = section.replace('id="voiceStatus6"', 'id="voiceStatus7"')

    content = before + section + rest
    print("   ✅ Phase 7 (Goals) updated\n")

# Step 5: REMOVE old Phase 7 (duplicate voice/personality)
print("5. Removing old Phase 7 (duplicate voice/personality)...")
old_phase7_start = content.find('<!-- Phase 7: Voice & Personality Selection -->')
if old_phase7_start > -1:
    before = content[:old_phase7_start]
    after = content[old_phase7_start:]

    # Find end of this phase (next phase comment)
    next_phase = after.find('<!-- Phase 8')
    removed_section = after[:next_phase]
    rest = after[next_phase:]

    print(f"   Removing {len(removed_section)} characters...")
    content = before + rest
    print("   ✅ Old Phase 7 removed\n")

# Step 6: Keep Phase 8 as is
print("6. Phase 8 (Launch) - no changes needed\n")

# Write updated content
with open('onboarding.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("═══════════════════════════════════════")
print("✅ PHASE NUMBERING FIXED!")
print("═══════════════════════════════════════\n")
print("Final structure:")
print("  Phase 0: Init")
print("  Phase 1: Language")
print("  Phase 2: Voice (iOS)")
print("  Phase 3persona: Personality")
print("  Phase 4: Auth")
print("  Phase 5: Verification")
print("  Phase 5b: Phone Verification")
print("  Phase 6: Sync")
print("  Phase 7: Goals (Open Text)")
print("  Phase 8: Launch\n")
