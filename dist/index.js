"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
require('dotenv').config();
// Services
const AssetService_1 = __importDefault(require("./src/services/AssetService/AssetService"));
// Routers
const assetPerkRouter_1 = __importDefault(require("./src/routes/assetPerkRouter"));
const assetRouter_1 = __importDefault(require("./src/routes/assetRouter"));
//Tables
const AssetTableUtil_1 = __importDefault(require("./src/services/AssetService/utils/AssetTableUtil"));
const PerkTableUtil_1 = __importDefault(require("./src/services/AssetService/utils/tables/PerkTableUtil"));
const assetTableUtil = AssetTableUtil_1.default;
const perkTableUtil = PerkTableUtil_1.default;
const app = (0, express_1.default)();
const port = process.env.PORT || 8001;
// To allow specific origin
app.use((0, cors_1.default)()); // Allow all origins for now
app.options('*', (0, cors_1.default)()); // Allow all origins for now
//   {
//   origin: [
//     'http://localhost:3000', // For local development
//     `${process.env.FRONTEND_URL}`, // For production
//   ],
// }
// Loading Singleton Services
const assetService = AssetService_1.default;
// Routes
app.use('/asset/perk', assetPerkRouter_1.default); // (in progress, mocked request) addition of perks to assets, and (TODO) redemption of perks
app.use('/asset', assetRouter_1.default); // returns all assets from the database
// Start the server
app.listen(port, () => {
    console.log(`Server is live at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map