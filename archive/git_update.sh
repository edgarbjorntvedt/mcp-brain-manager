#!/bin/bash
cd /Users/bard/Code/mcp-brain-manager

# Git operations for mcp-brain-manager
git add -A
git commit -m "Add comprehensive help system to brain-manager

- Added brain_manager_help tool with documentation for all 14 commands
- Fixed TypeScript compilation errors (setState -> stateSet)
- Added missing 'custom' method to BrainToolInstructions
- Detailed help includes parameters, examples, and usage patterns
- Follows todo-manager help pattern for consistency"

# Try to push, will fail gracefully if no remote
git push origin main 2>/dev/null || echo "No remote configured yet"
