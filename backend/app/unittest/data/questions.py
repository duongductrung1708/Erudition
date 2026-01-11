import asyncio
import uuid
from typing import List, Dict, Any

from sqlmodel import Session

from app.core.db import engine
from app.db_context.PostgreSqlContext import postgres_context
from app.models import Chatbot
from app.services.ChatbotServices import ChatbotServices


async def process_questions_concurrently(
        questions_list: List[str],
        chatbot_model: Chatbot,
        user_id: uuid.UUID
) -> List[Dict[str, Any]]:
    """
    Process multiple questions concurrently using lightrag_query

    Args:
        questions_list: List of prompts/questions to process
        chatbot_model: Chatbot model instance
        user_id: User ID

    Returns:
        List of results for each prompt
    """
    # Create tasks for each question
    tasks = [
        single_task_lightrag_query(
            prompt=question,
            chatbot_model=chatbot_model,
            user_id=user_id
        )
        for question in questions_list
    ]

    # Execute all tasks concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Process and return results
    processed_results = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"Error processing question '{questions_list[i]}': {result}")
            processed_results.append({
                "prompt": questions_list[i],
                "status": "error",
                "error": str(result)
            })
        else:
            processed_results.append({
                "prompt": questions_list[i],
                "status": "success",
                "result": result
            })

    return processed_results


async def single_task_lightrag_query(
        prompt: str,
        chatbot_model: Chatbot,
        user_id: uuid.UUID
):
    with Session(engine) as session:
        full = ""
        async for part in ChatbotServices.lightrag_query(
            prompt=prompt,
            chatbot_model=chatbot_model,
            user_id=user_id,
            session=session,
            conversation_id=uuid.uuid4()
        ):
            full += part
        return full

