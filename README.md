# Erudition

**Erudition** - A fully functional AI chatbot platform designed for businesses, featuring intelligent conversation management powered by RAG (Retrieval-Augmented Generation) technology, enabling seamless customer interactions from chatbot creation to deployment.

## Technology Stack

### Frontend

- ⚛️ [**React**](https://react.dev) - Modern UI library
- ⚡ [**Vite**](https://vitejs.dev) - Fast build tool and dev server
- 🎨 [**Material-UI (MUI)**](https://mui.com) - React component library
- 🎨 [**Tailwind CSS**](https://tailwindcss.com) - Utility-first CSS framework
- 🛣️ [**React Router**](https://reactrouter.com) - Client-side routing
- 🔄 [**TanStack Query**](https://tanstack.com/query) - Data fetching and state management
- 📊 [**ApexCharts**](https://apexcharts.com) - Data visualization
- 📝 [**TipTap**](https://tiptap.dev) - Rich text editor

### Backend

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com) - Modern Python web framework
- 🔍 [**Pydantic**](https://docs.pydantic.dev) - Data validation and settings management
- 💾 [**MongoDB**](https://www.mongodb.com) - NoSQL database with Motor async driver
- 🤖 [**LightRAG**](https://github.com/HKUDS/LightRAG) - Simple and fast RAG framework
- 🔗 [**LangChain**](https://www.langchain.com) - LLM application framework
- 🗄️ [**ChromaDB**](https://www.trychroma.com) - Vector database for embeddings
- 🕸️ [**Neo4j**](https://neo4j.com) - Graph database for knowledge graphs
- 📄 [**Docling**](https://github.com/DS4SD/docling) - Document processing
- 🔐 [**JWT**](https://jwt.io) - Authentication tokens
- 📧 Email templates with MJML

## Tech Stack Details

### Frontend Technologies

#### ⚛️ React

**Vai trò:** Framework JavaScript chính để xây dựng giao diện người dùng  
**Tác dụng:**

- Tạo các component có thể tái sử dụng (chat interface, dashboard, forms)
- Quản lý state của UI với hooks (useState, useEffect, useContext)
- Xử lý rendering hiệu quả với Virtual DOM
- Hỗ trợ xây dựng Single Page Application (SPA)

**Ví dụ sử dụng:** Tất cả các component trong `frontend/src/components/` và `frontend/src/pages/` đều được xây dựng bằng React

#### ⚡ Vite

**Vai trò:** Build tool và development server cực nhanh  
**Tác dụng:**

- Hot Module Replacement (HMR) - tự động reload khi code thay đổi
- Build nhanh hơn Webpack nhờ sử dụng ES modules
- Optimize code cho production với tree-shaking
- Hỗ trợ TypeScript, JSX out of the box

**Lợi ích:** Giảm thời gian chờ khi development từ vài phút xuống vài giây

#### 🎨 Material-UI (MUI)

**Vai trò:** Component library cung cấp UI components có sẵn  
**Tác dụng:**

- Cung cấp các component đẹp, responsive (Button, Dialog, DataGrid, Charts)
- Theme system để customize màu sắc, typography
- Responsive design với breakpoints
- Accessibility (a11y) built-in

**Ví dụ sử dụng:**

- `DataGrid` cho bảng quản lý chatbots, users
- `Dialog` cho popup upload document, FAQ
- `Charts` cho analytics dashboard

#### 🎨 Tailwind CSS

**Vai trò:** Utility-first CSS framework  
**Tác dụng:**

- Viết CSS nhanh với utility classes (p-4, flex, bg-blue-500)
- Không cần viết custom CSS cho nhiều trường hợp
- PurgeCSS tự động loại bỏ CSS không dùng
- Responsive design với breakpoint prefixes (md:, lg:)

**Ví dụ:** `className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md"`

#### 🛣️ React Router

**Vai trò:** Client-side routing cho SPA  
**Tác dụng:**

- Điều hướng giữa các trang không cần reload (workspace, chatbot details, admin)
- Protected routes với authentication check
- URL parameters để truyền data (chatbotId, conversationId)
- Nested routes cho layout phức tạp

**Ví dụ:** `/agent-details/:chatbotId` để xem chi tiết chatbot

#### 🔄 TanStack Query (React Query)

**Vai trò:** Quản lý server state và data fetching  
**Tác dụng:**

- Cache API responses tự động
- Tự động refetch khi data stale
- Optimistic updates cho UX tốt hơn
- Background sync và error retry
- Giảm boilerplate code cho API calls

**Lưu ý:** Hiện tại đã được setup nhưng chưa được sử dụng nhiều, có thể migrate từ axios trực tiếp sang TanStack Query

#### 📊 ApexCharts

**Vai trò:** Thư viện vẽ biểu đồ  
**Tác dụng:**

- Vẽ các biểu đồ analytics (line, bar, pie charts)
- Hiển thị thống kê chatbot performance, token usage
- Interactive charts với tooltips, zoom
- Responsive và đẹp mắt

**Ví dụ sử dụng:** Dashboard analytics cho chatbot creators và admins

#### 📝 TipTap

**Vai trò:** Rich text editor  
**Tác dụng:**

- Soạn thảo văn bản có format (bold, italic, headings)
- Hỗ trợ markdown
- Extensible với plugins (tables, images)
- Sử dụng ProseMirror engine

### Backend Technologies

#### ⚡ FastAPI

**Vai trò:** Web framework Python hiện đại, nhanh  
**Tác dụng:**

- Tạo REST API endpoints cho frontend
- Automatic API documentation (Swagger/OpenAPI)
- Async/await support cho performance tốt
- Type hints và validation tự động
- Dependency injection system

**Ví dụ:** API routes trong `backend/app/api/routes/` xử lý requests từ frontend

#### 🔍 Pydantic

**Vai trò:** Data validation và settings management  
**Tác dụng:**

- Validate dữ liệu đầu vào từ API requests
- Type checking tự động
- Settings management từ environment variables
- Serialization/deserialization JSON
- Error messages rõ ràng khi validation fail

**Ví dụ:** Models trong `backend/app/models_mongo.py` sử dụng Pydantic để validate

#### 💾 MongoDB

**Vai trò:** NoSQL database lưu trữ dữ liệu chính  
**Tác dụng:**

- Lưu trữ users, chatbots, conversations, documents
- Schema linh hoạt, dễ mở rộng
- Motor driver hỗ trợ async operations
- Aggregation pipeline cho queries phức tạp
- Replication và sharding cho scale

**Collections chính:**

- `users` - Thông tin người dùng
- `chatbots` - Thông tin chatbot
- `conversations` - Lịch sử hội thoại
- `documents` - Tài liệu đã upload
- `favorite_messages` - Tin nhắn yêu thích

#### 🤖 LightRAG

**Vai trò:** Framework RAG (Retrieval-Augmented Generation) chính  
**Tác dụng:**

- Xử lý documents và tạo knowledge base
- Trích xuất entities và relationships từ text
- Xây dựng knowledge graph
- Query với nhiều modes: local, global, hybrid, naive, mix
- Tích hợp với vector database và graph database

**Cách hoạt động:**

1. Upload document → Chunk text → Extract entities/relationships
2. Lưu vào vector DB (ChromaDB) và graph DB (Neo4j/NetworkX)
3. User query → Retrieve relevant context → Generate response với LLM

**Ví dụ:** Khi user hỏi chatbot, LightRAG tìm context liên quan từ knowledge base và tạo câu trả lời

#### 🔗 LangChain

**Vai trò:** Framework để xây dựng ứng dụng LLM  
**Tác dụng:**

- Kết nối với các LLM providers (OpenAI, Google)
- Document loaders để đọc nhiều format file
- Text splitters để chia nhỏ documents
- Chains để kết hợp nhiều LLM calls
- Memory để lưu conversation history

**Ví dụ:** Sử dụng trong `backend/app/helpers/LangchainLoader.py` để load documents

#### 🗄️ ChromaDB

**Vai trò:** Vector database lưu trữ embeddings  
**Tác dụng:**

- Lưu trữ vector embeddings của text chunks, entities, relationships
- Semantic search với cosine similarity
- HNSW index cho tìm kiếm nhanh
- Persistent storage trên disk
- Collection-based organization (mỗi chatbot một collection)

**Cách hoạt động:**

1. Text → Embedding model (OpenAI) → Vector
2. Lưu vector vào ChromaDB với metadata
3. Query → Embed query → Tìm top-k similar vectors
4. Trả về text chunks liên quan nhất

**Ví dụ:** Khi user hỏi "giá sản phẩm", ChromaDB tìm các chunks nói về giá cả

#### 🕸️ Neo4j

**Vai trò:** Graph database lưu trữ knowledge graph  
**Tác dụng:**

- Lưu trữ entities (nodes) và relationships (edges)
- Traverse graph để tìm connections
- Cypher query language mạnh mẽ
- Tìm subgraph liên quan đến query
- Visualize knowledge graph

**Cách hoạt động:**

1. Extract entities từ documents (Person, Product, Organization)
2. Extract relationships (Person WORKS_FOR Organization)
3. Lưu vào Neo4j như graph
4. Query → Tìm entities liên quan → Traverse relationships → Build context

**Ví dụ:** "Nguyễn Văn A làm việc tại công ty B" → Node: Nguyễn Văn A, Node: Công ty B, Edge: WORKS_FOR

#### 📄 Docling

**Vai trò:** Document processing library  
**Tác dụng:**

- Parse nhiều format: PDF, DOCX, PPTX, HTML
- Extract text, tables, images từ documents
- Giữ nguyên structure (headings, lists, tables)
- Convert sang markdown format
- Xử lý documents phức tạp (multi-column, tables)

**Ví dụ:** Upload PDF → Docling parse → Extract text và tables → Lưu vào knowledge base

#### 🔐 JWT (JSON Web Tokens)

**Vai trò:** Authentication mechanism  
**Tác dụng:**

- Stateless authentication (không cần lưu session trên server)
- Token chứa user info và permissions
- Secure với signature verification
- Expiration time tự động
- Dễ dàng cho microservices

**Flow:**

1. User login → Server verify credentials → Generate JWT
2. Client lưu JWT (localStorage/cookie)
3. Mỗi request gửi kèm JWT trong header
4. Server verify JWT → Cho phép/deny request

#### 📧 MJML

**Vai trò:** Email template framework  
**Tác dụng:**

- Viết email HTML responsive dễ dàng
- Tự động convert sang HTML tương thích nhiều email clients
- Component-based (mj-section, mj-column, mj-text)
- Email templates cho password recovery, notifications

**Ví dụ:** Templates trong `backend/app/email-templates/src/` cho password reset emails

## Key Features

- 🤖 **AI Chatbot Creation** - Build custom chatbots trained on your business content
- 📚 **Document Management** - Upload and process documents (PDF, DOCX, etc.) for knowledge base
- 💬 **Conversation Management** - Track and manage customer conversations
- ❓ **FAQ Management** - Create and manage frequently asked questions
- 📊 **Analytics Dashboard** - Monitor chatbot performance and usage statistics
- 👥 **Multi-role System** - Support for chatbot creators, users, and administrators
- ⭐ **Favorite Messages** - Save and manage favorite chatbot responses
- 💳 **Token-based Billing** - Flexible token bundle system for usage tracking
- 🔒 **Secure Authentication** - JWT-based authentication with role-based access control

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (for frontend development)
- [uv](https://docs.astral.sh/uv/) (for Python package management)

### Quick Start with Docker Compose

1. Clone the repository:

```bash
git clone <repository-url>
cd Erudition
```

2. Configure environment variables:

   - Copy `.env.example` files in both `backend/` and `frontend/` directories
   - Update the configuration values, especially:
     - `SECRET_KEY` - Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
     - `MONGODB_URL` - MongoDB connection string
     - `OPENAI_API_KEY` - For LLM and embeddings
     - Other API keys as needed

3. Start the development environment:

```bash
docker compose up -d
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development Setup

#### Backend Development

From `./backend/` directory:

1. Install dependencies:

```bash
uv sync
```

2. Activate virtual environment:

```bash
source .venv/bin/activate
```

3. Run the development server:

```bash
fastapi run --reload app/main.py
```

For more details, see [backend/README.md](./backend/README.md).

#### Frontend Development

From `./frontend/` directory:

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

The frontend will be available at http://localhost:5173 (Vite default port).

## Project Structure

```
Erudition/
├── backend/              # FastAPI backend application
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Core configuration
│   │   ├── models_mongo.py  # MongoDB models
│   │   ├── services/     # Business logic
│   │   ├── LightRAG/     # RAG implementation
│   │   └── helpers/      # Utility functions
│   └── pyproject.toml    # Python dependencies
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── styles/      # Styling files
│   └── package.json      # Node dependencies
└── docker-compose.yml    # Docker configuration
```

## Configuration

### Environment Variables

Key environment variables to configure:

**Backend (.env):**

- `SECRET_KEY` - Secret key for JWT tokens
- `MONGODB_URL` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key for LLM
- `FIRST_SUPERUSER_EMAIL` - Admin user email
- `FIRST_SUPERUSER_PASSWORD` - Admin user password

**Frontend (.env):**

- `VITE_API_URL` - Backend API URL
- `VITE_WS_API_URL` - WebSocket API URL

## Testing

### Backend Tests

Run backend tests:

```bash
cd backend
bash ./scripts/test.sh
```

### Frontend Tests

Run frontend tests:

```bash
cd frontend
npm test
```

## Deployment

For production deployment instructions, see [deployment.md](./deployment.md).

## Development

For detailed development guidelines, see [development.md](./development.md).

## License

This project is licensed under the MIT license.
