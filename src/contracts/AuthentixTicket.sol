// SPDX-License-Identifier: MIT
// AuthentixTicket.sol — Sample ERC721 Smart Contract for NFT Ticketing
//
// This is a sample Solidity smart contract for Authentix NFT tickets.
// Deploy this to Ethereum, Polygon, or any EVM-compatible chain.
//
// Prerequisites:
//   - OpenZeppelin Contracts: npm install @openzeppelin/contracts
//   - Hardhat or Truffle for deployment
//
// Usage:
//   1. Deploy the contract to your chosen network
//   2. Call mintTicket(to, tokenURI) to mint a ticket NFT
//   3. The tokenURI should point to IPFS or a metadata server with ticket details
//
// pragma solidity ^0.8.20;
//
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
//
// contract AuthentixTicket is ERC721, ERC721URIStorage, Ownable {
//     uint256 private _nextTokenId;
//
//     // Event emitted when a ticket is minted
//     event TicketMinted(address indexed to, uint256 indexed tokenId, string eventId);
//
//     constructor() ERC721("AuthentixTicket", "ATIX") Ownable(msg.sender) {}
//
//     /**
//      * @dev Mint a new ticket NFT
//      * @param to The recipient address
//      * @param uri The metadata URI (IPFS or API endpoint)
//      * @return tokenId The minted token ID
//      */
//     function mintTicket(address to, string memory uri) public onlyOwner returns (uint256) {
//         uint256 tokenId = _nextTokenId++;
//         _safeMint(to, tokenId);
//         _setTokenURI(tokenId, uri);
//         return tokenId;
//     }
//
//     /**
//      * @dev Verify if an address owns a specific ticket
//      * @param owner The address to check
//      * @param tokenId The token ID to verify
//      * @return bool Whether the address owns the token
//      */
//     function verifyTicketOwnership(address owner, uint256 tokenId) public view returns (bool) {
//         return ownerOf(tokenId) == owner;
//     }
//
//     // Required overrides for ERC721URIStorage
//     function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
//         return super.tokenURI(tokenId);
//     }
//
//     function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
//         return super.supportsInterface(interfaceId);
//     }
// }
