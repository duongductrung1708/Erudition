import asyncio
import re
import uuid

from app.helpers.LightRagHelper import EruLightRag


async def initialize_rag():
    chatbot_id = uuid.UUID("cd0b12b4-a3b7-4fd5-9ce5-28e2a8b1211a")
    rag_instance = EruLightRag(chatbot_id)
    docs_in_doc_status_storage = rag_instance.get_docs(where={"db_obj_id": "adf94c85-0ddc-4c23-91b4-d662773c8c78"})
    full_doc_id = next(iter(docs_in_doc_status_storage))
    return full_doc_id

import re


def get_header_level(text):
    regex = r"^(#+)\s"
    match = re.match(regex, text)
    if match:
        num_hashes = len(match.group(1))
        return num_hashes
    return 0


def get_split_data(header, content):
    return {
        "header": header,
        "content": content
    }


def split_markdown_by_table_and_p(text):
    regex_table = r"(?:\|[^\n]*\|\r?\n)+\|?(?:[-:]+(?:\|[-:]+)+)\|\r?\n(?:\|[^\n]*\|(?:\r?\n|$))*"
    # Dùng re.finditer() để tìm tất cả bảng Markdown
    tables = [match.group(0) for match in re.finditer(regex_table, text)]

    # Thay thế bảng bằng placeholder
    placeholder = "<<<TABLE>>>"
    text_without_tables = re.sub(regex_table, placeholder, text)

    # Chia theo xuống dòng
    parts = text_without_tables.split("\n")

    # Ghép lại, thay thế placeholder bằng bảng Markdown
    result = []
    table_index = 0
    for part in parts:
        if placeholder in part:
            result.append(tables[table_index])
            table_index += 1
        elif part.strip():  # Loại bỏ dòng trống không cần thiết
            result.append(part)

    return result

