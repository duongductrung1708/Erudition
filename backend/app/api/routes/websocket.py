import uuid

from fastapi import WebSocket, APIRouter
from typing import List, Dict

router = APIRouter()

# Quản lý tất cả kết nối WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, chatbot_id: uuid.UUID, websocket: WebSocket):
        await websocket.accept()
        if chatbot_id.__str__() not in self.active_connections:
            self.active_connections[chatbot_id.__str__()] = []
        self.active_connections[chatbot_id.__str__()].append(websocket)

    def disconnect(self, chatbot_id: uuid.UUID, websocket: WebSocket):
        agent_id = chatbot_id.__str__()
        if agent_id in self.active_connections:
            self.active_connections[agent_id].remove(websocket)
            if not self.active_connections[agent_id]:  # nếu rỗng thì xóa agent luôn
                del self.active_connections[agent_id]

    async def send_status(self, chatbot_id: uuid.UUID, status: str, detail: str, **kwargs):
        agent_id = chatbot_id.__str__()
        connections = self.active_connections.get(agent_id, [])
        for connection in connections[:]:  # Copy list để tránh lỗi khi remove
            try:
                await connection.send_json({"status": status, "message": detail, **kwargs})
            except Exception:
                connections.remove(connection)
        if not connections:
            self.active_connections.pop(agent_id, None)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    chatbot_id = websocket.query_params.get("chatbot_id")
    agent_id = uuid.UUID(chatbot_id)
    if not agent_id:
        await websocket.close(code=1008)
        return
    await manager.connect(agent_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()  # Nhận tin nhắn từ client
            await manager.send_status(agent_id, "Received", f"Client sent: {data}")
    except Exception:
        pass  # Bỏ qua lỗi nếu WebSocket bị đóng
    finally:
        manager.disconnect(agent_id, websocket)