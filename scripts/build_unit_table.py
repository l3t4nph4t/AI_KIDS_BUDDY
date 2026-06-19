import json, sys, os, subprocess
sys.stdout.reconfigure(encoding='utf-8')
from collections import defaultdict

base = 'C:/AI_KIDS_BUDDY/backend/data/curriculum'
pdf_base = 'C:/AI_KIDS_BUDDY/backend/data/lesson_pdfs'
grades = [1, 2, 3, 4, 5]

# Get repo PDFs
result = subprocess.run(
    ['git', '-C', 'C:/AI_KIDS_BUDDY', 'ls-files', 'backend/data/lesson_pdfs/'],
    capture_output=True, text=True, encoding='utf-8'
)
repo_pdf_set = set(result.stdout.strip().split('\n'))

rows = []

for g in grades:
    with open(f'{base}/grade_{g}/lessons.json', encoding='utf-8') as f:
        lessons = json.load(f)
    with open(f'{base}/grade_{g}/daily_learning_units.json', encoding='utf-8') as f:
        units = json.load(f)
    with open(f'{base}/grade_{g}/lesson_content.json', encoding='utf-8') as f:
        content_list = json.load(f)
    with open(f'{base}/grade_{g}/books.json', encoding='utf-8') as f:
        books = json.load(f)

    sgk_path = f'{base}/grade_{g}/lesson_content_sgk.json'
    with open(sgk_path, encoding='utf-8') as f:
        sgk_list = json.load(f)
    sgk_ids = {c['daily_unit_id'] for c in sgk_list
               if c.get('daily_unit_id') and c.get('sgk_text')}

    by_subj = defaultdict(list)
    for u in units:
        by_subj[u['subject']].append(u)

    content_by_uid = {}
    for c in content_list:
        uid = c.get('daily_unit_id')
        if uid:
            content_by_uid[uid] = c

    for subj in sorted(by_subj.keys(), key=lambda x: -len(by_subj[x])):
        subj_units = by_subj[subj]
        subj_lessons = [l for l in lessons if l.get('subject') == subj]
        subj_books = [b for b in books if b.get('subject') == subj]

        n_units = len(subj_units)
        n_lessons = len(subj_lessons)

        n_content = sum(
            1 for u in subj_units
            if u['daily_unit_id'] in content_by_uid
            and isinstance(content_by_uid[u['daily_unit_id']].get('content'), dict)
            and content_by_uid[u['daily_unit_id']]['content'].get('objective')
        )

        n_sgk = sum(1 for u in subj_units if u['daily_unit_id'] in sgk_ids)

        lesson_ids_set = {l['lesson_id'] for l in subj_lessons}
        pdf_local = 0
        pdf_repo = 0
        for lid in lesson_ids_set:
            local_path = f'{pdf_base}/grade_{g}/{lid}.pdf'
            repo_key = f'backend/data/lesson_pdfs/grade_{g}/{lid}.pdf'
            if os.path.exists(local_path):
                pdf_local += 1
            if repo_key in repo_pdf_set:
                pdf_repo += 1

        rows.append({
            'grade': g, 'subject': subj,
            'n_books': len(subj_books),
            'n_lessons': n_lessons,
            'n_units': n_units,
            'n_content': n_content,
            'n_sgk': n_sgk,
            'pdf_local': pdf_local,
            'pdf_repo': pdf_repo,
        })

out = 'C:/AI_KIDS_BUDDY/scripts/unit_analysis_data.json'
with open(out, 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)
print(f'Wrote {len(rows)} rows to {out}')
