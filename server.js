import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3e3;
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));
app.get(["/admin", "/admin.html", "/admin/*"], (_req, res) => {
  res.sendFile(path.resolve(distPath, "admin.html"), (err) => {
    if (err) {
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
});
app.get("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Black Zone production server listening on port ${PORT}`);
});
