import os

import uvicorn


def _get_int_env(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def main() -> None:
    host = "0.0.0.0"
    port = _get_int_env("PORT", 8000)
    workers = _get_int_env("WEB_CONCURRENCY", 1)
    uvicorn.run("app.main:app", host=host, port=port, workers=workers)


if __name__ == "__main__":
    main()
