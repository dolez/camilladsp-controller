const express = require("express");
const router = express.Router();
const multer = require("multer");
const FileService = require("../../services/files/FileService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

const fileService = new FileService();

// Liste les fichiers disponibles pour un node
router.get("/files/:nodeName", async (req, res) => {
  try {
    const files = await fileService.getFilterFiles(req.params.nodeName);
    res.json(files);
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    res.status(500).json({ error: error.message });
  }
});

// Upload un fichier pour un node
router.post("/upload/:nodeName", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("Aucun fichier fourni");
    }

    const result = await fileService.uploadFile(req.params.nodeName, req.file);
    res.json(result);
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
