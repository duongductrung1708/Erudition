import asyncio
import re
import time
from collections import defaultdict
from fastapi import UploadFile
from langchain.schema import AIMessage, HumanMessage
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LCDocument

from app.db_context.ChromaDbContext import ChromaDbContext
from app.db_context.Neo4jContext import Neo4jContext
from app.helpers.DoclingLoader import DoclingLoader
from app.helpers.LangchainLoader import LangchainLoader
from app.models_mongo import Document as DocumentModel
from app.prompts import PROMPTS
from app.utils import compute_mdhash_id, clean_str, is_float_regex
from app.utils import split_string_by_multi_markers
from app.utils_package.DataUtils import DataUtils
from app.utils_package.LLMUtils import LLMUtils


class DocumentHelper:
    @staticmethod
    async def load_and_split(file: UploadFile, document_model: DocumentModel, loader_method: str,
                             chunk_size: int = 1000, overlap_size: int = 0):
        docs = await DocumentHelper().load(file=file, document_model=document_model, loader_method=loader_method)
        return DocumentHelper().split(docs, chunk_size=chunk_size, overlap_size=overlap_size, db_obj=document_model)

    @staticmethod
    async def load(file: UploadFile, document_model: DocumentModel, loader_method: str) -> list[LCDocument]:
        documents = []
        if loader_method == "langchain":
            documents = await LangchainLoader.load(file=file, document_model=document_model)
        elif loader_method == "docling":
            doc_loader = await DoclingLoader.create(file=file, document_model=document_model)
            documents = doc_loader.load()

        return documents

    @staticmethod
    def split(
            documents,
            db_obj: DocumentModel,
            chunk_size: int = 1000,
            overlap_size: int = 0,
    ) -> list[LCDocument]:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap_size
        )
        split_docs = splitter.split_documents(documents)
        index = 0
        for doc in split_docs:
            doc.page_content = DataUtils.clean_text(doc.page_content)
            doc.metadata["chunk_index"] = index
            doc.metadata["tag"] = "content"
            doc.metadata["document_id"] = str(db_obj.id)
            doc.metadata["document_title"] = str(db_obj.document_title)
            doc.id = compute_mdhash_id(prefix="doc-", content=(str(db_obj.chatbot_id) + doc.page_content + str(index)))
            index = index + 1
        return split_docs

    @staticmethod
    async def entity_extraction(splits: list[LCDocument], llm_utils: LLMUtils, db_obj: DocumentModel,
                                entity_extract_max_gleaning):
        language = PROMPTS["DEFAULT_LANGUAGE"]
        entity_types = PROMPTS["DEFAULT_ENTITY_TYPES"]
        example_number = None
        if example_number and example_number < len(PROMPTS["entity_extraction_examples"]):
            examples = "\n".join(
                PROMPTS["entity_extraction_examples"][: int(example_number)]
            )
        else:
            examples = "\n".join(PROMPTS["entity_extraction_examples"])
        context_base = dict(
            tuple_delimiter=PROMPTS["DEFAULT_TUPLE_DELIMITER"],
            record_delimiter=PROMPTS["DEFAULT_RECORD_DELIMITER"],
            completion_delimiter=PROMPTS["DEFAULT_COMPLETION_DELIMITER"],
            entity_types=",".join(entity_types),
            examples=examples,
            language=language,
        )
        semaphore = asyncio.Semaphore(50)

        async def sem_task(item, max_retries=3, delay_seconds=61):
            attempt = 0
            while attempt < max_retries:
                try:
                    async with semaphore:
                        return await _process_single_content(
                            item=item,
                            db_obj=db_obj,
                            llm_utils=llm_utils,
                            context_base=context_base,
                            entity_extract_max_gleaning=entity_extract_max_gleaning,
                        )
                except Exception as e:
                    attempt += 1
                    print(
                        f"\nTask failed on attempt {attempt} for item {item.id}.\n## Retrying in {delay_seconds} seconds... \nError: {e}")
                    if attempt >= max_retries:
                        print(f"\nMax retries reached for item {item}. Skipping...")
                        return None  # hoặc raise e nếu muốn fail hẳn luôn
                    await asyncio.sleep(delay_seconds)

        # Tạo danh sách task
        tasks = [sem_task(item) for item in splits]
        results = await asyncio.gather(*tasks)
        # Further processing of the results
        maybe_nodes = defaultdict(list)
        maybe_edges = defaultdict(list)
        for m_nodes, m_edges in results:
            for k, v in m_nodes.items():
                maybe_nodes[k].extend(v)
            for k, v in m_edges.items():
                maybe_edges[tuple(sorted(k))].extend(v)
        return maybe_nodes, maybe_edges

    @staticmethod
    async def graph_knowledge_store(neo4j_client: Neo4jContext, db_obj: DocumentModel, entity_extraction_result):
        maybe_nodes, maybe_edges = entity_extraction_result
        semaphore = asyncio.Semaphore(200)

        async def retry_with_delay(func, *args, max_retries=3, retry_delay=1, **kwargs):
            """Retry async function with delay on failure."""
            for attempt in range(1, max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries:
                        print(f"❌ Failed after {max_retries} attempts: {func.__name__}, args: {args}, error: {e}")
                        raise
                    else:
                        print(f"⚠️ Retry {attempt}/{max_retries} for {func.__name__} due to: {e}")
                        await asyncio.sleep(retry_delay)

        async def sem_node_task(k, v):
            async with semaphore:
                return await retry_with_delay(
                    func=neo4j_client._merge_nodes_then_upsert,
                    name=k,
                    nodes_data=v,
                    doc_id=db_obj.id,
                    chatbot_id=db_obj.chatbot_id,
                )

        async def sem_edge_task(source, target, v):
            async with semaphore:
                return await retry_with_delay(
                    func=neo4j_client._merge_edges_then_upsert,
                    source=source,
                    target=target,
                    edges_data=v,
                    chatbot_id=db_obj.chatbot_id,
                )

        node_tasks = []
        if maybe_nodes:
            node_tasks = [
                asyncio.create_task(sem_node_task(k, v))
                for k, v in maybe_nodes.items()
            ]

        edge_tasks = []
        if maybe_edges:
            edge_tasks = [
                asyncio.create_task(sem_edge_task(k[0], k[1], v))
                for k, v in maybe_edges.items()
            ]

        all_entities_data = await asyncio.gather(*node_tasks)
        all_relationships_data = await asyncio.gather(*edge_tasks)

        return all_entities_data, all_relationships_data

    @staticmethod
    async def entity_vc_store(graph_knowledge_store_result, chroma_db: ChromaDbContext):
        all_entities_data, all_relationships_data = graph_knowledge_store_result
        print(f"Received {len(all_entities_data)} entities and {len(all_relationships_data)} relationships")
        data_for_vdb = [
            LCDocument(
                id=compute_mdhash_id(dp["chatbot_id"] + dp["name"], prefix="ent-"),
                page_content=f"{dp['name']}\n{dp['description']}",
                metadata={
                    "name": dp["name"],
                    "type": dp["type"],
                    "sources": dp["sources"],
                    "created_at": time.time(),
                    "tag": "entity"
                }
            )
            for dp in all_entities_data
        ]
        await chroma_db.collection.aadd_documents(documents=data_for_vdb)
        data_for_vdb = [
            LCDocument(
                id=compute_mdhash_id(dp["chatbot_id"] + dp["source"] + dp["target"], prefix="rel-"),
                page_content=f"{dp['source']}\t{dp['target']}\n{dp['keywords']}\n{dp['description']}",
                metadata={
                    "source": dp["source"],
                    "target": dp["target"],
                    "keywords": dp["keywords"],
                    "sources": dp["sources"],
                    "created_at": dp.get("metadata", {}).get("created_at", time.time()),
                    "tag": "relation"
                }
            )
            for dp in all_relationships_data
        ]
        await chroma_db.collection.aadd_documents(documents=data_for_vdb)


async def _process_single_content(item, db_obj: DocumentModel, llm_utils: LLMUtils, context_base,
                                  entity_extract_max_gleaning):
    item.metadata.update({
        "title": db_obj.document_title,
        "document_id": str(db_obj.id),
        "tag": "content"
    })
    final_result_data = await llm_utils.entity_extraction(
        data=f"{item.metadata['header']}\n{item.page_content}" if "header" in item.metadata else item.page_content,
        chunk_index=int(item.metadata["chunk_index"]),
        document_id=str(item.metadata["document_id"])
    )
    ts = final_result_data["total_tokens"]
    final_result = final_result_data["data"]
    hint_prompt = PROMPTS["entity_extraction"].format(
        **context_base, input_text="{input_text}"
    ).format(**context_base, input_text=item)
    history = [
        HumanMessage(content=hint_prompt),
        AIMessage(content=final_result)
    ]
    for now_glean_index in range(entity_extract_max_gleaning):
        glean_result = await llm_utils.llm_helper.generate_response(
            prompt=PROMPTS["entiti_continue_extraction"],
            chat_history=history
        )
        ts += glean_result.usage_metadata["total_tokens"]
        history += [
            HumanMessage(content=PROMPTS["entiti_continue_extraction"]),
            AIMessage(content=glean_result.content)
        ]
        final_result += glean_result.content
        if now_glean_index == entity_extract_max_gleaning - 1:
            break

        if_loop_result_data = await llm_utils.llm_helper.generate_response(
            prompt=PROMPTS["entiti_if_loop_extraction"],
            chat_history=history
        )
        ts += if_loop_result_data.usage_metadata["total_tokens"]
        if_loop_result = if_loop_result_data.content
        if_loop_result = if_loop_result.strip().strip('"').strip("'").lower()
        if "yes" not in if_loop_result:
            break

    records = split_string_by_multi_markers(
        final_result,
        [context_base["record_delimiter"], context_base["completion_delimiter"]],
    )
    maybe_nodes = defaultdict(list)
    maybe_edges = defaultdict(list)
    for record in records:
        record = re.search(r"\((.*)\)", record)
        if record is None:
            continue
        record = record.group(1)
        record_attributes = split_string_by_multi_markers(
            record, [context_base["tuple_delimiter"]]
        )
        if_entities = await _handle_single_entity_extraction(
            record_attributes=record_attributes,
            doc_id=str(db_obj.id),
            chunk_index=final_result_data["chunk_index"],
            chatbot_id=str(db_obj.chatbot_id)
        )
        if if_entities is not None:
            maybe_nodes[if_entities["name"]].append(if_entities)
            continue

        if_relation = await _handle_single_relationship_extraction(
            record_attributes=record_attributes,
            doc_id=str(db_obj.id),
            chunk_index=int(item.metadata["chunk_index"]),
            chatbot_id=str(db_obj.chatbot_id)
        )
        if if_relation is not None:
            maybe_edges[(if_relation["source"], if_relation["target"])].append(
                if_relation
            )
    return dict(maybe_nodes), dict(maybe_edges)


async def _handle_single_entity_extraction(
        record_attributes: list[str],
        doc_id: str,
        chunk_index: int,
        chatbot_id: str
):
    if len(record_attributes) < 4 or record_attributes[0] != '"entity"':
        return None
    # add this record as a node in the G
    entity_name = clean_str(record_attributes[1]).strip('"')
    if not entity_name.strip():
        return None
    entity_type = clean_str(record_attributes[2]).strip('"')
    entity_description = clean_str(record_attributes[3]).strip('"')
    entity_source_id = doc_id
    return dict(
        name=entity_name,
        type=entity_type,
        description=entity_description,
        document_id=entity_source_id,
        chunk_index=chunk_index,
        chatbot_id=chatbot_id,
        metadata={"created_at": time.time()},
    )


async def _handle_single_relationship_extraction(
        record_attributes: list[str],
        doc_id: str,
        chunk_index: int,
        chatbot_id: str
):
    if len(record_attributes) < 5 or record_attributes[0] != '"relationship"':
        return None
    # add this record as edge
    source = clean_str(record_attributes[1]).strip('"')
    target = clean_str(record_attributes[2]).strip('"')
    edge_description = clean_str(record_attributes[3]).strip('"')
    edge_keywords = clean_str(record_attributes[4]).strip('"')
    edge_source_id = doc_id
    weight = (
        float(record_attributes[-1].strip('"'))
        if is_float_regex(record_attributes[-1])
        else 1.0
    )
    return dict(
        source=source,
        target=target,
        weight=weight,
        description=edge_description,
        keywords=edge_keywords,
        document_id=edge_source_id,
        chunk_index=chunk_index,
        chatbot_id=chatbot_id,
        metadata={"created_at": time.time()},
    )
