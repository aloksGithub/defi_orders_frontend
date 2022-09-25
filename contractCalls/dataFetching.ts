import { ethers } from "ethers";
import erc20Abi from "../constants/abis/ERC20.json"

export const fetchPositions = async (contracts, signer) => {
  const account = await signer.getAddress()
  const numPositions = await contracts.positionManager.numUserPositions(account)
  const positions = []
  const positionsArray = Array.from(Array(numPositions.toNumber()).keys())
  const positionsData = positionsArray.map(i=> 
    contracts.positionManager.userPositions(account, i).then(async (position)=>{
      const positionData = await contracts.positionManager.getPosition(position.toNumber())
      const usdcValue = await contracts.positionManager.callStatic.closeToUSDC(position.toNumber())
      const usdcDecimals = await contracts.usdcContract.decimals()
      const bankDetails = await contracts.banks[positionData.bankId.toNumber()].decodeId(positionData.bankToken)
      const rewards = await contracts.banks[positionData.bankId.toNumber()].getRewards(positionData.bankToken)
      let name
      try {
        const depositedAsset = new ethers.Contract(bankDetails[0], erc20Abi, signer)
        name = await depositedAsset.name()
      } catch {
        const depositedAsset = new ethers.Contract(bankDetails[1], erc20Abi, signer)
        name = await depositedAsset.name()
      }
      let underlying = await contracts.universalSwap.callStatic.getUnderlying(bankDetails[0])
      underlying = await Promise.all(underlying.map(async (token) => {
        const contract = new ethers.Contract(token, erc20Abi, signer)
        const name = await contract.name()
        return name
      }))
      const newPosition = {positionId: position.toNumber(), positionData, tokenContract:bankDetails[0], name, usdcValue: usdcValue.div(ethers.utils.parseUnits("1.0", usdcDecimals)).toString(), rewards, underlying}
      positions.push(newPosition)
    })
  )
  await Promise.all(positionsData)
  return positions
}

export const fetchPosition = async (id:number, contracts, signer) => {
  const positionData = await contracts.positionManager.getPosition(id)
  const usdcValue = await contracts.positionManager.callStatic.closeToUSDC(id)
  const usdcDecimals = await contracts.usdcContract.decimals()
  const bankDetails = await contracts.banks[positionData.bankId.toNumber()].decodeId(positionData.bankToken)
  const rewards = await contracts.banks[positionData.bankId.toNumber()].getRewards(positionData.bankToken)
  let name
  try {
    const depositedAsset = new ethers.Contract(bankDetails[0], erc20Abi, signer)
    name = await depositedAsset.name()
  } catch {
    const depositedAsset = new ethers.Contract(bankDetails[1], erc20Abi, signer)
    name = await depositedAsset.name()
  }
  let underlying = await contracts.universalSwap.callStatic.getUnderlying(bankDetails[0])
  underlying = await Promise.all(underlying.map(async (token) => {
    const contract = new ethers.Contract(token, erc20Abi, signer)
    const name = await contract.name()
    return name
  }))
  const position = {positionId: id, positionData, tokenContract:bankDetails[0], name, usdcValue: usdcValue.div(ethers.utils.parseUnits("1.0", usdcDecimals)).toString(), rewards, underlying}
  return position
}

export const getRewards = async (contracts) => {

}