import logging
import os
import platform
from typing import Iterator

import torch
from docling.datamodel.base_models import DocumentStream, InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    EasyOcrOptions,
    TableStructureOptions,
    TableFormerMode,
    AcceleratorOptions,
    AcceleratorDevice,
)
from docling.document_converter import DocumentConverter, PdfFormatOption, WordFormatOption
from docling.pipeline.simple_pipeline import SimplePipeline
from easyocr import Reader
from fastapi import UploadFile
from langchain_core.document_loaders import BaseLoader
from langchain_core.documents import Document

from app.models_mongo import DocumentUpload
from app.utils_package.DataUtils import DataUtils

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)


class DoclingLoader(BaseLoader):
    def __init__(self, source: DocumentStream, converter: DocumentConverter):
        """
        Initialize the DoclingLoader with a document source and a document converter.

        Args:
            source (DocumentStream): A document source representing the input file data and metadata.
            converter (DocumentConverter): A document converter instance to process input data.
        """
        self.source = source
        self.converter = converter
        self.force_model_download(lang_list=["vi", "en"], gpu=torch.cuda.is_available())

    @classmethod
    async def create(cls, file: UploadFile, document_model: DocumentUpload):
        """
        Factory method to create an instance of `DoclingLoader`.

        Args:
            file (UploadFile): The uploaded file to process.
            document_model (DocumentUpload): Metadata model for the uploaded document.

        Returns:
            DoclingLoader: An instance of the class initialized with document processing configurations.
        """
        # Check GPU availability and initialize acceleration options
        print("🔥 Checking GPU...")
        if torch.cuda.is_available():
            try:
                print(f"🟢 GPU Available: {torch.cuda.get_device_name(0)}")
                accelerator_device = AcceleratorDevice.CUDA  # Use GPU if available
            except Exception as e:
                print(f"⚠️ Failed to initialize GPU: {e}. Falling back to CPU.")
                accelerator_device = AcceleratorDevice.CPU
        else:
            print("🔴 GPU NOT available. Defaulting to CPU.")
            accelerator_device = AcceleratorDevice.CPU

        accelerator_options = AcceleratorOptions(device=accelerator_device)


        # Get the binary stream of the uploaded file
        file_stream = await DataUtils.file_to_binary_stream(file)
        source = DocumentStream(
            name=document_model.document_title,
            stream=file_stream
        )

        # Configure pipeline options for EasyOCR and table structure extraction
        pipeline_options = PdfPipelineOptions(
            ocr_options=EasyOcrOptions(
                lang=["vi", "en"],  # Specify languages for OCR
                use_gpu=torch.cuda.is_available()  # Dynamically enable GPU if available
            ),
            do_table_structure=True,  # Enable advanced table structure parsing
            table_structure_options=TableStructureOptions(
                do_cell_matching=True,
                mode=TableFormerMode.ACCURATE  # Higher accuracy mode for table parsing
            ),
            accelerator_options=accelerator_options  # Set accelerator options (GPU or None)
        )

        # Set up the document converter with PDF and DOCX handling configurations
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
                InputFormat.DOCX: WordFormatOption(pipeline_cls=SimplePipeline)
            }
        )

        # Return an initialized DoclingLoader instance
        return cls(source, converter)

    def lazy_load(self) -> Iterator[Document]:
        """
        Lazy-load documents processed by the configured converter.

        Yields:
            Document: Each converted document represented as a `Document` object.
        """
        # Convert the input document and extract content as markdown
        docling_doc = self.converter.convert(self.source).document
        text = docling_doc.export_to_markdown()

        # Yield the document for downstream processing
        yield Document(
            page_content=str(text),
            metadata={"tag": "content"}
        )

    # Helper function to ensure EasyOCR models download
    @classmethod
    def force_model_download(cls, lang_list, gpu):
        """
        Ensure that the EasyOCR models for detection and recognition are downloaded.

        Args:
            lang_list (list): List of languages EasyOCR should support during OCR.
            gpu (bool): Whether to use GPU acceleration for OCR.
        """
        cache_dir = os.path.expanduser("~/.EasyOCR/")  # Define EasyOCR cache directory
        os.makedirs(cache_dir, exist_ok=True)  # Safely create cache directory if it doesn't exist

        print("🔄 Checking EasyOCR model download...")
        try:
            # Initialize EasyOCR Reader with specified language and GPU support
            reader = Reader(
                lang_list=lang_list,
                gpu=gpu,
                model_storage_directory=cache_dir
            )

            # Force model download by accessing their properties
            reader.detection_models  # This line forces the download of detection models
            reader.recognition_models  # This line forces the download of recognition models

            logger.info("✅ EasyOCR models downloaded and ready!")
            logger.info(f"CUDA Available: {torch.cuda.is_available()}")
            logger.info(f"CUDA Version: {torch.version.cuda}")
            logger.info(f"cuDNN Version: {torch.backends.cudnn.version()}")
            logger.info(f"System Architecture: {platform.machine()}")
        except Exception as e:
            print(f"❌ Failed to pre-download EasyOCR models: {e}")