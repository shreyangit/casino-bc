// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/*
  BettingEscrow.sol (Remix-compatible)
  ------------------------------------
  A decentralized betting escrow system where multiple players deposit a fixed amount.
  When all have deposited, the pot is locked.
  A verifier or owner can then release the total pot to the winner.
  Includes reentrancy protection, ownership, refund, and event logging.
*/

// ✅ OpenZeppelin imports (use installed @openzeppelin/contracts in your project)
// Local lightweight ReentrancyGuard and Ownable implementations to avoid external imports

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 * This is a minimal, local version compatible with Solidity ^0.8.x.
 */
abstract contract ReentrancyGuard {
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/**
 * @dev Minimal Ownable implementation.
 */
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }
}

contract BettingEscrow is ReentrancyGuard, Ownable {
    // --- Events ---
    event Deposited(address indexed player, uint256 amount);
    event PotLocked(uint256 totalPot, uint256 timestamp);
    event Payout(address indexed winner, uint256 amount);
    event Refund(address indexed player, uint256 amount);
    event PlayerRemoved(address indexed player);

    // --- State ---
    uint256 public betAmount;                 // required bet per player (in wei)
    address[] public players;                 // list of players expected
    mapping(address => bool) public deposited; // whether a player has deposited
    mapping(address => uint256) public balances; // how much each deposited
    uint256 public totalPot;                  // total ETH held for this round
    bool public locked;                       // whether pot is locked
    uint256 public requiredCount;             // how many players required
    address public verifier;                  // trusted verifier

    // --- Modifiers ---
    modifier onlyPlayer() {
        require(_isPlayer(msg.sender), "Not a registered player");
        _;
    }

    modifier notLocked() {
        require(!locked, "Pot already locked");
        _;
    }

    modifier onlyVerifierOrOwner() {
        require(msg.sender == verifier || msg.sender == owner(), "Not verifier or owner");
        _;
    }

    // --- Constructor ---
    constructor(address[] memory _players, uint256 _betAmountWei, address _verifier) {
        require(_players.length >= 2, "Need at least 2 players");
        require(_betAmountWei > 0, "Bet must be > 0");

        players = _players;
        requiredCount = _players.length;
        betAmount = _betAmountWei;
        verifier = _verifier;
    }

    // --- Player deposit ---
    function deposit() external payable onlyPlayer notLocked nonReentrant {
        require(msg.value == betAmount, "Send exact betAmount");
        require(!deposited[msg.sender], "Already deposited");

        deposited[msg.sender] = true;
        balances[msg.sender] = msg.value;
        totalPot += msg.value;

        emit Deposited(msg.sender, msg.value);

        if (_depositsCount() == requiredCount) {
            locked = true;
            emit PotLocked(totalPot, block.timestamp);
        }
    }

    // --- Internal: count deposits ---
    function _depositsCount() internal view returns (uint256 count) {
        for (uint256 i = 0; i < players.length; i++) {
            if (deposited[players[i]]) count++;
        }
    }

    // --- Admin functions ---
    function setVerifier(address _verifier) external onlyOwner {
        verifier = _verifier;
    }

    // --- Winner payout ---
    function payout(address winner) external nonReentrant onlyVerifierOrOwner {
        require(locked, "Pot not locked");
        require(_isPlayer(winner), "Winner not a player");
        require(totalPot > 0, "No funds to payout");

        uint256 amount = totalPot;
        _resetRound();

        (bool success, ) = winner.call{ value: amount }("");
        require(success, "Transfer failed");

        emit Payout(winner, amount);
    }

    // --- Refund before lock ---
    function refund(address player) external nonReentrant onlyVerifierOrOwner {
        require(!locked, "Cannot refund after lock");
        require(deposited[player], "Player did not deposit");

        uint256 amt = balances[player];
        balances[player] = 0;
        deposited[player] = false;
        totalPot -= amt;

        (bool sent, ) = player.call{ value: amt }("");
        require(sent, "Refund failed");

        emit Refund(player, amt);
    }

    // --- Remove player before lock ---
    function removePlayer(address player) external onlyOwner notLocked {
        require(_isPlayer(player), "Not a player");

        uint index = type(uint).max;
        for (uint i = 0; i < players.length; i++) {
            if (players[i] == player) {
                index = i;
                break;
            }
        }
        require(index != type(uint).max, "Player not found");

        players[index] = players[players.length - 1];
        players.pop();
        requiredCount = players.length;

        emit PlayerRemoved(player);
    }

    // --- Internal helpers ---
    function _isPlayer(address addr) internal view returns (bool) {
        for (uint i = 0; i < players.length; i++) {
            if (players[i] == addr) return true;
        }
        return false;
    }

    function _resetRound() internal {
        for (uint i = 0; i < players.length; i++) {
            deposited[players[i]] = false;
            balances[players[i]] = 0;
        }
        totalPot = 0;
        locked = false;
    }

    // --- View functions for frontend ---
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function depositsCount() external view returns (uint256) {
        return _depositsCount();
    }

    // --- Prevent random ETH sends ---
    receive() external payable {
        revert("Use deposit()");
    }
}
