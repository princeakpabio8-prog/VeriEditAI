// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TruthBadge
 * @dev ERC-721 NFT for VeriEdit AI verified claims
 * Each badge represents a verified claim with ≥75% trust score
 */
contract TruthBadge is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping from verification ID to token ID (prevent duplicate badges)
    mapping(string => uint256) public verificationToToken;
    
    // Mapping to track if a verification ID has been minted
    mapping(string => bool) public verificationMinted;
    
    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string verificationId,
        uint256 trustScore,
        string metadataURI
    );
    
    constructor() ERC721("VeriEdit Truth Badge", "TRUTH") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start token IDs from 1
    }
    
    /**
     * @dev Mint a new Truth Badge
     * @param to Recipient wallet address
     * @param verificationId Unique verification ID from VeriEdit AI
     * @param trustScore Trust score (must be ≥75)
     * @param metadataURI IPFS URI with badge metadata
     */
    function mintBadge(
        address to,
        string memory verificationId,
        uint256 trustScore,
        string memory metadataURI
    ) public onlyOwner returns (uint256) {
        require(trustScore >= 75, "Trust score must be >= 75");
        require(!verificationMinted[verificationId], "Badge already minted for this verification");
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        verificationToToken[verificationId] = tokenId;
        verificationMinted[verificationId] = true;
        
        emit BadgeMinted(tokenId, to, verificationId, trustScore, metadataURI);
        
        return tokenId;
    }
    
    /**
     * @dev Check if a verification has been minted
     */
    function isMinted(string memory verificationId) public view returns (bool) {
        return verificationMinted[verificationId];
    }
    
    /**
     * @dev Get token ID for a verification
     */
    function getTokenId(string memory verificationId) public view returns (uint256) {
        require(verificationMinted[verificationId], "Verification not minted");
        return verificationToToken[verificationId];
    }
    
    /**
     * @dev Get total supply of badges
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
