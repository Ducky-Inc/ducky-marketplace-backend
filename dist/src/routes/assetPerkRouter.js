"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const assetPerkController_1 = require("../controllers/assetPerkController");
const router = express_1.default.Router();
router.post('/add', assetPerkController_1.addPerk);
exports.default = module.exports = router;
//# sourceMappingURL=assetPerkRouter.js.map