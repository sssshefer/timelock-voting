// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


contract TimelockVoting {
    uint256 constant MINIMUM_DELAY = 10;
    uint256 constant MAXIMUM_DELAY = 1 days;
    uint256 constant GRACE_PERIOD = 1 days;

    //to check a tx exists by cach fast
    mapping(bytes32 => Transaction) public Transactions;
    struct Transaction {
        bool queued;
        mapping(address => bool) confirmations;
        uint256 confirmationsAmount;
    }
    //to check an owner fast
    mapping(address => bool) public isOwner;
    uint public totalOwnerCount = 0;
    uint256 constant APPROVE_PERCENTAGE = 50;

    constructor(address[] memory _owners) {
        require(_owners.length >= 2, "Minimum number of owners is 2");

        for (uint256 i = 0; i < _owners.length; i++) {
            require(
                _owners[i] != address(0),
                "Don't include zero addresses in the erray"
            );
            require(!isOwner[_owners[i]], "Duplicated owner");
            totalOwnerCount++;
            isOwner[_owners[i]] = true;
        }
    }

    event Queued(bytes32 txCash, uint num);
    event Executed(bytes32 txCash);
    event Discarded(bytes32 txCash);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    function abiEncodeData(string calldata _msg) external pure returns(bytes memory) {
        return abi.encode(_msg);
    }

    function getNextTimestamp() external view returns (uint256) {
        return block.timestamp + 60;
    }

    function addToQueue(
        address _to,
        bytes calldata _func,
        bytes calldata _data,
        uint256 _value,
        uint256 _execTimestamp
    ) external onlyOwner returns(bytes32 txCach) {
        require(
            _execTimestamp >  MINIMUM_DELAY + block.timestamp &&
            _execTimestamp <  MAXIMUM_DELAY + block.timestamp, 
            "Incorrect execution timestamp"
        );
        txCach = keccak256(
            abi.encode(_to, _func, _data, _value, _execTimestamp)
        );
        require(!Transactions[txCach].queued, "Already queued");
        Transactions[txCach].queued = true;
        emit Queued(txCach, 1);
    }

    function execute(
        address _to,
        bytes calldata _func,
        bytes calldata _data,
        uint256 _value,
        uint256 _execTimestamp
    ) external payable onlyOwner returns (bytes memory) {
        bytes32 txCach = keccak256(
            abi.encode(_to, _func, _data, _value, _execTimestamp)
        );
        require(Transactions[txCach].queued, "You need to queue the transaction first");
        require(
            _execTimestamp < block.timestamp ,
            "not ready to be called yet"
        );
        require(
            block.timestamp < _execTimestamp + GRACE_PERIOD,
            "The transaction is expired"
        );
        require(
            Transactions[txCach].confirmationsAmount > totalOwnerCount / 2,
            "Not enough votes"
        );

        bytes memory data;
        if (bytes(_func).length > 0) {
            data = abi.encode(bytes4(keccak256(bytes(_func))), _data);
        } else {
            data = _data;
        }
        delete Transactions[txCach];

        (bool success, bytes memory response) = _to.call{value: _value}(data);
        require(success);
        emit Executed(txCach);
        return response;
    }

    function discard(bytes32 _txCash) external onlyOwner{
        require(Transactions[_txCash].queued, "The transaction is not in the queue");
        delete Transactions[_txCash];
        emit Discarded(_txCash);
    }

    function confirm(bytes32 _txCach) external  onlyOwner {
        require(Transactions[_txCach].queued, "The transaction is not in the queue");
        Transactions[_txCach].confirmationsAmount++;
        Transactions[_txCach].confirmations[msg.sender] = true;
    }

    function cancelConfirmation(bytes32 _txCach) external  onlyOwner {
        require(Transactions[_txCach].queued, "The transaction is not in the queue");
        Transactions[_txCach].confirmationsAmount--;
        Transactions[_txCach].confirmations[msg.sender] = false;
    }
}

contract OtherContract{
    uint public callCount  = 0;
    string public message = "default";
    function someTestFunc(string memory _message) external {
        callCount ++;
        message = _message;
    } 
}