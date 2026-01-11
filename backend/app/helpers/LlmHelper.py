import hashlib
import asyncio
import os
from pathlib import Path
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.prompts import MessagesPlaceholder
from langchain.globals import set_llm_cache
from gptcache import Cache
from gptcache.manager.factory import manager_factory
from gptcache.processor.pre import get_prompt
from langchain_community.cache import GPTCache
from langchain_openai import ChatOpenAI



class LLMHelper:
    base_dir = Path(__file__).resolve().parent.parent
    def __init__(
            self,
            llm_provider: str,
            model_name: str,
            temperature: int = 0.5,
            api_key: str = "",
            use_cache: bool = False
    ):
        self.llm_provider = llm_provider.lower()
        self.model_name = model_name
        self.temperature = temperature
        self.api_key = api_key
        self.use_cache = use_cache
        self.llm_instance = self.set_llm(model_name=model_name, temperature=temperature)


    def set_llm(self, model_name: str = None, temperature: int = None):
        """Khởi tạo LLM dựa trên provider."""
        if model_name is None: model_name = self.model_name
        if temperature is None: temperature = self.temperature
        llm = None
        if self.llm_provider == 'gemini':
            if self.api_key == "":
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    temperature=temperature,
                    cache=self.use_cache,
                )
            else:
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    temperature=temperature,
                    cache=self.use_cache,
                    api_key=self.api_key
                )
        elif self.llm_provider == 'openai':
            if model_name is None: model_name = self.model_name
            if temperature is None: temperature = self.temperature
            llm = ChatOpenAI(
                api_key=os.getenv("OPENAI_API_KEY"),
                model=model_name,
                temperature=temperature,
                max_tokens=None,
                timeout=None,
                max_retries=2,
                cache=self.use_cache
            )

        def get_hashed_name(name):
            return hashlib.sha256(name.encode()).hexdigest()

        def init_gptcache(cache_obj: Cache, llm: str):
            hashed_llm = get_hashed_name(llm)
            _base_dir = str(LLMHelper.base_dir / "cache/chat_cache")
            cache_obj.init(
                pre_embedding_func=get_prompt,
                data_manager=manager_factory(manager="map", data_dir=f"{_base_dir}/map_cache_{hashed_llm}"),
            )
        set_llm_cache(GPTCache(init_gptcache))
        return llm

    async def generate_response(
            self,
            prompt: str = "",
            chat_history = None,
            instruction = "",
            args: dict = None
    ):
        """Sinh phản hồi từ mô hình LLM."""
        if chat_history is None: chat_history = []
        instruction = instruction.replace("{", "{{").replace("}", "}}")
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", instruction),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", prompt),
        ])
        if not self.llm_instance:
            raise ValueError("⚠️ LLM chưa được khởi tạo. Vui lòng gọi _init_llm trước.")
        chain = prompt_template | self.llm_instance

        max_retries = 3
        attempt = 0
        while attempt < max_retries:
            try:
                response = await chain.ainvoke({
                    "prompt": prompt,
                    "chat_history": chat_history,
                    **(args or {}),
                })

                return response
            except Exception as e:
                attempt += 1
                print(f"[Retry {attempt}/{max_retries}] Response failed: {e}\n")
                if attempt >= max_retries:
                    raise Exception(f"Response failed after {max_retries} attempts\n") from e
                await asyncio.sleep(61)

    async def generate_stream_response(self, prompt: str = "", chat_history = None, instruction = "", args: dict = None):
        """Sinh phản hồi từ mô hình LLM."""
        if chat_history is None: chat_history = []
        instruction = instruction.replace("{", "{{").replace("}", "}}")
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", instruction),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", prompt),
        ])
        if not self.llm_instance:
            raise ValueError("⚠️ LLM chưa được khởi tạo. Vui lòng gọi _init_llm trước.")
        chain = prompt_template | self.llm_instance

        async for chunk in chain.astream({
            "chat_history": chat_history,
            "prompt": prompt,
            **(args or {}),
        }):
            yield chunk

    @staticmethod
    async def embed(query: str, provider: str = "openai", model: str = "text-embedding-3-large") -> list[float]:
        if provider.lower() == "openai":
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            try:
                response = await client.embeddings.create(
                    model=model,
                    input=query
                )
                return response.data[0].embedding
            except Exception as e:
                print(f"❌ OpenAI embedding error: {e}")
                raise
        elif provider.lower() == "gemini":
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            embed_model = GoogleGenerativeAIEmbeddings(model=model)
            try:
                return await embed_model.aembed_query(query)
            except Exception as e:
                print(f"❌ Gemini embedding error: {e}")
                raise
        else:
            raise ValueError(f"⚠️ Provider '{provider}' không được hỗ trợ.")
