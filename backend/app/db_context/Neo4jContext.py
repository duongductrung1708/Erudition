import asyncio
import json
import uuid
from collections import Counter, defaultdict

import neo4j

from app.core.config import settings
from app.db_context.ChromaDbContext import ChromaDbContext
from app.prompts import GRAPH_FIELD_SEP
from app.utils import split_string_by_multi_markers, truncate_list_by_token_size
from app.utils_package.LLMUtils import LLMUtils


class Neo4jContext:
    def __init__(self, vector_storage: ChromaDbContext, llm_service: LLMUtils):
        self.driver = settings.neo4j_driver
        self._vector_storage = vector_storage
        self._llm_service = llm_service

    async def _upsert_node(self, name: str, node_data: dict):
        async with self.driver.session(default_access_mode=neo4j.READ_ACCESS) as session:
            await session.write_transaction(
                self._create_entity, name, node_data["type"],
                node_data["description"], node_data["sources"],
                node_data["chatbot_id"]
            )

    async def _upsert_edge(self, source: str, target: str, edge_data: dict):
        async with self.driver.session(default_access_mode=neo4j.WRITE_ACCESS) as session:
            await session.write_transaction(
                self._create_relation, source, target,
                edge_data["description"], edge_data["keywords"],
                edge_data["weight"], edge_data["chatbot_id"], edge_data["sources"]
            )

    async def _create_entity(self, tx, name, entity_type, description, sources, chatbot_id):
        label = f"Chatbot_{chatbot_id}"
        query = (
            f"""
            MERGE (e:Entity:`{label}` {{name: $name, chatbot_id: $chatbot_id}})
            ON CREATE SET e.type = $type, e.description = $description, e.sources = $sources, e.chatbot_id = $chatbot_id
            ON MATCH SET e.type = $type, 
                  e.description = $description, e.sources = $sources, e.chatbot_id = $chatbot_id
            """
        )
        await tx.run(query, name=name, type=entity_type, description=description,
                     sources=sources, chatbot_id=chatbot_id)


    async def _create_relation(self, tx, source, target, description, keywords, weight, chatbot_id, sources):
        label = f"Chatbot_{chatbot_id}"
        query = (
            f"""
            MATCH (a:Entity:`{label}` {{name: $source}})
            WITH a
            MATCH (b:Entity:`{label}` {{name: $target}})
            MERGE (a)-[r:RELATED_TO]->(b)
            ON CREATE SET 
                  r.description = $description, 
                  r.keywords = $keywords, 
                  r.weight = $weight,
                  r.sources = $sources,
                  r.chatbot_id = $chatbot_id
            ON MATCH SET 
                  r.description = $description,
                  r.keywords = $keywords,
                  r.weight = $weight, 
                  r.sources = $sources,
                  r.chatbot_id = $chatbot_id

            """
        )
        await tx.run(query, source=source, target=target, description=description, keywords=keywords, weight=weight,
                     chatbot_id=chatbot_id, sources=sources)


    async def get_entities_by_fields(self, **kwargs):
        """Lấy danh sách entity theo các điều kiện truyền vào."""
        if not kwargs:
            print("❌ Cần ít nhất một điều kiện để truy vấn!")
            return None

        conditions = " AND ".join(
            [f"e.{key} = ${key}" if value is not None else f"e.{key} IS NULL" for key, value in kwargs.items()]
        )
        query = f"MATCH (e:Entity) WHERE {conditions} RETURN e"

        async with self.driver.session(default_access_mode=neo4j.READ_ACCESS) as session:
            result = await session.run(query, kwargs)
            records = await result.data()  # ✅ Lấy danh sách kết quả
            return [record["e"] for record in records]  # ✅ Trả về danh sách entities


    async def _has_edge(self, source, target, chatbot_id):
        label = f"Chatbot_{chatbot_id}"
        query = f"""
    MATCH (src:Entity:`{label}` {{name: $source}})-[r:RELATED_TO]->(tgt:Entity:`{label}` {{name: $target}})
    RETURN COUNT(r) > 0 AS has_edge
            """

        async with self.driver.session(default_access_mode=neo4j.READ_ACCESS) as session:
            result = await session.run(query, source=source, target=target, chatbot_id=str(chatbot_id))
            record = await result.single()
            return record["has_edge"] if record else False


    async def _get_edge(self, source, target, chatbot_id):
        label = f"Chatbot_{chatbot_id}"
        query = f"""
            MATCH (src:Entity:`{label}`)-[r:RELATED_TO]->(tgt:Entity:`{label}`)
            WHERE src.name = $source AND tgt.name = $target
            RETURN COLLECT(properties(r)) AS properties
            """

        async with self.driver.session(default_access_mode=neo4j.READ_ACCESS) as session:
            result = await session.run(query, source=source, target=target, chatbot_id=str(chatbot_id))
            record = await result.single()
            return record if record else None


    async def get_node(self, node_name: str, chatbot_id: uuid.UUID):
        find_results = await self.get_entities_by_fields(name=node_name, chatbot_id=str(chatbot_id))
        return find_results[0] if len(find_results) else None


    async def node_degree(self, node_name: str, chatbot_id: uuid.UUID):
        label = f"Chatbot_{chatbot_id}"
        query = f"""
            MATCH (n:Entity:`{label}`) WHERE n.name = $name
            RETURN COUNT {{ (n)--() }} AS totalEdgeCount LIMIT 1
            """
        async with self.driver.session(default_access_mode=neo4j.READ_ACCESS) as session:
            result = await session.run(query, name=node_name, chatbot_id=str(chatbot_id))
            record = await result.single()
            return record[0] if record else None


    async def find_most_related_text_unit_from_entities(self, node_datas, chatbot_id: uuid.UUID):
        edges = await asyncio.gather(
            *[self.get_node_edges(dp["name"], str(chatbot_id)) for dp in node_datas]
        )
        all_one_hop_nodes = set()
        for this_edges in edges:
            if not this_edges:
                continue
            all_one_hop_nodes.update([e[1] for e in this_edges])
        all_one_hop_nodes = list(all_one_hop_nodes)
        all_one_hop_nodes_data = await asyncio.gather(
            *[self.get_node(e, str(chatbot_id)) for e in all_one_hop_nodes]
        )

        all_one_hop_text_units_lookup = defaultdict(set)
        for v in all_one_hop_nodes_data:
            if v is not None and "sources" in v:
                sources = json.loads(v["sources"])
                cs = []
                for source in sources:
                    for c_index in source[1]:
                        cs.append(source[0] + GRAPH_FIELD_SEP + str(c_index))
                for c in cs:
                    all_one_hop_text_units_lookup[v["name"]].add(c)

        all_text_units_lookup = defaultdict(set)
        for v in node_datas:
            if v is not None and "sources" in v:
                sources = json.loads(v["sources"])
                cs = []
                for source in sources:
                    for c_index in source[1]:
                        cs.append(source[0] + GRAPH_FIELD_SEP + str(c_index))
                for c in cs:
                    all_text_units_lookup[v["name"]].add(c)
        all_text_units_lookup_has_relation_counts = {}
        for k, v in all_text_units_lookup.items():
            for s0 in v:
                all_text_units_lookup_has_relation_counts.setdefault(s0, {"relation_counts": 0})
                for k1, v1 in all_one_hop_text_units_lookup.items():
                    if s0 in v1: all_text_units_lookup_has_relation_counts[s0]["relation_counts"] += 1

        sorted_data = {k: v for k, v in sorted(all_text_units_lookup_has_relation_counts.items(), key=lambda item: item[1]['relation_counts'], reverse=True)}

        results = await asyncio.gather(
            *[asyncio.to_thread(
                self._vector_storage.collection.get,
                where={
                    "$and": [
                        {"document_id": split_string_by_multi_markers(k, [GRAPH_FIELD_SEP])[0]},
                        {"chunk_index": int(split_string_by_multi_markers(k, [GRAPH_FIELD_SEP])[1])}
                    ]
                }
            ) for k, v in sorted_data.items()]
        )
        all_text_units = [
            {**result}
            for result in results
            if len(result["ids"])
        ]
        truncated = truncate_list_by_token_size(
            all_text_units,
            key=lambda x: x["documents"][0],
            max_token_size=0,
        )

        return truncated


    async def find_most_related_edges_from_entities(self, node_datas, chatbot_id: uuid.UUID):
        all_related_edges = await asyncio.gather(
            *[self.get_node_edges(dp["name"], str(chatbot_id)) for dp in node_datas]
        )
        all_edges = []
        seen = set()
        for this_edges in all_related_edges:
            for e in this_edges:
                sorted_edge = tuple(sorted(e))
                if sorted_edge not in seen:
                    seen.add(sorted_edge)
                    all_edges.append(sorted_edge)
        all_edges_pack, all_edges_degree = await asyncio.gather(
            asyncio.gather(*[self._get_edge(e[0], e[1], str(chatbot_id)) for e in all_edges]),
            asyncio.gather(
                *[self.edge_degree(e[0], e[1], str(chatbot_id)) for e in all_edges]
            ),
        )
        all_edges_data = [
            {"src_tgt": k, "rank": d, **v}
            for k, v, d in zip(all_edges, all_edges_pack, all_edges_degree)
            if v is not None
        ]
        all_edges_data = sorted(
            all_edges_data, key=lambda x: (x["rank"], x["properties"][0]["weight"]), reverse=True
        )
        all_edges_data = truncate_list_by_token_size(
            all_edges_data,
            key=lambda x: x["properties"][0]["description"] if x["properties"][0]["description"] is not None else "",
            max_token_size=0,
        )
        return all_edges_data


    async def edge_degree(self, source, target, chatbot_id):
        entity_name_label_source = source.strip('"')
        entity_name_label_target = target.strip('"')
        src_degree = await self.node_degree(entity_name_label_source, chatbot_id)
        trg_degree = await self.node_degree(entity_name_label_target, chatbot_id)

        # Convert None to 0 for addition
        src_degree = 0 if src_degree is None else src_degree
        trg_degree = 0 if trg_degree is None else trg_degree

        degrees = int(src_degree) + int(trg_degree)
        return degrees


    async def get_node_edges(self, node_name, chatbot_id):
        label = f"Chatbot_{str(chatbot_id)}"
        query = f"""
            MATCH (n:Entity:`{label}`)
            OPTIONAL MATCH (n)-[r]-(connected)
            WHERE n.name = $name
            RETURN n, r, connected"""
        async with self.driver.session(default_access_mode=neo4j.READ_ACCESS) as session:
            results = await session.run(query, name=node_name, chatbot_id=str(chatbot_id))
            edges = []
            async for record in results:
                source_node = record["n"]
                connected_node = record["connected"]

                source = (
                    source_node["name"]
                    if source_node and source_node["name"]
                    else None
                )
                target = (
                    connected_node["name"]
                    if connected_node and connected_node["name"]
                    else None
                )

                if source and target:
                    edges.append((source, target))

            return edges


    async def find_most_related_entities_from_relationships(self, edge_datas, chatbot_id: uuid.UUID):
        entity_names = []
        seen = set()
        for e in edge_datas:
            if e["source"] not in seen:
                entity_names.append(e["source"])
                seen.add(e["source"])
            if e["target"] not in seen:
                entity_names.append(e["target"])
                seen.add(e["target"])
        node_datas, node_degrees = await asyncio.gather(
            asyncio.gather(
                *[
                    self.get_node(entity_name, chatbot_id)
                    for entity_name in entity_names
                ]
            ),
            asyncio.gather(
                *[
                    self.node_degree(entity_name, chatbot_id)
                    for entity_name in entity_names
                ]
            ),
        )
        node_datas = [
            {**n, "name": k, "rank": d}
            for k, n, d in zip(entity_names, node_datas, node_degrees)
        ]
        return node_datas


    async def find_related_text_unit_from_relationships(self, edge_datas, chatbot_id: uuid.UUID):
        text_units = [
            json.loads(dp["properties"][0]["sources"])
            for dp in edge_datas
        ]
        sources = []
        for this_unit in text_units:
            for source in this_unit:
                for c_index in source[1]:
                    sources.append(source[0] + GRAPH_FIELD_SEP + str(c_index))

        results = await asyncio.gather(
            *[asyncio.to_thread(
                self._vector_storage.collection.get,
                where={
                    "$and": [
                        {"document_id": split_string_by_multi_markers(c, [GRAPH_FIELD_SEP])[0]},
                        {"chunk_index": int(split_string_by_multi_markers(c, [GRAPH_FIELD_SEP])[1])}
                    ]
                }
            ) for c in sources]
        )
        all_text_units = [
            {**result}
            for result in results
            if len(result["ids"])
        ]
        truncated_text_units = truncate_list_by_token_size(
            all_text_units,
            key=lambda x: x["documents"][0],
            max_token_size=0,
        )

        return truncated_text_units


    async def _merge_nodes_then_upsert(
            self,
            name: str,
            nodes_data: list[dict],
            doc_id: uuid.UUID,
            chatbot_id: uuid.UUID
    ):
        """Get existing nodes from knowledge graph use name,if exists, merge data, else create, then upsert."""
        already_entity_types = []
        already_description = []
        already_sources = []
        already_node = await self.get_entities_by_fields(name=name, chatbot_id=str(chatbot_id))
        if already_node:
            already_entity_types.append(already_node[0]["type"])
            already_description.append(already_node[0]["description"])
            already_sources.extend(json.loads(already_node[0]["sources"]))

        entity_type = sorted(
            Counter(
                [dp["type"] for dp in nodes_data] + already_entity_types
            ).items(),
            key=lambda x: x[1],
            reverse=True,
        )[0][0]
        description = GRAPH_FIELD_SEP.join(
            sorted(set([dp["description"] for dp in nodes_data] + already_description))
        )
        description = await self._llm_service.summarize_entity_descriptions(
            name, description
        )
        t = description["total_tokens"]
        source_items = defaultdict(list)
        for dp in nodes_data:
            source_items[dp["document_id"]].append(dp["chunk_index"])
        already_sources.extend(list(source_items.items()))
        sources = json.dumps(already_sources)

        node_data = dict(
            type=entity_type,
            description=description["data"],
            sources=sources,
            chatbot_id=str(chatbot_id)
        )
        await self._upsert_node(
            name,
            node_data=node_data
        )
        node_data["name"] = name
        print(f" SUCCESSFUL ## Merge node: {name}")
        return node_data


    async def _merge_edges_then_upsert(
            self,
            source: str,
            target: str,
            edges_data: list[dict],
            chatbot_id: uuid.UUID,
    ):
        already_weights = []
        already_description = []
        already_keywords = []
        already_sources = []

        if await self._has_edge(source, target, str(chatbot_id)):
            already_edge = await self._get_edge(source, target, str(chatbot_id))
            if already_edge:
                already_weights.append(already_edge.get("weight", 0.0))
                if already_edge.get("description") is not None:
                    already_description.append(already_edge["description"])
                if already_edge.get("keywords") is not None:
                    already_keywords.extend(
                        split_string_by_multi_markers(
                            already_edge["keywords"], [GRAPH_FIELD_SEP]
                        )
                    )
                if already_edge.get("sources") is not None:
                    already_sources.extend(json.loads(already_edge["sources"]))

        # Process edges_data with None checks
        weight = sum([dp["weight"] for dp in edges_data] + already_weights)
        description = GRAPH_FIELD_SEP.join(
            sorted(
                set(
                    [dp["description"] for dp in edges_data if dp.get("description")]
                    + already_description
                )
            )
        )
        keywords = GRAPH_FIELD_SEP.join(
            sorted(
                set(
                    [dp["keywords"] for dp in edges_data if dp.get("keywords")]
                    + already_keywords
                )
            )
        )
        source_items = defaultdict(list)
        for dp in edges_data:
            source_items[dp["document_id"]].append(dp["chunk_index"])
        already_sources.extend(list(source_items.items()))
        sources = json.dumps(already_sources)

        for need_insert_id in [source, target]:
            if len((await self.get_entities_by_fields(name=need_insert_id, chatbot_id=str(chatbot_id)))) == 0:
                await self._upsert_node(
                    need_insert_id,
                    node_data={
                        "description": description,
                        "type": "UNKNOWN",
                        "sources": sources,
                        "chatbot_id": str(chatbot_id)
                    }
                )
        description = await self._llm_service.summarize_entity_descriptions(
            f"({source}, {target})", description
        )
        await self._upsert_edge(
            source,
            target,
            edge_data=dict(
                weight=weight,
                description=description["data"],
                keywords=keywords,
                chatbot_id=str(chatbot_id),
                sources=sources
            ),
        )

        edge_data = dict(
            source=source,
            target=target,
            description=description,
            keywords=keywords,
            sources=sources,
            chatbot_id=str(chatbot_id),
        )
        print(f" SUCCESSFUL ## Merge edge: ({source})-({target})")

        return edge_data

    async def test_neo4j_connection(self):
        """Test kết nối Neo4j."""
        async with self.driver.session(default_access_mode=neo4j.READ_ACCESS) as session:
            result = await session.run("RETURN 'Neo4j Connected' AS message")
            record = await result.single()
            return record["message"]  # Output: Neo4j Connected

