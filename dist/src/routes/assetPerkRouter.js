"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/add", (req, res) => {
    try {
        const { addPerkDTO } = req.body; //get perkName, metadata (perk Description, perk Price, perk Quantity, perk Image)
        const { assetAddress, perkName, metadata } = addPerkDTO;
        const result = perkService.addPerk(assetAddress, perkName, metadata);
        return res.send("Add Asset Perk");
        // void redeem(req, res);
    }
    finally {
    }
});
exports.default = module.exports = router;
//# sourceMappingURL=assetPerkRouter.js.map