import asyncio
import time
import uuid
from collections import defaultdict

from app.db_context.ChromaDbContext import ChromaDbContext
from app.db_context.Neo4jContext import Neo4jContext
from app.utils import list_of_list_to_csv, truncate_list_by_token_size


#from app.rerank.OnnxRanker import OnnxReranker
#reranker = OnnxReranker()
class RetrieverHelper:
    def __init__(self, vector_storage: ChromaDbContext, graph_storage: Neo4jContext):
        self._vector_storage = vector_storage
        self._graph_storage = graph_storage

    async def get_vector_context(
            self,
            query: str,
            n_result_to_rank: int,
            k: int,
            expand_above: int = 0,
            expand_below: int = 0
    ):
        start_time = time.time()
        docs = await self._vector_storage.collection.asimilarity_search(
            query=query,
            k=k,
            filter={
                "tag": "content"
            }
        )
        if not docs: return ""
        docs_as_dicts = []
        # convert all to 1 kind of dict
        for this_doc in docs:
            docs_as_dicts.append(self._vector_storage.collection.get(
                where={
                    "$and": [
                        {"document_id": this_doc.metadata["document_id"]},
                        {"chunk_index": this_doc.metadata["chunk_index"]}
                    ]
                }
            ))
        '''
        # get top k reranked docs
        chunks = [chunk["documents"][0].lower() for chunk in docs_as_dicts]
        scores, ranked_indices = reranker.rerank_long_texts(
            query=query,
            long_texts=chunks,
            num_threads=6
        )
        scores = np.round(scores, 2)
        sorted_scores = scores[ranked_indices][:k]
        k_docs_most_similar = []
        for idx, score in zip(ranked_indices[:k], sorted_scores[:k]):
            doc = result[idx]
            doc["metadatas"][0]['score'] = float(score)
            k_docs_most_similar.append(doc)
        result = k_docs_most_similar
        '''
        # expand context
        result = []
        for this_doc in docs_as_dicts:
            document_id = this_doc["metadatas"][0]['document_id']
            chunk_index = this_doc["metadatas"][0]['chunk_index']
            chunks_above = []
            if expand_above != 0:
                # get chunk above from this_doc
                for i in range(1, expand_above + 1):
                    prev_chunk_index = chunk_index - i
                    if prev_chunk_index >= 0:  # Đảm bảo chỉ số không âm
                        chunk = self._vector_storage.collection.get(
                            where={
                                "$and": [
                                    {"document_id": document_id},
                                    {"chunk_index": prev_chunk_index}
                                ]
                            }
                        )
                        chunks_above.append(chunk)
                chunks_above.reverse()
            chunks_below = []
            if expand_below != 0:
                # get chunk below from this_doc
                for i in range(1, expand_below + 1):
                    next_chunk_index = chunk_index + i
                    chunk = self._vector_storage.collection.get(
                        where={
                            "$and": [
                                {"document_id": document_id},
                                {"chunk_index": next_chunk_index}
                            ]
                        }
                    )
                    if len(chunk["documents"]) == 0:
                        continue
                    chunks_below.append(chunk)
            result.extend(chunks_above)
            result.append(this_doc)
            result.extend(chunks_below)

        unique_ids = set()
        filtered_result = []

        for doc in result:
            doc_id = doc["ids"][0]
            if doc_id not in unique_ids:
                unique_ids.add(doc_id)
                filtered_result.append(doc)

        documents_by_id = defaultdict(list)
        for doc in filtered_result:
            if len(doc.get("documents", [])) == 0:
                continue
            metadata = doc["metadatas"][0]
            document_id = metadata.get("document_id")
            documents_by_id[document_id].append({
                "chunk_index": metadata.get("chunk_index"),
                "document_title": metadata.get("document_title", "Untitled Document"),
                "score": metadata.get("score"),
                "header": metadata.get("header"),
                "content": doc["documents"][0]
            })
        # join all context
        joined_context = ""

        for document_id, chunks in documents_by_id.items():
            chunks.sort(key=lambda x: x["chunk_index"] if x["chunk_index"] is not None else 0)
            document_title = chunks[0]["document_title"] if chunks else "Untitled Document"
            joined_context += f"===== DOCUMENT: {document_title} =====\n"
            for chunk in chunks:
                joined_context += "\n=== NEW CHUNK ===\n"
                if chunk["score"] is not None:
                    joined_context += f"+---------+ SCORE: {chunk['score']} +---------+\n"
                if chunk["header"]:
                    joined_context += chunk["header"] + "</br>\n"
                joined_context += chunk["content"]
            joined_context += "\n\n"
        print(f"Get chunk context in: {time.time() - start_time:.2f} seconds")
        return joined_context

    async def get_graph_context(
            self,
            ll_keywords_str,
            hl_keywords_str,
            chatbot_id: uuid.UUID,
            k_entities,
            k_relations,
            mode
    ):
        start_time = time.time()
        query_mode = mode
        if query_mode == "local":
            entities_context, relations_context, text_units_context = await self.get_node_data(
                ll_keywords=ll_keywords_str, chatbot_id=chatbot_id, k_entities=k_entities
            )
        elif query_mode == "global":
            entities_context, relations_context, text_units_context = await self.get_edge_data(
                hl_keywords=hl_keywords_str, chatbot_id=chatbot_id, k_relations=k_relations
            )
        else:
            ll_data, hl_data = await asyncio.gather(
                self.get_node_data(ll_keywords=ll_keywords_str, chatbot_id=chatbot_id, k_entities=k_entities),
                self.get_edge_data(hl_keywords=hl_keywords_str, chatbot_id=chatbot_id, k_relations=k_relations)
            )
            (
                ll_entities_context,
                ll_relations_context,
                ll_text_units_context,
            ) = ll_data
            (
                hl_entities_context,
                hl_relations_context,
                hl_text_units_context,
            ) = hl_data
            entities_context, relations_context, text_units_context = self.combine_contexts(
                [hl_entities_context, ll_entities_context],
                [hl_relations_context, ll_relations_context],
                [hl_text_units_context, ll_text_units_context],
            )
        if not entities_context.strip() and not relations_context.strip():
            graph_context = ""
        else:
            graph_context = f"""
                -----Sources-----
                ```csv
                {text_units_context}
                ```
                """.strip()
        print(f"Get graph context in: {time.time() - start_time:.2f} seconds")
        return graph_context

    async def get_node_data(self, ll_keywords: str, chatbot_id: uuid.UUID, k_entities):
        vector_search_results = self._vector_storage.collection.similarity_search(
            query=ll_keywords,
            k=k_entities,
            filter={
                "tag": "entity"
            }
        )
        if not vector_search_results:
            return "", "", ""
        node_datas, node_degrees = await asyncio.gather(
            asyncio.gather(
                *[self._graph_storage.get_node(r.metadata["name"], chatbot_id) for r in vector_search_results]
            ),
            asyncio.gather(
                *[self._graph_storage.node_degree(r.metadata["name"], chatbot_id) for r in vector_search_results]
            ),
        )
        if not all([n is not None for n in node_datas]):
            print("Some nodes are missing, maybe the storage is damaged")
        node_datas = [
            {**n, "name": k.metadata["name"], "rank": d}
            for k, n, d in zip(vector_search_results, node_datas, node_degrees)
            if n is not None
        ]
        use_text_units, use_relations = await asyncio.gather(
            self._graph_storage.find_most_related_text_unit_from_entities(
                node_datas, chatbot_id
            ),
            self._graph_storage.find_most_related_edges_from_entities(
                node_datas, chatbot_id
            ),
        )
        node_datas = truncate_list_by_token_size(
            node_datas,
            key=lambda x: x["description"] if x["description"] is not None else "",
            max_token_size=0,
        )
        entites_section_list = [
            [
                "id",
                "entity",
                "type",
                "description",
                "rank",
                "created_at",
            ]
        ]
        for i, n in enumerate(node_datas):
            created_at = n.get("created_at", "UNKNOWN")
            if isinstance(created_at, (int, float)):
                created_at = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(created_at))
            entites_section_list.append(
                [
                    i,
                    n["name"],
                    n.get("type", "UNKNOWN"),
                    n.get("description", "UNKNOWN"),
                    n["rank"],
                    created_at,
                ]
            )
        entities_context = list_of_list_to_csv(entites_section_list)
        relations_section_list = [
            [
                "id",
                "source",
                "target",
                "description",
                "keywords",
                "weight",
                "rank",
                "created_at",
            ]
        ]
        for i, e in enumerate(use_relations):
            created_at = e.get("created_at", "UNKNOWN")
            # Convert timestamp to readable format
            if isinstance(created_at, (int, float)):
                created_at = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(created_at))
            relations_section_list.append(
                [
                    i,
                    e["src_tgt"][0],
                    e["src_tgt"][1],
                    e["properties"][0]["description"],
                    e["properties"][0]["keywords"],
                    e["properties"][0]["weight"],
                    e["rank"],
                    created_at,
                ]
            )
        relations_context = list_of_list_to_csv(relations_section_list)
        text_units_section_list = [["id", "content"]]
        for i, t in enumerate(use_text_units):
            if "header" in t["metadatas"][0]:
                temp = t["documents"][0]
                t["documents"][0] = f'{t["metadatas"][0]["header"]}\n{temp}\n'
            text_units_section_list.append([i, t["documents"][0]]) if len(t["documents"]) else None
        text_units_context = list_of_list_to_csv(text_units_section_list)
        return entities_context, relations_context, text_units_context

    async def get_edge_data(self, hl_keywords: str, chatbot_id: uuid.UUID, k_relations):
        vector_search_results = self._vector_storage.collection.similarity_search(
            query=hl_keywords,
            k=k_relations,
            filter={
                "tag": "relation"
            }
        )
        if not vector_search_results:
            return "", "", ""
        edge_datas, edge_degree = await asyncio.gather(
            asyncio.gather(
                *[self._graph_storage._get_edge(r.metadata["source"], r.metadata["target"], str(chatbot_id)) for r in
                  vector_search_results]
            ),
            asyncio.gather(
                *[
                    self._graph_storage.edge_degree(r.metadata["source"], r.metadata["target"], str(chatbot_id))
                    for r in vector_search_results
                ]
            ),
        )
        edge_datas = [
            {
                "source": k.metadata["source"],
                "target": k.metadata["target"],
                "rank": d,
                "created_at": k.metadata.get("created_at", None),
                **v,
            }
            for k, v, d in zip(vector_search_results, edge_datas, edge_degree)
            if v is not None
        ]
        use_entities, use_text_units = await asyncio.gather(
            self._graph_storage.find_most_related_entities_from_relationships(
                edge_datas, chatbot_id
            ),
            self._graph_storage.find_related_text_unit_from_relationships(
                edge_datas, chatbot_id
            ),
        )
        relations_section_list = [
            [
                "id",
                "source",
                "target",
                "description",
                "keywords",
                "weight",
                "rank",
                "created_at",
            ]
        ]
        for i, e in enumerate(edge_datas):
            created_at = e.get("created_at", "Unknown")
            # Convert timestamp to readable format
            if isinstance(created_at, (int, float)):
                created_at = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(created_at))
            relations_section_list.append(
                [
                    i,
                    e["source"],
                    e["target"],
                    e["properties"][0]["description"],
                    e["properties"][0]["keywords"],
                    e["properties"][0]["weight"],
                    e["rank"],
                    created_at,
                ]
            )
        relations_context = list_of_list_to_csv(relations_section_list)

        entites_section_list = [["id", "entity", "type", "description", "rank"]]
        for i, n in enumerate(use_entities):
            created_at = n.get("created_at", "Unknown")
            # Convert timestamp to readable format
            if isinstance(created_at, (int, float)):
                created_at = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(created_at))
            entites_section_list.append(
                [
                    i,
                    n["name"],
                    n.get("type", "UNKNOWN"),
                    n.get("description", "UNKNOWN"),
                    n["rank"],
                    created_at,
                ]
            )
        entities_context = list_of_list_to_csv(entites_section_list)

        text_units_section_list = [["id", "content"]]
        for i, t in enumerate(use_text_units):
            if "header" in t["metadatas"][0]:
                temp = t["documents"][0]
                t["documents"][0] = f'{t["metadatas"][0]["header"]}\n{temp}'
            text_units_section_list.append([i, t["documents"][0]]) if len(t["documents"]) else None
        text_units_context = list_of_list_to_csv(text_units_section_list)
        return entities_context, relations_context, text_units_context

    def combine_contexts(self, param, param1, param2):
        return "", "", ""

