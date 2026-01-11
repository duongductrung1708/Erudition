import csv
import html
import io
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable
from hashlib import md5
import emails  # type: ignore
import jwt
import tiktoken
from jinja2 import Template
from jwt.exceptions import InvalidTokenError

from app.core import security
from app.core.config import settings
import smtplib, ssl

from app.models_mongo import Chatbot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
            Path(__file__).parent / "email-templates" / "build" / template_name
    ).read_text()
    html_content = Template(template_str).render(context)
    return html_content


def send_email(*, email_to: str, subject: str = "", html_content: str = "", ) -> None:
    assert settings.emails_enabled, "no provided configuration for email variables"
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    context = ssl.create_default_context()
    logger.info(f"settings: {settings}")
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.ehlo()  # Can be omitted
        server.starttls(context=context)
        server.ehlo()  # Can be omitted
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        response = server.sendmail(settings.SMTP_USER, email_to, message.as_string())
    logger.info(f"send email result: {response}")


def generate_test_email(email_to: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    html_content = render_email_template(
        template_name="test_email.html",
        context={"project_name": settings.PROJECT_NAME, "email": email_to},
    )
    return EmailData(html_content=html_content, subject=subject)

def generate_reset_password_email(email_to: str, email: str, token: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


async def generate_invite_email(email_to: str, username: str, chatbot: Chatbot) -> EmailData:
    """Generate invite email - MongoDB version (async to fetch owner email)"""
    from app.services.UserServicesMongo import get_user_by_id
    
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Invitation for user {email_to}"
    link = f"{settings.FRONTEND_HOST}/user/user-conversation-detail/{chatbot.id}"
    
    # Get owner email from MongoDB
    owner = await get_user_by_id(user_id=chatbot.owner_id)
    owner_email = owner.email if owner else "Unknown"
    
    html_content = render_email_template(
        template_name="invite_chatbot_user.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "chatbot_name": chatbot.name,
            "chatbot_creator": owner_email,
            "link": link,
        }
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_new_account_email(
        email_to: str, username: str, password: str
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": settings.FRONTEND_HOST,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None


def compute_mdhash_id(content: str, prefix: str = "") -> str:
    """
    Compute a unique ID for a given content string.

    The ID is a combination of the given prefix and the MD5 hash of the content string.
    """
    return prefix + md5(content.encode()).hexdigest()

def split_string_by_multi_markers(content: str, markers: list[str]) -> list[str]:
    """Split a string by multiple markers"""
    if not markers:
        return [content]
    results = re.split("|".join(re.escape(marker) for marker in markers), content)
    return [r.strip() for r in results if r.strip()]


def clean_str(input: Any) -> str:
    """Clean an input string by removing HTML escapes, control characters, and other unwanted characters."""
    # If we get non-string input, just give it back
    if not isinstance(input, str):
        return input

    result = html.unescape(input.strip())
    # https://stackoverflow.com/questions/4324790/removing-control-characters-from-a-string-in-python
    return re.sub(r"[\x00-\x1f\x7f-\x9f]", "", result)


def is_float_regex(value: str) -> bool:
    return bool(re.match(r"^[-+]?[0-9]*\.?[0-9]+$", value))



def list_of_list_to_csv(data: list[list[str]]) -> str:
    output = io.StringIO()
    writer = csv.writer(
        output,
        quoting=csv.QUOTE_ALL,  # Quote all fields
        escapechar="\\",  # Use backslash as escape character
        quotechar='"',  # Use double quotes
        lineterminator="\n",  # Explicit line terminator
    )
    writer.writerows(data)
    return output.getvalue()


def truncate_list_by_token_size(
    list_data: list[Any], key: Callable[[Any], str], max_token_size: int
) -> list[int]:
    """Truncate a list of data by token size"""
    if max_token_size <= 0:
        return list_data
    tokens = 0
    for i, data in enumerate(list_data):
        if tokens > max_token_size:
            return list_data[:i]
    return list_data
