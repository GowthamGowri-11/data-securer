// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DataIntegrity {
    struct DataRecord {
        string hash;
        string encryptedData;
        uint256 timestamp;
        address submitter;
    }
    
    DataRecord[] public records;
    
    event DataStored(uint256 indexed id, string hash, uint256 timestamp);
    
    function storeData(
        string memory _hash,
        string memory _encryptedData,
        uint256 _timestamp
    ) public returns (uint256) {
        DataRecord memory newRecord = DataRecord({
            hash: _hash,
            encryptedData: _encryptedData,
            timestamp: _timestamp,
            submitter: msg.sender
        });
        
        records.push(newRecord);
        uint256 id = records.length - 1;
        
        emit DataStored(id, _hash, _timestamp);
        
        return id;
    }
    
    function getData(uint256 _id) public view returns (
        string memory hash,
        string memory encryptedData,
        uint256 timestamp
    ) {
        require(_id < records.length, "Invalid ID");
        DataRecord memory record = records[_id];
        return (record.hash, record.encryptedData, record.timestamp);
    }
    
    function getDataCount() public view returns (uint256) {
        return records.length;
    }
}
