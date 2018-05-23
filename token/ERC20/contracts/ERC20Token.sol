pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";


/**
 * @title RicoToken
 * @dev A standard, burnable ERC20 token with additional functionalities:
 * Transfers are only enabled after contract owner enables it (after the ICO)
 * Contract sets 55% of the total supply as allowance for ICO contract
 */
contract RicoToken is StandardToken, BurnableToken, Ownable {
    string public constant name = "Rico Token";
    string public constant symbol = "RICO";
    uint8 public constant decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 21000000 * (10 ** uint256(decimals));
    uint256 public constant ICO_ALLOWANCE = 11550000 * (10 ** uint256(decimals));
    uint256 public constant ADMIN_ALLOWANCE = INITIAL_SUPPLY - ICO_ALLOWANCE;

    // Address of admin
    address public adminAddr;
    // Address of ICO
    address public ICOAddr;
    // Enable token transfers after ICO
    bool public transferEnabled = false;

    /**
     * @dev Check if token transfer is allowed
     */
    modifier onlyWhenTransferEnabled() {
        require(transferEnabled || msg.sender == adminAddr || msg.sender == ICOAddr);
        _;
    }

    /**
     * @dev Check if ICO address is set
     */
    modifier onlyWhenICOAddrNotSet() {
        require(ICOAddr == address(0));
        _;
    }

    /**
     * @dev Check if the address is a valid destination to transfer tokens to
     * @param _to The address to transfer tokens to
     * The zero address is not valid
     * The contract itself should not receive tokens
     * The owner has all the initial tokens, but cannot receive any back
     * The admin has an allowance of tokens to transfer, but does not receive any
     * The ICO has an allowance of tokens to transfer, but does not receive any
     */
    modifier validDestination(address _to) {
        require(_to != address(0));
        require(_to != address(this));
        require(_to != owner);
        require(_to != adminAddr);
        require(_to != ICOAddr);
        _;
    }

    /**
     * @dev constructor
     * @param _admin The address of the admin
     */
    constructor(address _admin) public {
        totalSupply_ = INITIAL_SUPPLY;

        // Mint tokens
        balances[msg.sender] = totalSupply_;
        emit Transfer(address(0), msg.sender, totalSupply_);

        // Approve allowance for admin
        adminAddr = _admin;
        approve(adminAddr, ADMIN_ALLOWANCE);
    }

    /**
     * @dev Set ICO contract address and approves an allowance of tokens from the ICO allowance supply to transfer tokens
     * @param _ICOAddr The address of the ICO contract
     * @param _amountForSale The amount of tokens for sale in the ICO
     * @return A boolean value specifying whether setting the ICO was successful
     */
    function setICO(address _ICOAddr, uint256 _amountForSale) external onlyOwner onlyWhenICOAddrNotSet returns (bool) {
        require(!transferEnabled);

        // If _amountForSale is 0, then the full ICO allowance supply is made available in the ICO
        uint256 amount = (_amountForSale == 0) ? ICO_ALLOWANCE : _amountForSale;
        require(amount <= ICO_ALLOWANCE);

        ICOAddr = _ICOAddr;
        approve(ICOAddr, amount);
        return true;
    }

    /**
     * @dev Enables any token holder to transfer tokens after the ICO
     * Once enabled cannot be disabled
     */
    function enableTransfer() external onlyOwner {
        transferEnabled = true;

        // End the ICO
        approve(ICOAddr, 0);
    }

    /**
     * @dev Overrides ERC20 transfer function with modifier that only allows token transfers when transferEnabled and checks destination
     * @param _to The address to transfer tokens to
     * @param _value The amount of tokens to transfer
     * @return A boolean value specifying whether the transfer was successful
     */
    function transfer(address _to, uint256 _value) public onlyWhenTransferEnabled validDestination(_to) returns (bool) {
        return super.transfer(_to, _value);
    }

    /**
     * @dev Overrides ERC20 transferFrom function with modifier that only allows token transfers when transferEnabled and checks destination
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to
     * @param _value The amount of tokens to transfer
     * @return A boolean value specifying whether the transfer was successful
     */
    function transferFrom(address _from, address _to, uint256 _value) public onlyWhenTransferEnabled validDestination(_to) returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * @dev Overrides the burn function to only be called when transferEnabled
     * @param _value The amount of tokens to burn
     */
    function burn(uint256 _value) public {
        require(transferEnabled || msg.sender == owner);
        super.burn(_value);
    }
}
