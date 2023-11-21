import express from "express";
import { addPerk } from "../controllers/assetPerkController";

const router = express.Router();

router.post("/add", addPerk);

export default module.exports = router as express.Router;
