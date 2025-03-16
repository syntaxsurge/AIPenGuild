import NFTMarketplaceArtifact from "../artifacts/solidity/NFTMarketplace.sol/NFTMarketplace.json"
import RewardPoolArtifact from "../artifacts/solidity/RewardPool.sol/RewardPool.json"
import UserExperienceArtifact from "../artifacts/solidity/UserExperience.sol/UserExperience.json"
import NFTCreatorCollectionArtifact from "../artifacts/solidity/NFTCreatorCollection.sol/NFTCreatorCollection.json"

// Use .abi to ensure we pass an array-based ABI
export const ABIS = {
  NFTMarketplace: NFTMarketplaceArtifact.abi,
  RewardPool: RewardPoolArtifact.abi,
  UserExperience: UserExperienceArtifact.abi,
  NFTCreatorCollection: NFTCreatorCollectionArtifact.abi
}