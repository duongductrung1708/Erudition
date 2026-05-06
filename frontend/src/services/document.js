import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL
// const API_URL = "http://localhost:8000/api/v1";

const chatbot_api = axios.create({
  baseURL: API_URL + "/document",
});

export const update_document_title = async (document_id, newTitle, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json',
    };

    const encodedTitle = encodeURIComponent(newTitle);

    const res = await chatbot_api.put(
      `/update-doc-title?document_id=${document_id}&title=${encodedTitle}`,
      null,
      { headers }
    );

    return res.data;
  } catch (error) {
    console.error("Update title failed:", error.response?.data || error.message);
    return error.response?.data || error.message;
  }
};

export const upload_document = async (chatbot_id, token, data) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const formData = new FormData();
    formData.append('file', data.file);     
    formData.append('title', data.title);  
    const res = await chatbot_api.post(`/${chatbot_id}/document-load-to-markdown`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...headers,
      },
    });
    return res.data
  } catch (error) {
    console.error("Upload failed:", error.response?.data || error.message);
    console.log("Full error response:", error.response);
    return error.response?.data || error.message;
  }
};

export const get_doc_content = async (document_id, token) => {
  const res = await chatbot_api.get(`/get-original-content?document_id=${document_id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data
}

export const save_document_content = async (document_id, data,  token) => {
  const payload = {
    data                  
  };
  const res = await chatbot_api.put(`/update-original-content?document_id=${document_id}`, JSON.stringify({ payload }), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data
}

export const delete_document = async (chatbot_id, token, document_id) => {
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const res = await chatbot_api.delete(
    `/${chatbot_id}/documents/delete/?document_id=${document_id}`,
    {
      headers: {
        ...headers,
      },
    }
  );
  return res.data;
};

export const get_aqs_data = async (document_id) => {
  const res = await chatbot_api.get(`/get_aqs_data?document_id=${document_id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.data
}

export const save_qas_data = async (document_id, data) => {
  try {
    const payload = {
      data                  
    };
    const res = await chatbot_api.post(`/save_aqs_data?document_id=${document_id}`, JSON.stringify({ payload }), {
      headers: {
        'Content-Type': 'application/json'
      },
    });
    return res.data
  } catch (error) {
    console.error("Upload failed:", error.response?.data || error.message);
    console.log("Full error response:", error.response);
    return error.response?.data || error.message;
  }
};


export const index_aqs_data = async (document_id, data) => {
  try {
    const payload = {
      data                  
    };
    const res = await chatbot_api.post(`/index_aqs_data?document_id=${document_id}`, JSON.stringify({ payload }), {
      headers: {
        'Content-Type': 'application/json'
      },
    });
    return res.data
  } catch (error) {
    console.error("Upload failed:", error.response?.data || error.message);
    console.log("Full error response:", error.response);
    return error.response?.data || error.message;
  }
};


export const process_document = async (chatbot_id, token, data, newDocument) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const payload = {
      data,                   
      title: newDocument.title,
      use_gen_qa: newDocument.use_gen_qa,
      id: newDocument.id,
    };
    const res = await chatbot_api.post(`/${chatbot_id}/lightrag_upload`, JSON.stringify({ payload }), {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return res.data
  } catch (error) {
    console.error("Upload failed:", error.response?.data || error.message);
    console.log("Full error response:", error.response);
    return error.response?.data || error.message;
  }
};

export const reconstructTables = async (document_id, instruction, token) => {
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const params = new URLSearchParams();
    params.append("document_id", document_id);
    if (instruction) params.append("instruction", instruction);

    const res = await chatbot_api.post(
      `/ai-reconstruct-tables-of-a-document?${params.toString()}`,
      null,
      { headers }
    );

    return res.data;
  } catch (error) {
    console.error("Reconstruct tables failed:", error.response?.data || error.message);
    return error.response?.data || error.message;
  }
};