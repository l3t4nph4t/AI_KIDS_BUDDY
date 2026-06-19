# AI Kids Buddy — Auto-Run Framework

Install:
1. Extract this package.
2. Run:
   powershell -ExecutionPolicy Bypass -File .\install_autorun_framework.ps1 -Repo C:\AI_KIDS_BUDDY

Use:
- List waves:
  powershell -ExecutionPolicy Bypass -File .\scripts\ai_kids_auto_run.ps1 -Mode list

- Prepare a wave:
  powershell -ExecutionPolicy Bypass -File .\scripts\ai_kids_auto_run.ps1 -Mode prepare -Wave 001_vyvy_lan_ui -LaunchOpenCode

- After OpenCode/MIMO finishes, collect:
  powershell -ExecutionPolicy Bypass -File .\scripts\ai_kids_auto_run.ps1 -Mode collect -Wave 001_vyvy_lan_ui

Send reports\runs\<latest>\FINAL_HANDOFF.txt to ChatGPT.

Operating model:
- ChatGPT = orchestrator/strategy.
- User = runs local commands/tests.
- OpenCode = local runner.
- MIMO Token Plan = heavy executor for feature waves.
- Small bugs under 5 files should be fixed manual/local, not via MIMO.
