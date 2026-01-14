import os
import sys

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
    try:
        host = "0.0.0.0"
        port = _get_int_env("PORT", 8000)
        workers = _get_int_env("WEB_CONCURRENCY", 1)
        
        print(f"[INFO] Starting server on {host}:{port} with {workers} worker(s)")
        print(f"[INFO] PORT environment variable: {os.getenv('PORT', 'NOT SET')}")
        sys.stdout.flush()
        
        # Test import before running uvicorn
        print("[INFO] Testing app import...")
        sys.stdout.flush()
        from app.main import app
        print("[INFO] App imported successfully")
        sys.stdout.flush()
        
        uvicorn.run(
            "app.main:app",
            host=host,
            port=port,
            workers=workers,
            log_level="info"
        )
    except Exception as e:
        print(f"[ERROR] Failed to start server: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)


if __name__ == "__main__":
    main()
