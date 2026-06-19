"""Quick diagnostic: test MIMO call + parse for 1 unit."""
import asyncio, httpx, os, re, json, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
except ImportError:
    pass

TOKEN = os.getenv("MIMO_TOKEN_PLAN_KEY") or os.getenv("MIMO_API_KEY", "")
ENDPOINT = "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions"

PROMPT = (
    'Ban la giao vien lop 2, mon Toan.\n'
    'Tao bai giang cho bai "On tap cac so den 100" (lop 2).\n\n'
    'Tra ve JSON (khong markdown, khong giai thich):\n'
    '{"objective":"...","explanation":"...","examples":["..."],'
    '"remember":"...","parent_note":"...",'
    '"exercises":[{"question":"...","expected_answer":"...","difficulty":1,"skill":"..."}],'
    '"check_question":{"question":"...","expected_answer":"...","difficulty":3,"skill":"..."}}'
)

async def test():
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(ENDPOINT,
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
            json={"model": "mimo-v2.5-pro",
                  "messages": [
                      {"role": "system", "content": "Giao vien tieu hoc. Tra ve JSON. Khong markdown."},
                      {"role": "user", "content": PROMPT}
                  ],
                  "max_tokens": 1200, "temperature": 0.7})

        print("=== STATUS:", r.status_code)
        data = r.json()
        print("=== FULL RESPONSE KEYS:", list(data.keys()))

        if "choices" not in data:
            print("NO CHOICES! Response:")
            print(json.dumps(data, ensure_ascii=False, indent=2)[:500])
            return

        choice = data["choices"][0]
        raw = choice.get("message", {}).get("content", "")
        print("=== FINISH REASON:", choice.get("finish_reason"))
        print("=== RAW (first 500 chars) ===")
        print(repr(raw[:500]))
        print()

        if not raw.strip():
            print("EMPTY RESPONSE!")
            return

        # Parse test
        clean = re.sub(r"```(?:json)?\s*", "", raw.strip()).strip()
        try:
            obj = json.loads(clean)
            print("Direct parse OK, keys:", list(obj.keys()))
            required = ["objective","explanation","examples","remember","exercises","check_question"]
            missing = [k for k in required if k not in obj]
            print("Missing fields:", missing if missing else "NONE")
        except Exception as e:
            print("Direct parse FAIL:", e)
            start = clean.find("{")
            end = clean.rfind("}")
            if start >= 0 and end > start:
                try:
                    obj = json.loads(clean[start:end+1])
                    print("Fallback parse OK, keys:", list(obj.keys()))
                except Exception as e2:
                    print("Fallback FAIL:", e2)
                    print("Extracted snippet:", repr(clean[start:start+300]))
            else:
                print("No JSON object found in:", repr(clean[:200]))

asyncio.run(test())
