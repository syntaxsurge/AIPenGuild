import AINFTExchangeArtifact from "../artifacts/solidity/AINFTExchange.sol/AINFTExchange.json"
import AIRewardPoolArtifact from "../artifacts/solidity/AIRewardPool.sol/AIRewardPool.json"
import AIExperienceArtifact from "../artifacts/solidity/AIExperience.sol/AIExperience.json"
import AICreatorCollectionArtifact from "../artifacts/solidity/AICreatorCollection.sol/AICreatorCollection.json"

// Use .abi to ensure we pass an array-based ABI
export const ABIS = {
  AINFTExchange: AINFTExchangeArtifact.abi,
  AIRewardPool: AIRewardPoolArtifact.abi,
  AIExperience: AIExperienceArtifact.abi,
  CreatorCollection: AICreatorCollectionArtifact.abi
}