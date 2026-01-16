import io
import logging

import aioboto3

from app.core.config import settings

MINIO_BUCKET = settings.MINIO_BUCKET
MINIO_ENDPOINT = settings.MINIO_ENDPOINT
MINIO_ACCESS_KEY = settings.MINIO_ACCESS_KEY
MINIO_SECRET_KEY = settings.MINIO_SECRET_KEY
MINIO_REGION = settings.MINIO_REGION


class StorageService:
    @staticmethod
    async def upload_bytes(data: bytes, key: str):
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
        session = aioboto3.Session()
        async with session.client(
                "s3",
                endpoint_url=MINIO_ENDPOINT,
                region_name=MINIO_REGION,
                aws_access_key_id=MINIO_ACCESS_KEY,
                aws_secret_access_key=MINIO_SECRET_KEY,
        ) as s3:
            paginator = s3.get_paginator("list_objects_v2")  # <-- BỎ `await` ở đây
            try:
                # CHỈ DÙNG await hoặc async trong vòng for này
                async for page in paginator.paginate(Bucket=MINIO_BUCKET, Prefix=prefix):
                    if 'Contents' not in page:
                        continue
                    to_delete = [{'Key': obj['Key']} for obj in page['Contents']]
                    if to_delete:
                        await s3.delete_objects(Bucket=MINIO_BUCKET, Delete={'Objects': to_delete})
                        logging.info(f"Deleted {len(to_delete)} objects under prefix {prefix}")
            except Exception as e:
                logging.error(f"Failed to delete objects by prefix {prefix}: {e}")
                raise
