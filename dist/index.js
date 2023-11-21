"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const assetPerkRouter_1 = __importDefault(require("./src/routes/assetPerkRouter"));
//For env File
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8001;
app.get("/", (req, res) => {
    res.send("Welcome to Express & TypeScript Server");
});
app.use("/asset/perk", assetPerkRouter_1.default);
app.listen(port, () => {
    console.log(`Server is live at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map