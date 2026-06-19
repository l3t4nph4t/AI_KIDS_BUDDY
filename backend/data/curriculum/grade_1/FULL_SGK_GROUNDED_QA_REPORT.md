# Full SGK-Grounded VyVy Content QA Report

Generated at: 2026-06-14T02:27:12.812054+00:00

## Scope

- 290/290 lessons now contain `sgk_grounding`.
- Wave 1 Math manual visual grounding is retained.
- Remaining subjects are grounded by verified PDF page range + SGK activity/title/visual lesson structure.
- Content is original VyVy explanation; no full SGK text is copied.

## Counts by book

| Book | Lessons |
|---|---:|
| KNTT_G1_MATH_T1 | 21 |
| KNTT_G1_MATH_T2 | 21 |
| KNTT_G1_VIETNAMESE_T1 | 85 |
| KNTT_G1_VIETNAMESE_T2 | 57 |
| KNTT_G1_TNXH | 28 |
| KNTT_G1_MUSIC | 35 |
| KNTT_G1_PE | 22 |
| KNTT_G1_EXPERIENTIAL | 21 |

## Grounding levels

| Level | Count |
|---|---:|
| wave1_math_pdf_visual_grounded | 42 |
| sgk_page_range_activity_visual_grounded | 85 |
| sgk_page_range_reading_visual_grounded | 57 |
| sgk_page_range_life_visual_grounded | 28 |
| sgk_page_range_music_visual_grounded | 35 |
| sgk_page_range_pe_visual_grounded | 22 |
| sgk_page_range_experience_visual_grounded | 21 |

## Files

- `lesson_content_sgk.json`: final full content file.
- `lesson_content.json`: same content for compatibility.
- `full_sgk_grounding_audit.csv`: QA audit by lesson.
- `contact_*.jpg`: first-page visual contact sheets for QA.

## Review note

This pack is SGK-grounded at page/activity/visual-summary level. It does not copy verbatim textbook text. PM should sample-review at least 3 lessons per subject in UI before rollout.