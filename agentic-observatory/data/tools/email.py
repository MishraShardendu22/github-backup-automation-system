import re
from typing import Annotated, Any
from langchain_core.tools import tool
from utils.reports import send_email, normalize_recipients
from config import settings

@tool
async def send_report_email(
    subject: Annotated[str, "The subject line of the email"],
    content_markdown: Annotated[str, "The full content of the report in markdown format"],
    recipients: Annotated[list[str] | None, "Optional list of recipient email addresses. Defaults to settings.SMTP_TO"] = None,
) -> dict[str, Any]:
    """Send a generated report email to the specified recipients.

    Use when the user requests to send, email, or dispatch a backup report or message.
    It takes the subject and markdown content, renders it, and dispatches the email.
    Examples:
    - "Email me the latest backup health report."
    - "Send the backup failure analysis to shardendumishra01@gmail.com."
    """
    to_emails = recipients
    if not to_emails:
        if settings.SMTP_TO:
            to_emails = normalize_recipients(settings.SMTP_TO)
        else:
            raise ValueError("No recipients specified and SMTP_TO is not configured in settings.")
            
    # Simple markdown-to-html translation for clean email layout
    html_lines = []
    for line in content_markdown.split("\n"):
        line = line.strip()
        if not line:
            html_lines.append("<br/>")
            continue
        if line.startswith("# "):
            html_lines.append(f"<h2 style='color:#d4a832;'>{line[2:]}</h2>")
        elif line.startswith("## "):
            html_lines.append(f"<h3 style='color:#f0ead6;'>{line[3:]}</h3>")
        elif line.startswith("- ") or line.startswith("* "):
            html_lines.append(f"<li style='margin-left: 15px; font-size: 14px;'>{line[2:]}</li>")
        elif line.startswith("|") and line.endswith("|"):
            # Format row
            cells = [c.strip() for c in line.split("|")[1:-1]]
            cell_tags = "".join(f"<td style='border:1px solid #333; padding:8px;'>{c}</td>" for c in cells)
            html_lines.append(f"<tr>{cell_tags}</tr>")
        else:
            # Inline bold/code replacement
            line = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', line)
            line = re.sub(r'`(.*?)`', r'<code style="background:#1a1816; padding:2px 4px; border-radius:3px;">\1</code>', line)
            html_lines.append(f"<p style='font-size: 14px; line-height: 1.6; margin: 4px 0;'>{line}</p>")
            
    # Wrap table rows in <table> blocks
    html_content = ""
    in_table = False
    for line in html_lines:
        if "<tr>" in line:
            if not in_table:
                html_content += "<table style='border-collapse:collapse; width:100%; border:1px solid #333; margin:16px 0;'>"
                in_table = True
            # Skip divider row (---)
            if "---" in line:
                continue
            html_content += line
        else:
            if in_table:
                html_content += "</table>"
                in_table = False
            html_content += line
            
    full_html = f"""
    <html>
      <body style="font-family: sans-serif; background-color: #100e0b; color: #f0ead6; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #141210; padding: 24px; border: 1px solid #282520; border-radius: 8px;">
          <h1 style="color: #d4a832; border-bottom: 1px solid #282520; padding-bottom: 12px; margin-top: 0; font-size: 20px;">Agentic Observatory Report</h1>
          {html_content}
          <div style="margin-top: 24px; border-top: 1px solid #282520; padding-top: 12px; font-size: 11px; color: #8a8578;">
            Sent by GitHub Backup Observatory Agent · v1.0.0
          </div>
        </div>
      </body>
    </html>
    """
    
    send_email(subject, to_emails, full_html)
    return {"success": True, "message": f"Email sent successfully to {', '.join(to_emails)}"}
