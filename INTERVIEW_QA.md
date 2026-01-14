## Erudition – Interview Q&A

> File này tổng hợp các câu hỏi phỏng vấn thường gặp về dự án **Erudition** kèm câu trả lời mẫu (ngắn gọn, đi thẳng ý).

---

## 1. Tổng quan dự án

**Hỏi:** Dự án này làm gì? Giải quyết vấn đề gì?  
**Đáp:** Erudition là một nền tảng AI chatbot cho doanh nghiệp, cho phép tạo chatbot dựa trên dữ liệu nội bộ (documents, FAQ, knowledge base) bằng kỹ thuật RAG. Hệ thống giúp doanh nghiệp tự động hóa chăm sóc khách hàng, tra cứu thông tin tài liệu, và theo dõi hiệu suất chatbot qua các dashboard thống kê.

**Hỏi:** Tech stack chính của dự án là gì?  
**Đáp:**  
- **Frontend:** React + Vite, React Router, MUI, Tailwind CSS, TanStack React Query, ApexCharts, TipTap.  
- **Backend:** FastAPI, Pydantic, MongoDB (Motor), LightRAG, LangChain, ChromaDB, Neo4j, Docling, JWT.  
Frontend là SPA giao tiếp với backend bằng REST API + WebSocket, backend là service FastAPI triển khai toàn bộ logic RAG và quản lý dữ liệu.

**Hỏi:** Tại sao chọn FastAPI thay vì Django/Flask?  
**Đáp:** FastAPI hỗ trợ async/await rất tốt, tự sinh OpenAPI/Swagger, validation mạnh với Pydantic, và có performance tốt cho API-heavy backend. So với Django (nặng về MVC) hoặc Flask (cần nhiều extension), FastAPI nhẹ, rõ ràng và phù hợp kiểu microservice API như dự án này.

**Hỏi:** Tại sao dùng MongoDB thay vì PostgreSQL?  
**Đáp:** Dữ liệu chính là conversations, chatbots, documents – dạng schema linh hoạt, thay đổi theo thời gian (metadata, cấu hình chatbot, logs). MongoDB phù hợp cho event/log style data và scale theo chiều ngang tốt. Trong `pyproject.toml` đã loại bỏ các dependency PostgreSQL vì dự án này chỉ cần NoSQL (MongoDB + Chroma + Neo4j).

**Hỏi:** RAG là gì và Erudition áp dụng như thế nào?  
**Đáp:** RAG (Retrieval-Augmented Generation) là kỹ thuật kết hợp truy vấn dữ liệu (retrieval) với LLM. Flow: document được upload → Docling/LangChain xử lý, chunk, embed → lưu vào ChromaDB + Neo4j → khi user hỏi, hệ thống embed câu hỏi, retrieve các đoạn liên quan, ghép thành context rồi gọi LLM để sinh câu trả lời. Dự án dùng LightRAG để điều phối pipeline này.

---

## 2. Frontend – React, TanStack Query, MUI

**Hỏi:** Tại sao migrate từ `useEffect + axios` sang TanStack React Query?  
**Đáp:** React Query giúp quản lý server state chuẩn hơn: cache theo `queryKey`, tự dedupe request, refetch khi cần, và hỗ trợ `useMutation` với `invalidateQueries`. Trước đây mỗi component tự gọi axios + `useEffect` + `useState` dẫn đến lặp code, khó đồng bộ khi mutate (ví dụ xóa chatbot xong phải tự filter list). Sau khi migrate, logic fetch được gom về `useQuery`, còn cập nhật như delete dùng `useMutation` + `invalidateQueries` để refetch list tự động.

**Hỏi:** `useQuery` và `useMutation` khác gì nhau, dùng khi nào?  
**Đáp:**  
- `useQuery`: cho **GET/read** – dữ liệu có thể cache được, idempotent. Ví dụ: list chatbots owner/user (`DashboardLayout`, `UserLayout`), chi tiết chatbot (`ChatBotDetails`).  
- `useMutation`: cho **POST/PUT/DELETE/update** – thao tác ghi, side-effect. Ví dụ: xóa chatbot trong `WorkspacePage.jsx` dùng `useMutation` + `queryClient.invalidateQueries(["ownerChatbots"])`.

**Hỏi:** `queryClient.invalidateQueries` hoạt động như thế nào?  
**Đáp:** Khi mutate xong (ví dụ xóa chatbot), ta gọi `invalidateQueries` với `queryKey` tương ứng, React Query sẽ đánh dấu cache đó là “stale” và trigger refetch. Nhờ vậy, list chatbots luôn sync với server mà không cần tự cập nhật mảng local bằng `setState`.

**Hỏi:** `useOutletContext` được dùng thế nào trong dự án này?  
**Đáp:** Các layout như `DashboardLayout` và `UserLayout` dùng `useQuery` để fetch list chatbots rồi truyền `{ chatbots, isLoading, refreshChatbots }` xuống các trang con qua `<Outlet context={...} />`. Các page như `WorkspacePage.jsx` và `userPages/WorkspacePage.jsx` gọi `useOutletContext()` để nhận data này, tránh phải fetch lại cùng một API ở nhiều nơi.

