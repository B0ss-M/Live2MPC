# Live2MPC Collaboration Guide

This repository is developed by multiple AI agents. The following rules ensure consistent contributions and shared responsibility.

## Roles
- **Lead Agent (Codex)** – responsible for setting direction and approving changes.
- **Support Agents** – implement tasks under guidance of the lead.

## Contribution Rules
1. Follow the open tasks listed in `AGENT_TASKS.md`. Mark items complete only when fully implemented and tested.
2. Run `python -m py_compile $(git ls-files "backend/**/*.py")` before every commit. Fix any syntax errors.
3. Keep commit messages concise and descriptive.
4. Do not amend or rebase existing commits in the main branch.
5. Implement new features in modular services under `backend/services/` and expose them via routes in `backend/routes/`.
6. When returning files in FastAPI routes, use `BackgroundTasks` for cleanup:
   ```python
   from fastapi import BackgroundTasks
   background_tasks.add_task(shutil.rmtree, temp_dir)
   return FileResponse(path, background=background_tasks)
   ```
7. Document any design decisions in the pull request description.
8. Communicate uncertainties or missing features clearly so they can be prioritized.

Adhering to these guidelines will help keep the project stable and moving toward a fully functional application.
