"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { CONTRACTS } from "../../constants/contracts";
// import EOAManagerService from "../EOAManagerService/EOAManagerService";
// import { ERC725, ERC725JSONSchema } from "@erc725/erc725.js";
// import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
// import { DecodeDataOutput } from "@erc725/erc725.js/build/main/src/types/decodeData";
// import { EncodeDataReturn } from "@erc725/erc725.js/build/main/src/types/encodeData/JSONURL";
// import { GetDataDynamicKey } from "@erc725/erc725.js/build/main/src/types/GetData";
/*
 * This service is responsible for:
 *  - adding new perks to LSP8 contracts
 *     - Encoding perk with LSP2 standard
 *     - Upload perk metadata to IPFS
 *     - Upload attributes file to IPFS to update perks LSP4NFTMetadata attributes
 *     - Add perk metadata to LSP8 contract
 *
 *
 */
class PerkService {
    // load the EOAService for deployment
    constructor() {
        this._state = "Not Ready";
        this.checkCount = 0;
        // this._initializeService();
    }
}
exports.default = new PerkService();
//# sourceMappingURL=PerkService.js.map