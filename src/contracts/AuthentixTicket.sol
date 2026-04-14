// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Deployed on Sepolia Testnet
// Contract Address: 0xAa2b8C38b214A0dC8467f76f75aff17B4b371Ac7
// Verified on Sourcify & Routescan

contract EventTicket {
    uint public ticketCount = 0;

    struct Ticket {
        uint id;
        string eventName;
        address owner;
    }

    mapping(uint => Ticket) public tickets;

    function buyTicket(string memory _eventName) public {
        ticketCount++;
        tickets[ticketCount] = Ticket(
            ticketCount,
            _eventName,
            msg.sender
        );
    }

    function getTicket(uint _id) public view returns (string memory, address) {
        return (
            tickets[_id].eventName,
            tickets[_id].owner
        );
    }
}