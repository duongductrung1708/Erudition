import io
import logging
import os
from pathlib import Path

import aioboto3

from app.core.config import settings

MINIO_BUCKET = settings.MINIO_BUCKET
MINIO_ENDPOINT = settings.MINIO_ENDPOINT
MINIO_ACCESS_KEY = settings.MINIO_ACCESS_KEY
MINIO_SECRET_KEY = settings.MINIO_SECRET_KEY
MINIO_REGION = settings.MINIO_REGION


class StorageService:
    @staticmethod
    def _use_s3() -> bool:
        # In local dev we default to local filesystem storage to avoid confusing
        # failures caused by stale/invalid S3 credentials in `.env`.
        # Set `USE_S3_IN_LOCAL=true` to force S3.
        if getattr(settings, "ENVIRONMENT", "") == "local":
            return os.getenv("USE_S3_IN_LOCAL", "").lower() in {"1", "true", "yes"}
        return bool(MINIO_BUCKET and MINIO_ENDPOINT and MINIO_ACCESS_KEY and MINIO_SECRET_KEY)

    @staticmethod
    def _local_root() -> Path:
        # Keep local storage inside backend/.local-storage by default
        root = os.getenv("LOCAL_STORAGE_ROOT", "")
        if root:
            return Path(root)
        return Path(__file__).resolve().parents[2] / ".local-storage"

    @staticmethod
    def _local_path(key: str) -> Path:
        # key example: "{chatbot_id}/full_docs/{document_id}.md"
        # store it as a relative path under _local_root
        return StorageService._local_root() / key

    @staticmethod
    async def upload_bytes(data: bytes, key: str):
        if not StorageService._use_s3():
            local_path = StorageService._local_path(key)
            local_path.parent.mkdir(parents=True, exist_ok=True)
            await __import__("asyncio").to_thread(local_path.write_bytes, data)
            logging.info(f"[StorageService] Saved local object to {local_path}")
            return

        session = aioboto3.Session()
        async with session.client(
            "s3",
            endpoint_url=MINIO_ENDPOINT,
            region_name=MINIO_REGION,
            aws_access_key_id=MINIO_ACCESS_KEY,
            aws_secret_access_key=MINIO_SECRET_KEY,
        ) as s3:
            try:
                await s3.upload_fileobj(io.BytesIO(data), MINIO_BUCKET, key)
                logging.info(f"Uploaded object to {key}")
            except Exception as e:
                logging.error(f"Failed to upload {key}: {e}")
                raise

    @staticmethod
    async def download_bytes(key: str) -> bytes:
        if not StorageService._use_s3():
            local_path = StorageService._local_path(key)
            if not local_path.exists():
                raise FileNotFoundError(f"Local object not found: {local_path}")
            return await __import__("asyncio").to_thread(local_path.read_bytes)

        session = aioboto3.Session()
        async with session.client(
            "s3",
            endpoint_url=MINIO_ENDPOINT,
            region_name=MINIO_REGION,
            aws_access_key_id=MINIO_ACCESS_KEY,
            aws_secret_access_key=MINIO_SECRET_KEY,
        ) as s3:
            try:
                obj = await s3.get_object(Bucket=MINIO_BUCKET, Key=key)
                return await obj["Body"].read()
            except Exception as e:
                error_msg = str(e)
                logging.error(f"Failed to download {key}: {error_msg}")
                # Check if it's an access denied error
                if "AccessDenied" in error_msg or "not authorized" in error_msg:
                    raise PermissionError(
                        f"Access denied to S3 resource. Please check AWS IAM permissions for s3:GetObject on bucket '{MINIO_BUCKET}'. "
                        f"Original error: {error_msg}"
                    )
                raise

    @staticmethod
    async def delete_object(key: str):
        if not StorageService._use_s3():
            local_path = StorageService._local_path(key)
            if local_path.exists():
                await __import__("asyncio").to_thread(local_path.unlink)
            logging.info(f"[StorageService] Deleted local object {local_path}")
            return

        session = aioboto3.Session()
        async with session.client(
            "s3",
            endpoint_url=MINIO_ENDPOINT,
            region_name=MINIO_REGION,
            aws_access_key_id=MINIO_ACCESS_KEY,
            aws_secret_access_key=MINIO_SECRET_KEY,
        ) as s3:
            try:
                await s3.delete_object(Bucket=MINIO_BUCKET, Key=key)
                logging.info(f"Deleted object {key}")
            except Exception as e:
                logging.error(f"Failed to delete {key}: {e}")
                raise

    @staticmethod
    async def delete_objects_by_prefix(prefix: str):
        """ Xóa tất cả object trong bucket có tiền tố prefix. """
        if not StorageService._use_s3():
            root = StorageService._local_root()
            base = root / prefix
            if not base.exists():
                return
            # delete files under prefix
            for path in base.rglob("*"):
                if path.is_file():
                    await __import__("asyncio").to_thread(path.unlink)
            logging.info(f"[StorageService] Deleted local objects under {base}")
            return

        session = aioboto3.Session()
        async with session.client(
            "s3",
            endpoint_url=MINIO_ENDPOINT,
            region_name=MINIO_REGION,
            aws_access_key_id=MINIO_ACCESS_KEY,
            aws_secret_access_key=MINIO_SECRET_KEY,
        ) as s3:
            paginator = s3.get_paginator("list_objects_v2")
            try:
                async for page in paginator.paginate(Bucket=MINIO_BUCKET, Prefix=prefix):
                    if "Contents" not in page:
                        continue
                    to_delete = [{"Key": obj["Key"]} for obj in page["Contents"]]
                    if to_delete:
                        await s3.delete_objects(
                            Bucket=MINIO_BUCKET, Delete={"Objects": to_delete}
                        )
                        logging.info(
                            f"Deleted {len(to_delete)} objects under prefix {prefix}"
                        )
            except Exception as e:
                logging.error(f"Failed to delete objects by prefix {prefix}: {e}")
                raise
