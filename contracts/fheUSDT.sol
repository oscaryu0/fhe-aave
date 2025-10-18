// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";

contract fheUSDT is ERC7984, SepoliaConfig {
    constructor() ERC7984("fUSDT", "fUSDT", "") {}

    function faucet(address to, uint64 amount) public {
        euint64 encryptAmount = FHE.asEuint64(amount);
        _mint(to, encryptAmount);
    }
}