# Example usage
async def main():
    # Your existing code
    chatbot_id_strs = ["cd0b12b4-a3b7-4fd5-9ce5-28e2a8b1211a"]
    user_id_str = "813f5df5-737b-480e-a1ac-3c5451e5a7c2"
    all_questions = """Hồ sơ đăng ký tuyển sinh Đại học FPT gồm những gì?
Trường hợp nào cần nộp giấy chứng nhận xếp hạng học sinh THPT?
Thí sinh nộp hồ sơ xét tuyển theo điểm thi tốt nghiệp THPT cần bổ sung giấy tờ gì?
Lệ phí dịch vụ tuyển sinh của Đại học FPT là bao nhiêu?
Khi nào hồ sơ đăng ký tuyển sinh được xem là hợp lệ?
Thí sinh có thể nộp tiền dịch vụ tuyển sinh bằng cách nào?
Trường Đại học FPT sử dụng ngân hàng nào để nhận tiền tuyển sinh?
Thí sinh cần ghi nội dung gì khi chuyển khoản tiền dịch vụ tuyển sinh?
Thí sinh ở TP. Hồ Chí Minh nên chuyển tiền vào tài khoản nào?
Thí sinh có thể nộp hồ sơ tuyển sinh trực tuyến không?
Nếu quên nộp lệ phí tuyển sinh, hồ sơ có được chấp nhận không?
Thí sinh có thể nộp hồ sơ trực tiếp tại trường không?
Nếu bị mất giấy chứng nhận kết quả thi tốt nghiệp THPT, có thể nộp hồ sơ không?
Trường hợp nào được miễn lệ phí tuyển sinh?
Sau khi nộp hồ sơ, bao lâu thí sinh sẽ nhận được thông báo xét tuyển?
Nếu hồ sơ thiếu giấy tờ, thí sinh có thể bổ sung sau không?
Nếu đã nộp hồ sơ mà muốn thay đổi phương thức xét tuyển, có được không?
Có thể rút hồ sơ sau khi đã nộp không?
Nếu hồ sơ bị từ chối, thí sinh có thể nộp lại không?
Có thể nộp hồ sơ tại bất kỳ cơ sở nào của Đại học FPT không?
Nếu chưa có học bạ THPT bản chính, có thể nộp bản sao không?
Nếu xét tuyển bằng học bạ nhưng chưa có giấy chứng nhận SchoolRank, có được nộp hồ sơ không?
Nếu nộp hồ sơ trực tuyến, có cần gửi bản cứng qua bưu điện không?
Nếu thí sinh đã trúng tuyển nhưng không nhập học, hồ sơ có được bảo lưu không?
Nếu thí sinh chưa có CMND/CCCD thì có thể sử dụng giấy tờ nào thay thế?
Trường hợp nào cần nộp giấy chứng nhận điều kiện đăng ký xét tuyển thẳng?
Nếu xét tuyển bằng học bạ, có yêu cầu điểm tối thiểu không?
Có cần công chứng các giấy tờ trong hồ sơ không?
Nếu mất học bạ THPT, có thể nộp hồ sơ xét tuyển không?
Nếu nộp hồ sơ trực tiếp, cần đến đâu?
Hồ sơ nộp qua bưu điện có được chấp nhận không?
Hồ sơ có thể do người thân nộp thay không?
Có thể chỉnh sửa thông tin trong hồ sơ sau khi đã nộp không?
Nếu quên thanh toán phí dịch vụ tuyển sinh, hồ sơ có hợp lệ không?
Nếu chuyển khoản nhầm số tiền, có thể hoàn lại không?
Nếu nhập sai nội dung chuyển khoản, có ảnh hưởng đến việc xét tuyển không?
Nếu không có tài khoản ngân hàng, có thể nộp tiền bằng cách nào?
Trường có xác nhận khi nhận được tiền dịch vụ tuyển sinh không?
Thời gian xử lý hồ sơ tuyển sinh là bao lâu?
Nếu hồ sơ bị thiếu giấy tờ, trường có thông báo cho thí sinh không?
Nếu trúng tuyển nhưng muốn thay đổi ngành học, có được khôn
Nếu không trúng tuyển, trường có hoàn trả phí dịch vụ tuyển sinh không?
Nếu có sai sót trong hồ sơ, thí sinh có thể chỉnh sửa không?
Nếu thí sinh đăng ký xét tuyển ở nhiều phương thức khác nhau, có cần nộp nhiều bộ hồ sơ khôn
Nếu đã trúng tuyển theo phương thức xét tuyển học bạ, có thể đổi sang xét tuyển bằng điểm thi tốt nghiệp THPT không?
Trường hợp nào thí sinh có thể bị từ chối hồ sơ tuyển sinh?
Nếu thí sinh có thắc mắc về hồ sơ, có thể liên hệ trường bằng cách nào?
Trường có hỗ trợ làm hồ sơ xét tuyển không?
Trường Đại học FPT cấp bao nhiêu suất học bổng trong năm 2025?
Học bổng Giáo sư Nguyễn Văn Đạo được trao cho đối tượng nào?
Sinh viên học tại các campus nào được hưởng ưu đãi học phí?
Học bổng có áp dụng cho tất cả các ngành học không?
Nếu sinh viên nghỉ học giữa chừng, học bổng có còn hiệu lực không?
Học bổng Chuyên gia toàn cầu có những quyền lợi gì?
Học bổng Chuyên gia toàn cầu dành cho ai?
Sinh viên nhận Học bổng Chuyên gia toàn cầu có cơ hội làm việc ở đâu?
Học bổng Học đường có bao nhiêu suất?
Điều kiện nhận Học bổng Học đường là gì?
Học bổng Toàn phần có bao nhiêu suất?
Điều kiện để nhận Học bổng Toàn phần là gì?
Học bổng 2 năm có bao nhiêu suất?
Điều kiện nhận Học bổng 2 năm là gì?
Học bổng 1 năm có bao nhiêu suất?
Điều kiện nhận Học bổng 1 năm là gì?
Sinh viên cần duy trì điểm số bao nhiêu để giữ học bổng?
Nếu sinh viên không đạt điểm yêu cầu, học bổng có bị thu hồi không?
Trường có ưu tiên cấp học bổng theo thời gian đăng ký không?
Bao nhiêu sinh viên được hỗ trợ chương trình Học trước – Trả sau năm 2025?
Chương trình Học trước – Trả sau dành cho ai?
Điều kiện xét duyệt chương trình Học trước – Trả sau là gì?
Các mức hỗ trợ học phí trong chương trình Học trước – Trả sau là gì?
Lãi suất áp dụng cho chương trình Học trước – Trả sau là bao nhiêu?
Sinh viên cần hoàn trả học phí trong bao lâu?
Sinh viên có thể trả học phí trước thời hạn không?
Học phí của Đại học FPT có thay đổi trong quá trình học không?
Học phí đã bao gồm những khoản gì?
Học phí có khác nhau giữa các cơ sở không?
Sinh viên có kết quả học tập tốt được hưởng những ưu đãi gì?
Sinh viên có cơ hội học tập tại nước ngoài không?
Trường có hỗ trợ nghiên cứu khoa học không?
Sinh viên có thể nhận thưởng bài báo khoa học không?
Nếu sinh viên muốn khởi nghiệp, trường có hỗ trợ không?
Trường có chính sách miễn giảm học phí cho anh/chị em ruột cùng theo học không?
Nếu sinh viên nhận học bổng nhưng bảo lưu kết quả học tập thì học bổng có còn hiệu lực không?
Học bổng có thể chuyển nhượng cho người khác không?
Nếu sinh viên đạt nhiều điều kiện học bổng khác nhau, có thể nhận nhiều học bổng cùng lúc không?
Học bổng có áp dụng cho sinh viên quốc tế không?
Nếu sinh viên tham gia chương trình Học trước – Trả sau nhưng sau đó không đủ khả năng hoàn trả thì sao?
Khi nào sinh viên phải bắt đầu hoàn trả học phí theo chương trình Học trước – Trả sau?
Nếu sinh viên chưa có việc làm sau khi tốt nghiệp, có được gia hạn thời gian trả học phí không?
Sinh viên có thể thanh toán học phí theo từng kỳ không?
Nếu sinh viên rút hồ sơ trước khi nhập học, học phí đã đóng có được hoàn lại không?
Học phí có bao gồm phí nội trú không?
Nếu sinh viên bị đình chỉ học tập, học phí đã đóng có được bảo lưu không?
Trường có chính sách giảm học phí cho sinh viên có hoàn cảnh khó khăn không?
Nếu sinh viên có thành tích xuất sắc, có được hỗ trợ thêm ngoài học bổng không?
Sinh viên có thể tham gia chương trình trao đổi quốc tế không?
Nếu sinh viên có dự án khởi nghiệp, làm thế nào để nhận hỗ trợ từ trường?
Hồ sơ đăng ký học bổng bao gồm những gì?
Phí dịch vụ đăng ký học bổng là bao nhiêu?
Số tiền giữ chỗ học bổng là bao nhiêu?
Khoản tiền giữ chỗ học bổng được hoàn lại như thế nào?
Có thể nộp tiền đăng ký học bổng bằng cách nào?
Trường Đại học FPT sử dụng ngân hàng nào để nhận tiền nộp học bổng?
Thí sinh cần ghi nội dung gì khi nộp tiền giữ chỗ học bổng?
Nếu đăng ký tham gia chương trình học bổng, thí sinh cần ghi nội dung nộp tiền như thế nào?
Ngoài hồ sơ tuyển sinh, thí sinh cần nộp thêm giấy tờ gì khi đăng ký chương trình Học trước – Trả sau?
Thí sinh cần truy cập trang nào để lấy giấy chứng nhận xếp hạng học sinh THPT?
Chương trình Học trước – Trả sau dành cho đối tượng nào?
Học bổng của Trường Đại học FPT có dành cho sinh viên quốc tế không?
Thí sinh có cần đạt điểm học bạ cao để đăng ký học bổng không?
Khi nào thí sinh được thông báo kết quả xét học bổng?
Nếu không đạt học bổng, thí sinh có được hoàn lại tiền đăng ký không?
Tiền giữ chỗ học bổng có bắt buộc nộp không?
Có thể chuyển suất học bổng cho người khác không?
Nếu đã trúng tuyển nhưng không nhập học, học bổng có còn giá trị không?
Học bổng có thể sử dụng để giảm học phí không?
Trường hợp nào thí sinh có thể bị hủy học bổng?
Thí sinh đã tốt nghiệp THPT từ các năm trước có thể đăng ký học bổng không?
Có thể nộp hồ sơ đăng ký học bổng online không?
Học bổng của Đại học FPT có giới hạn số lượng không?
Nếu chưa có chứng chỉ ngoại ngữ, thí sinh có thể đăng ký học bổng không?
Học bổng có thể kết hợp với các chương trình hỗ trợ tài chính khác không?
Thí sinh có thể đăng ký nhiều loại học bổng cùng lúc không?
Nếu thí sinh đã nhận học bổng nhưng muốn đổi sang học bổng khác có được không?
Học bổng có áp dụng cho sinh viên đang học tại Đại học FPT không?
Học bổng có áp dụng cho chương trình liên kết quốc tế không?
Sinh viên có thể mất học bổng sau khi nhập học không?
Có yêu cầu về thời gian học để duy trì học bổng không?
Nếu thí sinh bảo lưu kết quả học tập, học bổng có còn hiệu lực không?
Học bổng có áp dụng cho tất cả ngành học tại Đại học FPT không?
Nếu học sinh đạt đủ điều kiện nhưng không đăng ký học bổng đúng hạn thì có được xét học bổng không?
Học bổng có giá trị trong suốt khóa học không?
Sinh viên tham gia chương trình Học trước – Trả sau có bị tính lãi suất không?
Thời gian trả sau kéo dài bao lâu?
Nếu sinh viên không hoàn thành chương trình học, có phải hoàn trả học phí không?
Chương trình Học trước – Trả sau có áp dụng cho mọi ngành học không?
Nếu sinh viên rút khỏi chương trình Học trước – Trả sau, học phí đã sử dụng có được miễn không?
Nếu sinh viên muốn trả trước một phần học phí thì có được không?
Nếu sinh viên có việc làm trước khi tốt nghiệp, có thể trả sớm không?
Chương trình Học trước – Trả sau có yêu cầu bảo lãnh tài chính không?
Chương trình có giới hạn số lượng sinh viên tham gia không?
Sinh viên có thể kết hợp chương trình Học trước – Trả sau với học bổng không?
Khi nào có thông báo danh sách thí sinh nhận học bổng?
Thí sinh có thể chỉnh sửa hồ sơ đăng ký học bổng sau khi nộp không?
Thí sinh có thể nộp hồ sơ đăng ký học bổng trực tiếp tại trường không?
Nếu bị mất giấy báo trúng tuyển học bổng, thí sinh có thể xin cấp lại không?
Nếu trúng tuyển học bổng nhưng không nhập học đúng hạn, học bổng có còn hiệu lực không?
Điều kiện xét tuyển theo phương thức xếp hạng học sinh THPT là gì?
Những thí sinh nào được xét tuyển thẳng?
Chứng chỉ tiếng Anh nào giúp xét tuyển thẳng vào ngành Ngôn ngữ Anh?
Chứng chỉ JLPT tối thiểu nào giúp xét tuyển thẳng vào ngành Ngôn ngữ Nhật?
Chứng chỉ TOPIK tối thiểu nào giúp xét tuyển thẳng vào ngành Ngôn ngữ Hàn?
Chứng chỉ HSK tối thiểu nào giúp xét tuyển thẳng vào ngành Ngôn ngữ Trung Quốc?
Những chương trình đào tạo nào giúp xét tuyển thẳng vào Đại học FPT?
Sinh viên chuyển trường từ đại học nào được xét tuyển thẳng?
Sinh viên tốt nghiệp đại học có được xét tuyển thẳng không?
Sinh viên tốt nghiệp THPT với văn bằng nước ngoài có được xét tuyển thẳng không?
Những kỳ thi đánh giá năng lực nào được dùng để xét tuyển vào Đại học FPT?
Công thức tính điểm xét tuyển theo phương thức xét điểm thi THPT?
Ngành Công nghệ thông tin có những chuyên ngành nào?
Chuyên ngành nào liên quan đến bảo mật dữ liệu?
Chuyên ngành nào đào tạo về trí tuệ nhân tạo?
Chuyên ngành nào liên quan đến thiết kế vi mạch?
Ngành Công nghệ truyền thông có những chuyên ngành nào?
Chuyên ngành nào phù hợp với người muốn làm trong ngành quảng cáo, báo chí?
Chuyên ngành nào liên quan đến truyền thông số, dựng phim?
Ngành Luật có những chuyên ngành nào?
Chuyên ngành nào liên quan đến pháp luật doanh nghiệp?
Ngành Quản trị kinh doanh có những chuyên ngành nào?
Chuyên ngành nào đào tạo về Marketing số?
Chuyên ngành nào phù hợp với người muốn làm trong ngành du lịch?
Chuyên ngành nào liên quan đến Fintech?
Ngành Ngôn ngữ Anh có chuyên ngành nào?
Ngành Ngôn ngữ Hàn Quốc có chuyên ngành nào?
Ngành Ngôn ngữ Nhật có chuyên ngành nào?
Ngành Ngôn ngữ Trung Quốc có chuyên ngành nào?
Điểm học bạ lớp 11 có được tính vào xét tuyển không?
Thí sinh có thể kiểm tra xếp hạng học sinh THPT ở đâu?
Tổng điểm bao nhiêu thì đủ điều kiện xét tuyển theo phương thức xếp hạng THPT?
Có thể xét tuyển bằng chứng chỉ SAT không?
Khi nào thí sinh biết kết quả xét tuyển?
Nếu đã tốt nghiệp đại học, có cần xét điểm thi THPT không?
Có giới hạn độ tuổi khi xét tuyển thẳng không?
Chương trình Melbourne Polytechnic có giúp xét tuyển thẳng không?
Đạt TOEFL iBT 79 có được xét tuyển thẳng ngành Ngôn ngữ Anh không?
Nếu đã có chứng chỉ ngoại ngữ, có cần xét học bạ không?
Ngành Công nghệ thông tin có chuyên ngành nào về bảo mật?
Chuyên ngành Kỹ thuật phần mềm đào tạo về gì?
Ngành Công nghệ truyền thông có bao nhiêu chuyên ngành?
Nếu muốn học về tài chính đầu tư, nên chọn ngành nào?
Ngành Luật của Đại học FPT có mấy chuyên ngành?
Chuyên ngành nào trong Quản trị kinh doanh liên quan đến công nghệ tài chính?
Sinh viên ngành Ngôn ngữ Nhật có thể học song ngữ với ngôn ngữ nào?
Học ngành Ngôn ngữ Trung Quốc có thể học song ngữ với ngôn ngữ nào?
Ngành nào đào tạo về chuỗi cung ứng?
Chuyên ngành nào phù hợp với người muốn làm về ngân hàng số?
Đại học FPT có sử dụng điểm thi đánh giá tư duy không?
Có thể dùng điểm thi Đánh giá năng lực của Đại học Quốc gia TP.HCM để xét tuyển không?
Điểm thi Đánh giá năng lực của ĐHQG Hà Nội có được chấp nhận không?
Nếu rớt xét tuyển theo học bạ, có thể xét tuyển bằng phương thức nào khác?
Điểm thi tốt nghiệp THPT có được nhân hệ số không?"""
    questions_list = all_questions.split("\n")
    qc = len(questions_list)
    for c in chatbot_id_strs:
        chatbot_id = uuid.UUID(c)
        with Session(engine) as session:
            chatbot_model = postgres_context.get_by_id(session, Chatbot, chatbot_id)
        user_id = uuid.UUID(user_id_str)
        print(f"\n\n\nStart questioning chatbot: {chatbot_model.name}\nQuestions count: {qc}\n\n\n")
        for index, prompt in enumerate(questions_list):
            print(f"\n\n\nProcessing question {index + 1}/{qc}\n")
            await single_task_lightrag_query(prompt, chatbot_model, user_id)



if __name__ == "__main__":
    asyncio.run(main())