import requests
import json
import re
from app.config import OPENAI_API_KEY, OPENAI_MODEL


def _call_openai(messages: list, max_tokens: int = 1024) -> str:
    """
    Calls OpenAI's /chat/completions endpoint.
    Works with gpt-4o-mini (cheapest), gpt-4o, gpt-3.5-turbo etc.
    """
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Add it to your .env file."
        )

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": OPENAI_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()

    except requests.exceptions.Timeout:
        raise RuntimeError("OpenAI request timed out after 60s")
    except requests.exceptions.HTTPError as e:
        raise RuntimeError(f"OpenAI HTTP error {response.status_code}: {response.text}")
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected OpenAI response format: {e}")
    except Exception as e:
        raise RuntimeError(f"OpenAI call failed: {e}")


def ask_gemini(prompt: str) -> str:
    """Plain text call — function name kept so no agent code needs changing."""
    messages = [
        {
            "role": "system",
            "content": (
                "You are an enterprise AI assistant for contract analysis "
                "and decision-making. Be precise, analytical, and concise."
            )
        },
        {"role": "user", "content": prompt}
    ]
    return _call_openai(messages)


def ask_gemini_json(prompt: str) -> dict:
    """
    JSON call — uses OpenAI's response_format to guarantee valid JSON.
    No regex stripping needed — OpenAI returns clean JSON every time.
    """
    raw = ""
    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an enterprise AI assistant. "
                    "Always respond with ONLY valid JSON. "
                    "No markdown, no explanation, just the JSON object."
                )
            },
            {"role": "user", "content": prompt}
        ]

        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not set.")

        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": OPENAI_MODEL,
            "messages": messages,
            "max_tokens": 1024,
            "temperature": 0.3,
            "response_format": {"type": "json_object"},  # OpenAI JSON mode
        }

        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"].strip()
        return json.loads(raw)

    except json.JSONDecodeError as e:
        raise ValueError(f"OpenAI did not return valid JSON.\nError: {e}\nRaw: {raw}")
    except requests.exceptions.HTTPError as e:
        raise RuntimeError(f"OpenAI HTTP error {response.status_code}: {response.text}")
    except Exception as e:
        raise RuntimeError(f"OpenAI JSON call failed: {e}")
