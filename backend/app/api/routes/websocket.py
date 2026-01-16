from fastapi import WebSocket, APIRouter
from typing import List, Dict

router = APIRouter()

# Quản lý tất cả kết nối WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, chatbot_id: str, websocket: WebSocket):
        await websocket.accept()
        if chatbot_id not in self.active_connections:
            self.active_connections[chatbot_id] = []
        self.active_connections[chatbot_id].append(websocket)

    def disconnect(self, chatbot_id: str, websocket: WebSocket):
        if chatbot_id in self.active_connections:
            self.active_connections[chatbot_id].remove(websocket)
            if not self.active_connections[chatbot_id]:  # nếu rỗng thì xóa agent luôn
                del self.active_connections[chatbot_id]

    async def send_status(self, chatbot_id: str, status: str, detail: str, **kwargs):
        connections = self.active_connections.get(chatbot_id, [])
        for connection in connections[:]:  # Copy list để tránh lỗi khi remove
            try:
                await connection.send_json({"status": status, "message": detail, **kwargs})
            except Exception:
                connections.remove(connection)
        if not connections:
            self.active_connections.pop(chatbot_id, None)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    chatbot_id = websocket.query_params.get("chatbot_id")
    if not chatbot_id:
        await websocket.close(code=1008, reason="Missing chatbot_id")
        return
    
    # Use chatbot_id as string directly (supports both UUID and ObjectId)
    await manager.connect(chatbot_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()  # Nhận tin nhắn từ client
            await manager.send_status(chatbot_id, "Received", f"Client sent: {data}")
    except Exception:
        pass  # Bỏ qua lỗi nếu WebSocket bị đóng
    finally:
        manager.disconnect(chatbot_id, websocket)