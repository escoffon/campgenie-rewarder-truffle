pragma solidity ^0.4.23;

import 'campgenie-base-contracts/contracts/CGTokenBase.sol';

/**
 * @title CampGenieTokenTester
 * @dev Test ERC20 token for the CampGenie sample Truffle box.
 */

contract CampGenieTokenTester is CGTokenBase {
    /**
     * Constructor function
     *
     * Initializes contract with initial supply tokens to the creator of the contract.
     * @param initialSupplyValue The initial supply of tokens, in units of tokens.
     * @param tokenDecimals The number of decimals in the currency; controls how finely a token is split.
     */
    constructor(uint256 initialSupplyValue, uint8 tokenDecimals)
        public
        CGTokenBase(initialSupplyValue, tokenDecimals, "CampGenieTokenTester", "CGTT")
    {
    }
}
