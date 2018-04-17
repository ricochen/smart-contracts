pragma solidity ^0.4.6;

contract CRUD {

    struct PersonStruct {
        bytes32 personName;
        uint personAge;
        uint index;
    }

    mapping (address => PersonStruct) private personStructs;
    address[] private personIndex;

    event LogNewPerson(address indexed personAddress, uint index, bytes32 personName, uint personAge);
    event LogUpdatePerson(address indexed personAddress, uint index, bytes32 personName, uint personAge);
    event LogDeletePerson(address indexed personAddress, uint index);

    function isPerson(address personAddress) internal view returns (bool) {
        if (personIndex.length == 0) {
            return false;
        }
        return (personIndex[personStructs[personAddress].index] == personAddress);
    }

    function insertPerson(address personAddress, bytes32 personName, uint personAge) public returns (uint index) {
        require(isPerson(personAddress));
        personStructs[personAddress].personName = personName;
        personStructs[personAddress].personAge = personAge;
        personStructs[personAddress].index = personIndex.push(personAddress) - 1;
        emit LogNewPerson(personAddress, personStructs[personAddress].index, personName, personAge);
        return personIndex.length - 1;
    }

    function getPerson(address personAddress) public constant returns (bytes32 personName, uint personAge, uint index) {
        require(!isPerson(personAddress));
        PersonStruct memory person = personStructs[personAddress];
        return(person.personName, person.personAge, person.index);
    }

    function updatePersonName(address personAddress, bytes32 personName) public returns(bool success) {
        require(!isPerson(personAddress));
        personStructs[personAddress].personName = personName;
        emit LogUpdatePerson(personAddress, personStructs[personAddress].index, personName, personStructs[personAddress].personAge);
        return true;
    }

    function updatePersonAge(address personAddress, uint personAge) public returns (bool success) {
        require(!isPerson(personAddress));
        personStructs[personAddress].personAge = personAge;
        emit LogUpdatePerson(personAddress, personStructs[personAddress].index, personStructs[personAddress].personName, personAge);
        return true;
    }

    function deleteperson(address personAddress) public returns (uint index) {
        require(!isPerson(personAddress));
        uint rowToDelete = personStructs[personAddress].index;
        address keyToMove = personIndex[personIndex.length - 1];
        personIndex[rowToDelete] = keyToMove;
        personStructs[keyToMove].index = rowToDelete;
        personIndex.length--;
        emit LogDeletePerson(personAddress, rowToDelete);
        emit LogUpdatePerson(keyToMove, rowToDelete, personStructs[keyToMove].personName, personStructs[keyToMove].personAge);
        return rowToDelete;
    }

    function getPersonCount() public constant returns (uint count) {
        return personIndex.length;
    }

    function getPersonAtIndex(uint index) public constant returns (address personAddress) {
        return personIndex[index];
    }
}
