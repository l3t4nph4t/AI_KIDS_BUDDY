#!/bin/bash
set -e
cd "C:/AI_KIDS_BUDDY"

PDF_DIR="backend/data/lesson_pdfs/grade_5"

commit_and_push() {
  local label="$1"
  local staged
  staged=$(git diff --cached --name-only | wc -l)
  if [ "$staged" -eq 0 ]; then
    echo "SKIP $label — nothing staged"
    return
  fi
  echo "  commit: $label ($staged files)"
  git commit -m "feat: Grade 5 PDFs — ${label}"
  echo "  push:   $label"
  git push origin master
  echo "  OK ✓   $label"
}

push_range() {
  local pattern="$1"   # e.g. KNTT_G5_MATH_T1
  local chunk="$2"     # files per batch
  local total="$3"     # total lessons
  local batches=$(( (total + chunk - 1) / chunk ))

  echo ""
  echo "=== ${pattern} — ${total} files, chunk=${chunk}, batches=${batches} ==="

  for ((b=0; b<batches; b++)); do
    local from=$(( b * chunk + 1 ))
    local to=$(( (b + 1) * chunk ))
    [ $to -gt $total ] && to=$total

    printf -v from_pad "%03d" $from
    printf -v to_pad "%03d" $to

    for ((i=from; i<=to; i++)); do
      printf -v ipad "%03d" $i
      f="${PDF_DIR}/${pattern}_L${ipad}.pdf"
      [ -f "$f" ] && git add "$f"
    done

    commit_and_push "${pattern}_L${from_pad}-L${to_pad}"
  done
}

push_range "KNTT_G5_MATH_T1"      8  35
push_range "KNTT_G5_MATH_T2"      8  40
push_range "KNTT_G5_ENGLISH_T1"   8  33
push_range "KNTT_G5_ENGLISH_T2"   8  32
push_range "KNTT_G5_MUSIC"        8  39
push_range "KNTT_G5_HISTORY_GEO"  5  28

echo ""
echo "=== ALL DONE ==="
git log --oneline -16
