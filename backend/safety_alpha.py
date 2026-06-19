"""VyVy safety module: soft guardrails for parent-supervised mode."""

import re

PHONE_PATTERNS = [
    r"\b0\d{9}\b",
    r"\b0\d{3}[-.\s]?\d{3}[-.\s]?\d{3}\b",
    r"\b\+84\s?\d{9,10}\b",
]

ADDRESS_KEYWORDS = [
    "nhà ở", "địa chỉ", "số nhà", "ngõ", "ngách", "hẻm",
    "đường", "phố", "quận", "huyện", "xã", "phường",
    "tỉnh", "thành phố", "sống ở đâu", "nhà ở đâu",
]

SCHOOL_KEYWORDS = [
    "trường nào", "trường gì", "tên trường", "học ở đâu",
    "trường học", "lớp nào", "tên lớp",
]

PASSWORD_KEYWORDS = [
    "mật khẩu", "password", "mã pin", "mã số",
]

PRIVATE_INFO_REDIRECT = "Thông tin này bạn nên nói với bố/mẹ, VyVy không cần biết đâu. Mình nói chuyện khác vui hơn nhé!"

DANGER_KEYWORDS = [
    "cách làm bom", "cách chế thuốc nổ", "cách giết người",
    "cách tự tử", "cách tự hại",
]

DANGER_REDIRECT = "Ôi, mình không biết về chuyện này đâu. Nếu bạn đang buồn hay lo lắng, hãy nói với bố/mẹ nhé. Mình kể chuyện vui cho bạn nghe không?"


def check_safety(text: str) -> dict:
    """
    Check user message with soft guardrails for parent-supervised mode.
    Returns: {blocked: bool, reason: str, redirect_message: str, sel_flag: str or None}
    """
    text_lower = text.lower()

    # Check for phone numbers (soft redirect)
    for pattern in PHONE_PATTERNS:
        if re.search(pattern, text):
            return {
                "blocked": True,
                "reason": "phone_number",
                "redirect_message": PRIVATE_INFO_REDIRECT,
                "sel_flag": None,
            }

    # Check for address keywords (soft redirect)
    for keyword in ADDRESS_KEYWORDS:
        if keyword in text_lower:
            return {
                "blocked": True,
                "reason": "address",
                "redirect_message": PRIVATE_INFO_REDIRECT,
                "sel_flag": None,
            }

    # Check for school keywords (soft redirect)
    for keyword in SCHOOL_KEYWORDS:
        if keyword in text_lower:
            return {
                "blocked": True,
                "reason": "school",
                "redirect_message": PRIVATE_INFO_REDIRECT,
                "sel_flag": None,
            }

    # Check for password keywords (soft redirect)
    for keyword in PASSWORD_KEYWORDS:
        if keyword in text_lower:
            return {
                "blocked": True,
                "reason": "password",
                "redirect_message": PRIVATE_INFO_REDIRECT,
                "sel_flag": None,
            }

    # Check for direct dangerous instructions (minimal hard guardrail)
    for keyword in DANGER_KEYWORDS:
        if keyword in text_lower:
            return {
                "blocked": True,
                "reason": "danger",
                "redirect_message": DANGER_REDIRECT,
                "sel_flag": None,
            }

    # SEL signal detection (not blocking, just flagging)
    sel_keywords = {
        "sadness": ["buồn", "khóc", "không vui", "chán", "cô đơn", "không có bạn"],
        "fear": ["sợ", "kinh khủng", "đáng sợ", "run"],
        "anger": ["giận", "tức", "ghét", "bực mình", "khó chịu"],
        "bullying": ["bắt nạt", "đánh tao", "chửi tao", "bị đánh", "bị chửi"],
        "excitement": ["vui quá", "thích quá", "tuyệt vời", "hay quá"],
    }

    sel_flag = None
    for flag, keywords in sel_keywords.items():
        for kw in keywords:
            if kw in text_lower:
                sel_flag = flag
                break
        if sel_flag:
            break

    return {
        "blocked": False,
        "reason": "",
        "redirect_message": "",
        "sel_flag": sel_flag,
    }
