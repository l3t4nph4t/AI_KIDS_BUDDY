# AI Kids Buddy — Claude Adapter

Read `AGENTS.md` first. It is the shared agent runbook for all agents covering:
infra endpoints, deploy flow, upload workflow, batch PDF push, and curriculum data structure.

## Claude Role

Claude acts as **independent reviewer** by default.

Do not implement, commit, push, or create PRs unless PM explicitly assigns a separate non-review role. If acting as implementer, Claude cannot also be the independent reviewer for the same PR.

## Quick References

- Local dev setup: `docs/RUNBOOK.md`
- Batch PDF push script: `scripts/push_grade5_pdfs.sh`
- Curriculum analysis: `scripts/build_unit_table.py`
