const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

class FileService {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), "camilladsp-uploads");
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error("Erreur lors de la création du dossier temporaire:", error);
    }
  }

  getHostname(nodeId) {
    // Le nodeId est au format "hostname:port"
    return nodeId.split(":")[0];
  }

  async getFilterFiles(nodeId) {
    try {
      const hostname = this.getHostname(nodeId);
      const { stdout } = await execAsync(
        `ssh pi@${hostname} "ls -1 ~/camilladsp/coeffs"`
      );
      return stdout
        .trim()
        .split("\n")
        .filter((file) => file);
    } catch (error) {
      console.error(
        `Erreur lors de la lecture des fichiers sur ${nodeId}:`,
        error
      );
      throw new Error(`Impossible de lister les fichiers sur ${nodeId}`);
    }
  }

  async uploadFile(nodeId, file) {
    const hostname = this.getHostname(nodeId);
    const tempPath = path.join(this.tempDir, file.originalname);
    try {
      // Sauvegarde temporaire du fichier
      await fs.writeFile(tempPath, file.buffer);

      // Upload via SSH
      await execAsync(
        `scp ${tempPath} pi@${hostname}:~/camilladsp/coeffs/${file.originalname}`
      );

      // Nettoyage
      await fs.unlink(tempPath);

      return { success: true, filename: file.originalname };
    } catch (error) {
      console.error(
        `Erreur lors de l'upload du fichier vers ${nodeId}:`,
        error
      );
      // Nettoyage en cas d'erreur
      try {
        await fs.unlink(tempPath);
      } catch (e) {
        // Ignore les erreurs de nettoyage
      }
      throw new Error(`Impossible d'uploader le fichier vers ${nodeId}`);
    }
  }
}

module.exports = FileService;
