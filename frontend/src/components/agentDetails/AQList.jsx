import { useState } from "react";
import { List, ListItem, ListItemText, TextField, IconButton, Button, Typography, Box } from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, Add as AddIcon } from "@mui/icons-material";
import Markdown from "markdown-to-jsx";

const AQList = ({ aqList, setAqList, currentDocument, isViewOnly }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [newAQ, setNewAQ] = useState({ header: "", content: "" });

  // Xử lý sửa AQ
  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  // Xử lý lưu AQ đã chỉnh sửa
  const handleSave = (index, updatedAQ) => {
    const updatedList = [...aqList];
    updatedList[index] = updatedAQ;
    setAqList(updatedList);
  };

  // Xử lý xóa AQ
  const handleDelete = (index) => {
    setAqList(aqList.filter((_, i) => i !== index));
  };

  // Xử lý thêm AQ mới
  const handleAdd = () => {
    if (newAQ.header.trim() && newAQ.content.trim()) {
      setAqList([...aqList, newAQ]);
      setNewAQ({ header: "", content: "" });
    }
  };

  return (
    <Box>
      <List dense>
        {aqList.map((aq, index) => (
          <ListItem
            key={index}
            sx={{
              boxShadow: "0 0 3px rgba(0,0,0,.5)",
              borderRadius: "8px",
              p: "0.8rem",
              mb: "1rem",
              backgroundColor: "#f9f9f9",
            }}
          >
            {editingIndex === index ? (
              <Box width="100%">
                <TextField
                  fullWidth
                  label="Header"
                  variant="outlined"
                  multiline
                  value={aqList[index].header}
                  onChange={(e) =>
                    handleSave(index, { ...aqList[index], header: e.target.value })
                  }
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  multiline
                  label="Content"
                  variant="outlined"
                  value={aqList[index].content}
                  onChange={(e) =>
                    handleSave(index, { ...aqList[index], content: e.target.value })
                  }
                />
                <IconButton onClick={() => setEditingIndex(null)} sx={{ mt: 1 }}>
                  <SaveIcon color="primary" />
                </IconButton>
              </Box>
            ) : (
              <>
                <ListItemText
                  primary={<Markdown variant="subtitle1" fontWeight="bold">{aq.header}</Markdown>}
                  secondary={<Markdown variant="body2">{aq.content}</Markdown>}
                />
                {!isViewOnly(currentDocument.status, true) &&
                  <>
                    <IconButton onClick={() => handleEdit(index)}>
                      <EditIcon color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(index)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </>}
              </>
            )}
          </ListItem>
        ))}
      </List>

      {/* Form thêm AQ mới */}
      {!isViewOnly(currentDocument.status, true) && <Box display="flex" gap={2} mt={2}>
        <TextField
          label="Header"
          variant="outlined"
          multiline
          fullWidth
          value={newAQ.header}
          onChange={(e) => setNewAQ({ ...newAQ, header: e.target.value })}
        />
        <TextField
          label="Content"
          variant="outlined"
          multiline
          fullWidth
          value={newAQ.content}
          onChange={(e) => setNewAQ({ ...newAQ, content: e.target.value })}
        />
        <Button variant="contained" color="primary" onClick={handleAdd} startIcon={<AddIcon />}>
          Add
        </Button>
      </Box>}
    </Box>
  );
};

export default AQList;
