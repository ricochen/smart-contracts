# ERC20 template

## Instructions

`git clone https://github.com/ricochen/smart-contracts.git`

`npm install` 

## Contracts

`ERC20Token.sol` is ERC20-compatible and has the following characteristics:

1. A fixed supply of pre-minted tokens
2. The ability to burn tokens by a token holder, removing the tokens from the total supply
3. Tokens are allocated upon conclusion of the Initial Coin Offering. `ERC20TokenICO.sol` is given an allowance of tokens to be sold during the ICO