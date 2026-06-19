import sys, asyncio, os, httpx
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

KEY = os.getenv('MIMO_TOKEN_PLAN_KEY') or os.getenv('MIMO_API_KEY', '')
BASE = os.getenv('MIMO_BASE_URL', 'https://token-plan-sgp.xiaomimimo.com/v1')
MODEL = os.getenv('MIMO_MODEL', 'MiMo-V2.5-Pro')

base_clean = BASE.rstrip('/')
ENDPOINT = base_clean if base_clean.endswith('/chat/completions') else base_clean + '/chat/completions'

print(f'KEY set: {bool(KEY)}')
print(f'KEY prefix: {KEY[:10]}...' if KEY else 'NO KEY')
print(f'ENDPOINT: {ENDPOINT}')
print(f'MODEL: {MODEL}')

async def test():
    headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {KEY}'}
    payload = {
        'model': MODEL,
        'messages': [
            {'role': 'system', 'content': 'Ban la giao vien. Tra ve JSON.'},
            {'role': 'user', 'content': 'Tao 1 cau hoi toan don gian cho lop 2. Tra ve JSON: {"question": "...", "answer": "..."}'}
        ],
        'max_tokens': 200,
        'temperature': 0.7,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(ENDPOINT, headers=headers, json=payload)
        print(f'Status: {resp.status_code}')
        print(f'Response: {resp.text[:500]}')

asyncio.run(test())
