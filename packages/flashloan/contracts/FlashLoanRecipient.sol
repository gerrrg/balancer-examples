// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.7.0;

import "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol";
import "@balancer-labs/v2-interfaces/contracts/vault/IFlashLoanRecipient.sol";

contract FlashLoanRecipient is IFlashLoanRecipient {
    IVault private immutable VAULT;

    constructor(IVault vault) {
        VAULT = vault;
    }

    function makeFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external {
      VAULT.flashLoan(this, tokens, amounts, userData);
    }

    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory /* userData */
    ) external override {
        // Note: this check is crucial. If you do not validate that the Vault is calling this function,
        // a malicious address can directly steal your tokens.
        require(IVault(msg.sender) == VAULT);
        
        // Uncomment and decode userData if you want to use it for something
        // uint256 arg = userData.decode();

        // do something
        // ...

        // repay loan to the Vault
        _returnTokensToVault(tokens, amounts, feeAmounts);
    }

    function _returnTokensToVault(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts
    ) internal { 
        for (uint256 i = 0; i < tokens.length; ++i) {
            IERC20 token = tokens[i];
            uint256 amount = amounts[i] + feeAmounts[i];
            token.transfer(address(VAULT), amount);
        }
    }
}
