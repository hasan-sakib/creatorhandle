"""Transactional email: rendering MJML-built templates and sending via SMTP."""

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import emails  # type: ignore
from jinja2 import Template

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
        Path(__file__).parent / "templates" / "build" / template_name
    ).read_text()
    # Autoescape: some templates include text typed by visitors (inquiries)
    html_content = Template(template_str, autoescape=True).render(context)
    return html_content


def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
    reply_to: str | None = None,
) -> None:
    assert settings.emails_enabled, "no provided configuration for email variables"
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
        headers={"Reply-To": reply_to} if reply_to else None,
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    elif settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    response = message.send(to=email_to, smtp=smtp_options)
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
    link = f"{settings.DASHBOARD_URL}/reset-password?token={token}"
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


def generate_new_account_email(email_to: str, username: str, token: str) -> EmailData:
    """Welcome email for an admin-created account.

    It never contains the password: the link lets the user choose their own,
    using the same token and page as password recovery.
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    link = f"{settings.DASHBOARD_URL}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


BUDGET_LABELS = {
    "under-500": "Under $500",
    "500-2k": "$500 – $2k",
    "2k-5k": "$2k – $5k",
    "5k-plus": "$5k+",
    "not-sure": "Not sure yet",
}


def generate_new_inquiry_email(
    *,
    email_to: str,
    sender_name: str,
    sender_email: str,
    company: str | None,
    budget: str | None,
    message: str,
) -> EmailData:
    project_name = settings.PROJECT_NAME
    who = f"{sender_name} ({company})" if company else sender_name
    subject = f"{project_name} - New inquiry from {who}"
    html_content = render_email_template(
        template_name="new_inquiry.html",
        context={
            "project_name": project_name,
            "sender_name": sender_name,
            "sender_email": sender_email,
            "company": company,
            "budget": BUDGET_LABELS.get(budget or ""),
            "message": message,
            "email": email_to,
            "link": f"{settings.DASHBOARD_URL}/inbox",
        },
    )
    return EmailData(html_content=html_content, subject=subject)