**Hỏi:** Tại sao dùng MUI + Tailwind cùng lúc?  
**Đáp:** MUI cung cấp các component phức tạp (Dialog, Table, Tabs, DatePicker) với theme system tốt, còn Tailwind dùng cho custom layout, spacing, và style nhanh ở các phần không cần component nặng. Kết hợp giúp vừa có UI nhất quán, vừa linh hoạt khi cần tùy chỉnh nhanh.

---

## 3. Backend – FastAPI, MongoDB, RAG

**Hỏi:** FastAPI hỗ trợ async/await và DI như thế nào trong dự án này?  
**Đáp:** Các route trong `backend/app/api/routes/` dùng async function và Motor client (MongoDB async driver). Dependency injection được dùng cho auth (JWT), DB context, và config. Startup event trong `main.py` khởi tạo DB async với timeout để không chặn server khi DB chậm.

**Hỏi:** Pydantic đóng vai trò gì?  
**Đáp:** Pydantic dùng cho models (vd. `models_mongo.py`), validate dữ liệu request/response, và settings (`core/config.py` với `BaseSettings`). Nó đảm bảo type-safety, serialize/deserialize JSON chuẩn và giúp dễ debug khi input sai định dạng.

**Hỏi:** Thiết kế MongoDB collections như thế nào cho chatbots, conversations, users?  
**Đáp:** Các collection chính: `users`, `chatbots`, `conversations`, `documents`, `favorite_messages`. `users` lưu thông tin user + roles, `chatbots` lưu config chatbot (guard rails, windowing, quota...), `conversations` lưu lịch sử tin nhắn, `documents` lưu metadata docs đã upload, `favorite_messages` lưu các tin nhắn được đánh dấu yêu thích. ID ứng dụng dùng UUID (`id`) còn `_id` của MongoDB bị ẩn khi trả về API.

**Hỏi:** Flow RAG cụ thể trong dự án này là gì?  
**Đáp:**  
1. User upload document → backend dùng Docling + LangChain để parse (PDF, DOCX...), tách text, trích bảng, v.v.  
2. Text được chunk và embed (OpenAI embeddings) → lưu vector vào ChromaDB theo từng chatbot.  
3. Entities/relationships được trích xuất và lưu vào Neo4j tạo knowledge graph.  
4. Khi user chat, câu hỏi được embed → ChromaDB retrieve top-k chunks + Neo4j retrieve subgraph liên quan → LightRAG kết hợp context này → LLM generate câu trả lời cuối.

**Hỏi:** JWT auth được implement như thế nào?  
**Đáp:** Khi user login, backend verify credentials rồi generate JWT chứa user id + roles, ký bằng `SECRET_KEY`. Frontend lưu token (localStorage) và gửi trong `Authorization: Bearer <token>` cho các API protected. Backend dùng dependency để verify, decode token, kiểm tra expire và role (admin, creator, user) trước khi cho vào route.

---

## 4. Kiến trúc & Design

**Hỏi:** Kiến trúc tổng thể của hệ thống?  
**Đáp:** Hệ thống là kiến trúc service đơn (monolith) tách **frontend React SPA** và **backend FastAPI**. Backend tổ chức theo layers: `api/routes` (endpoints), `services` (business logic), `models_mongo` (schema), `core` (config, db), `LightRAG` & `helpers` (RAG pipeline). Frontend tổ chức theo `pages`, `components`, `services` (API layer) và `sections` (layout).

**Hỏi:** Clean Architecture hay pattern gì được áp dụng?  
**Đáp:** Không phải full Clean Architecture, nhưng code backend đã tách **routes** (I/O) khỏi **services** (business logic) và **models** (schema). Điều này giúp dễ test, dễ thay đổi database phía dưới mà không phải đụng vào route/controller.

**Hỏi:** Tại sao dùng cả ChromaDB và Neo4j?  
**Đáp:** ChromaDB tối ưu cho semantic search trên embeddings (tìm đoạn text liên quan nhất), còn Neo4j tối ưu cho knowledge graph (truy vấn quan hệ phức tạp giữa entities). Kết hợp hai bên giúp trả lời câu hỏi dựa cả trên ngữ nghĩa (embedding) lẫn cấu trúc quan hệ (graph), đặc biệt hữu ích cho domain knowledge nhiều entity.

---

## 5. Performance & Optimization

**Hỏi:** Làm sao để tối ưu performance frontend?  
**Đáp:**  
- Dùng Vite cho dev/build nhanh, tree-shaking để loại bỏ code không dùng.  
- TanStack Query cache và dedupe request.  
- Tận dụng lazy loading routes, tránh load những phần admin nặng khi user không vào.  
- Dùng MUI + Tailwind đúng mức, tránh over-render, dùng `useMemo`/`useCallback` khi truyền props phức tạp.

