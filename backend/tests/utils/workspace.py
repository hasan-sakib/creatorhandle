from fastapi.testclient import TestClient

from app.core.config import settings


def get_personal_workspace_id(client: TestClient, token_headers: dict[str, str]) -> str:
    r = client.get(f"{settings.API_V1_STR}/workspaces/", headers=token_headers)
    data = r.json()["data"]
    return data[0]["id"]


def workspace_headers(
    client: TestClient, token_headers: dict[str, str], workspace_id: str | None = None
) -> dict[str, str]:
    ws_id = workspace_id or get_personal_workspace_id(client, token_headers)
    return {**token_headers, "X-Workspace-Id": ws_id}
