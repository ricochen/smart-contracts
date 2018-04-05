pragma solidity 0.4.21;


contract MultiSigWallet {

    address private _owner;
    mapping(address => uint8) private _owners;

    uint private _transactionIdx;
    uint[] private _pendingTransactions;

    struct Transaction {
        address from;
        address to;
        uint amount;
        uint8 signatureCount;
        mapping (address => bool) signatures;
    }

    mapping (uint => Transaction) private _transactions;
    uint8 constant private SIGNATURE_REQUIRED_COUNT = 2;

    modifier validOwner() {
        require(msg.sender == _owner || _owners[msg.sender] == 1);
        _;
    }

    event LogDepositFunds(address from, uint amount);
    event LogTransactionCreated(address from, address to, uint amount, uint transactionId);
    event LogTransactionCompleted(address from, address to, uint amount, uint transactionId);
    event LogTransactionSigned(address by, uint transactionId);

    function MultiSigWallet() public {
        _owner = msg.sender;
    }

    function () public payable {
        emit LogDepositFunds(msg.sender, msg.value);
    }

    function addOwner(address owner) public validOwner {
        _owners[owner] = 1;
    }

    function removeOwner(address owner) public validOwner {
        _owners[owner] = 0;
    }

    function withdraw(uint amount) public validOwner {
        transferTo(msg.sender, amount);
    }

    function transferTo(address to, uint amount) public validOwner {
        require(address(this).balance >= amount);
        uint transactionId = _transactionIdx++;

        Transaction memory transaction;
        transaction.from = msg.sender;
        transaction.to = to;
        transaction.amount = amount;
        transaction.signatureCount = 0;

        _transactions[transactionId] = transaction;
        _pendingTransactions.push(transactionId);

        emit LogTransactionCreated(msg.sender, to, amount, transactionId);
    }

    function getPendingTransactions() public view validOwner returns (uint[]) {
        return _pendingTransactions;
    }

    function signTransaction(uint transactionId) public validOwner {

        Transaction storage transaction = _transactions[transactionId];

        // Transaction must exist
        require(0x0 != transaction.from);
        // Creator cannot sign the transaction
        require(msg.sender != transaction.from);
        // Has not already signed this transaction
        require(transaction.signatures[msg.sender] == false);

        transaction.signatures[msg.sender] = true;
        transaction.signatureCount++;

        emit LogTransactionSigned(msg.sender, transactionId);

        if (transaction.signatureCount >= SIGNATURE_REQUIRED_COUNT) {
            require(address(this).balance >= transaction.amount);
            transaction.to.transfer(transaction.amount);
            emit LogTransactionCompleted(transaction.from, transaction.to, transaction.amount, transactionId);
            deleteTransaction(transactionId);
        }
    }

    function deleteTransaction(uint transactionId) public validOwner {
        bool replace = false;
        for (uint i = 0; i < _pendingTransactions.length; i++) {
            if (replace == true) {
                _pendingTransactions[i-1] = _pendingTransactions[i];
            } else if (transactionId == _pendingTransactions[i]) {
                replace = true;
            }
        }

        assert(replace == true);
        delete _pendingTransactions[_pendingTransactions.length - 1];
        _pendingTransactions.length--;
        delete _transactions[transactionId];
    }

    function getPendingTransactionLength() public view returns (uint) {
        return _pendingTransactions.length;
    }

    function walletBalance() public constant returns (uint) {
        return address(this).balance;
    }
}