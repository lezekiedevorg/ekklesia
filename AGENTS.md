<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Architecture & Core Rules (Church Management)

1. **Centralized Calculation Engine (`src/lib/utils/programs.ts`)**:
   - All presence ratios, attendance percentages, and program summaries across UI pages (`activities`, `reports`, `members`) MUST use `computeProgramsSummary` from `src/lib/utils/programs.ts`. Never duplicate calculation logic or hardcode percentages inside UI components.
2. **Class & Program Definitions (`src/lib/constants/programs.ts`)**:
   - Program items, icons, labels, and mutually exclusive Quotidien (`Q`) / Intermittent (`I`) keys (`MUTUALLY_EXCLUSIVE_QI_KEYS`) are defined in `src/lib/constants/programs.ts`. Always respect mutual exclusivity when tracking spiritual disciplines.
3. **Database Types & Backward Compatibility (`src/types/db.ts`)**:
   - When updating interface definitions (`ShepherdActivity`, `WeeklyReport`), include index signatures (`[key: string]: any`) and legacy aliases (`summary_data`, etc.) so historical reports render cleanly without TypeScript errors during `npm run build`.
4. **Git Worktree & Windows Management**:
   - If worktrees (`git worktree`) or their parent directories are moved on disk, run `git worktree repair` inside the repositories immediately to fix `.git` pointers.