**Hỏi:** Backend đã làm gì để xử lý vấn đề server load chậm / MongoDB connect chậm?  
**Đáp:** Đã implement lazy loading cho MongoDB/Neo4j connections trong `core/config.py` và `MongoDbContext`, giảm việc connect ngay khi import module. Thêm timeout (`serverSelectionTimeoutMS`, `connectTimeoutMS`, `socketTimeoutMS`), `retryWrites/Reads`, và xử lý lỗi kết nối để server vẫn khởi động được dù DB tạm thời không truy cập được. `init_db()` được chạy async với timeout nên không chặn startup.

**Hỏi:** Làm sao để xử lý streaming responses từ chatbot hiệu quả?  
**Đáp:** Frontend dùng `sendMessageToChatbot` với `fetch` dạng SSE/stream (`text/event-stream`), đọc stream bằng `ReadableStreamDefaultReader`, ghép các chunk JSON, update UI theo interval (throttling) để tránh re-render liên tục. Khi stream xong, message chatbot được cập nhật `isStreaming = false` và lưu trữ đầy đủ nội dung.

---

## 6. Security

**Hỏi:** Làm sao bảo vệ API với JWT?  
**Đáp:** Mọi route cần login đều yêu cầu header `Authorization: Bearer <token>`. Backend verify signature, kiểm tra expire, và map role (admin, creator, user). Các route admin / thống kê nhạy cảm chỉ cho phép nếu role phù hợp. Vì JWT stateless nên server không cần lưu session, chỉ cần quản lý `SECRET_KEY` bảo mật.

**Hỏi:** Có những rủi ro bảo mật gì và đã xử lý như thế nào?  
**Đáp:**  
- XSS: sanitize input khi render markdown trên frontend (`markdown-to-jsx`, `rehype-raw` hạn chế), tránh dangerouslySetInnerHTML.  
- CSRF: vì backend chủ yếu dùng Bearer token trong header và không lệ thuộc cookie, nguy cơ CSRF thấp.  
- File upload: dùng Docling + kiểm tra loại file, kích thước, chỉ parse định dạng cho phép (PDF, DOCX…).

---

## 7. Testing, CI/CD, Deployment

**Hỏi:** Testing được setup như thế nào?  
**Đáp:** Backend sử dụng pytest (đã khai báo trong `pyproject.toml`), có script `backend/scripts/test.sh`. Frontend dùng `react-scripts test`. Có thể viết unit test cho services và e2e test cho flow chính (login, tạo chatbot, chat, thống kê).

**Hỏi:** Chạy dự án trong dev/prod như thế nào?  
**Đáp:**  
- Dev: chạy riêng backend (`uv sync` + `fastapi run --reload app/main.py`) và frontend (`npm install` + `npm run dev`).  
- Prod: dùng `docker-compose` để bật đồng thời backend, frontend, và các service phụ (MongoDB, Neo4j, Chroma…) theo cấu hình trong `docker-compose.yml`. Có file `runtime.txt` và `Dockerfile` cho backend support deploy PaaS.

---

## 8. Challenges & Lessons Learned

**Hỏi:** Vấn đề khó nhất đã gặp trong dự án là gì?  
**Đáp (ví dụ thực tế):**  
- **1)** MongoDB không hỗ trợ trực tiếp `Decimal` → khi lưu token bundles bị lỗi `InvalidDocument`. Đã fix bằng cách convert `Decimal` sang `float` khi lưu và convert lại khi trả response.  
- **2)** Nhiều route 404 vì conflict path (ví dụ `/chatbot/{chatbot_id}` vs `/chatbot/{chatbot_id}/get`) → phải sắp xếp lại thứ tự và đổi path rõ ràng hơn (`/details/{chatbot_id}`).  
- **3)** Server startup rất chậm nếu MongoDB không reachable → giải quyết bằng lazy loading và init async.

**Hỏi:** Bài học rút ra từ việc migrate sang TanStack React Query?  
**Đáp:** Không nên migrate “all at once” vì dễ vỡ, mà nên chọn từng flow (chatbots list, chatbot details, favorites…) rồi áp dụng pattern `useQuery`/`useMutation` + `invalidateQueries`. Khi đã có vài ví dụ chuẩn (`DashboardLayout`, `UserLayout`, `WorkspacePage`, `ChatBotDetails`), phần còn lại chỉ là lặp pattern.

---

## 9. Cải tiến tương lai

**Hỏi:** Nếu có thời gian, bạn muốn cải tiến gì cho Erudition?  
**Đáp (gợi ý):**  
- Chuẩn hóa toàn bộ data fetching qua TanStack Query (loại bỏ dần `useEffect + axios` rời rạc).  
- Bổ sung rate limiting, logging & monitoring (Sentry, Prometheus/Grafana).  
- Tách RAG pipeline thành service riêng (microservice) để scale độc lập với API CRUD.  
- Thêm interface cấu hình prompt/guard rails cho từng chatbot kèm versioning.