def main():
    # Initialize RAG instance
    data = """
    # Trường Đại học FPT thông báo phương thức tuyển sinh hệ đại học chính quy năm 2025 như sau: 

## I. Phương thức tuyển sinh

### Trường tuyển sinh theo 4 phương thức sau:

#### 1. Xét kết quả xếp hạng học sinh THPT

Đạt xếp hạng Top50 năm 2025 theo điểm học bạ lớp 11 và học kỳ 1 lớp 12 (chứng nhận thực hiện trên trang http://SchoolRank.fpt.edu.vn) với điều kiện điểm Toán + điểm 2 môn bất kỳ của học kỳ 2 năm lớp 12 đạt từ 21 điểm trở lên.

#### 2. Xét tuyển thẳng

##### 2.1. Thí sinh thuộc diện được xét tuyển thẳng trong Quy chế tuyển sinh đại học, tuyển sinh cao đẳng ngành Giáo dục Mầm non của Bộ GD&amp;ĐT.

##### 2.2. Có một trong những chứng chỉ sau được tuyển thẳng vào các ngành ngôn ngữ tương ứng:

- Chứng chỉ tiếng Anh TOEFL iBT từ 80 hoặc IELTS (Học thuật) từ 6.0 hoặc VSTEP bậc 4 hoặc quy đổi tương đương trở lên cho ngành Ngôn ngữ Anh;
- Chứng chỉ tiếng Nhật JLPT từ N3 trở lên cho ngành Ngôn ngữ Nhật.
- Chứng chỉ tiếng Hàn TOPIK cấp độ 4 trở lên trong kỳ thi TOPIK II cho ngành Ngôn ngữ Hàn Quốc;
- Chứng chỉ tiếng Trung HSK từ cấp độ 4 trở lên cho ngành Ngôn ngữ Trung Quốc.

##### 2.3. Tốt nghiệp phổ thông với văn bằng do nước ngoài cấp.

##### 2.4. Tốt nghiệp một trong các chương trình sau:

- Chương trình APTECH HDSE/ADSE (đối với ngành Công nghệ thông tin);
- Chương trình ARENA ADIM (đối với chuyên ngành Thiết kế Mỹ thuật số);
- Chương trình BTEC HND;
- FUNiX Software Engineering;
- Chương trình Melbourne Polytechnic;
- Cao đẳng FPT Polytechnic;
- Học sinh FPT School tốt nghiệp THPT.

##### 2.5. Tốt nghiệp đại học.

##### 2.6. Sinh viên chuyển từ các trường đại học có xếp hạng gần nhất thuộc Top 1000 trong 3 bảng xếp hạng: QS, ARWU và THE hoặc các trường đạt chứng nhận QS Star 5 sao về chất lượng đào tạo.

### 3. Dựa vào kết quả kỳ thi đánh giá năng lực của Đại học Quốc gia Hà Nội và Đại học Quốc gia TPHCM

Điểm trúng tuyển sẽ công bố cụ thể sau khi có kết quả của các kỳ thi này.

### 4. Xét kết quả thi tốt nghiệp THPT năm 2025

### Xét kết quả thi tốt nghiệp THPT năm 2025 theo tổ hợp: [Điểm Toán * 2 + điểm hai môn bất kì]. Điểm trúng tuyển sẽ công bố cụ thể sau khi có kết quả thi tốt nghiệp THPT năm 2025.

## II. Ngành đào tạo

| Ngành                  | Chuyên ngành                                           |
|------------------------|--------------------------------------------------------|
| Công nghệ thông tin    | An toàn thông tin                                      |
| Công nghệ thông tin    | Công nghệ ô tô số                                      |
| Công nghệ thông tin    | Hệ thống thông tin                                     |
| Công nghệ thông tin    | Kỹ thuật phần mềm                                      |
| Công nghệ thông tin    | Thiết kế mỹ thuật số                                   |
| Công nghệ thông tin    | Thiết kế vi mạch bán dẫn                               |
| Công nghệ thông tin    | Trí tuệ nhân tạo                                       |
| Công nghệ truyền thông | Quan hệ công chúng                                     |
| Công nghệ truyền thông | Truyền thông đa phương tiện                            |
| Luật                   | Luật kinh tế                                           |
| Luật                   | Luật thương mại quốc tế                                |
| Quản trị kinh doanh    | Công nghệ tài chính (Fintech)                          |
| Quản trị kinh doanh    | Digital Marketing                                      |
| Quản trị kinh doanh    | Kinh doanh quốc tế                                     |
| Quản trị kinh doanh    | Logistics & quản lý chuỗi cung ứng                     |
| Quản trị kinh doanh    | Quản trị dịch vụ du lịch & lữ hành                     |
| Quản trị kinh doanh    | Quản trị khách sạn                                     |
| Quản trị kinh doanh    | Tài chính doanh nghiệp                                 |
| Quản trị kinh doanh    | Ngân hàng số – Tài chính (Digital Banking and Finance) |
| Quản trị kinh doanh    | Tài chính đầu tư                                       |
| Ngôn ngữ Anh           | Ngôn ngữ Anh                                           |
| Ngôn ngữ Hàn Quốc      | Song ngữ Hàn – Anh                                     |
| Ngôn ngữ Nhật          | Song ngữ Nhật – Anh                                    |
| Ngôn ngữ Trung Quốc    | Song ngữ Trung – Anh                                   |
    """

    def extract_markdown_table(text):
        regex_table = r"(?:\|[^\n]*\|\r?\n)+\|?(?:[-:]+(?:\|[-:]+)+)\|\r?\n(?:\|[^\n]*\|(?:\r?\n|$))*"
        # Dùng re.finditer() để tìm tất cả bảng Markdown
        tables = [match.group(0) for match in re.finditer(regex_table, text)]

        # Thay thế bảng bằng placeholder
        placeholder = "<<<TABLE>>>"
        text_without_tables = re.sub(regex_table, placeholder, text)
        return {
            "text": text_without_tables,
            "tables": tables
        }

    # Chia theo xuống dòng
    table_extracted_data = extract_markdown_table(data)
    content_without_table = table_extracted_data["text"]
    statements = [text.strip() for text in content_without_table.split("\n") if text]
    result = []
    header_stack = []
    current_content = []

    for text in statements:
        current_header_level = get_header_level(text)

        if current_header_level > 0:  # Nếu là header
            # Nếu có header trước đó nhưng không có content, ta vẫn lưu lại header cũ
            if current_content or (header_stack and get_header_level(header_stack[-1]) >= current_header_level):
                result.append(get_split_data(
                    "\n\n".join(header_stack),
                    "\n".join(current_content) if current_content else ""  # Cho phép content rỗng
                ))
                current_content = []

            # Cập nhật header stack
            while header_stack and get_header_level(header_stack[-1]) >= current_header_level:
                header_stack.pop()

            header_stack.append(text)

        else:  # Nếu không phải header, thêm vào content
            current_content.append(text)

    # Xử lý nội dung còn lại
    if header_stack:
        result.append(get_split_data(
            " ".join(header_stack),
            "\n".join(current_content) if current_content else ""
        ))

    pass


if __name__ == "__main__":
    main()
