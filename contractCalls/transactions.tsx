import { BigNumber, ethers } from "ethers";
import erc20Abi from "../constants/abis/ERC20.json"
import npmAbi from "../constants/abis/INonFungiblePositionsManager.json"
import { getPrice, getTokenDetails } from "../utils";
import { getAmountsOut } from "./dataFetching";

export const depositNew = async (contracts, signer, position, asset) => {
  const account = await signer.getAddress()
  let tx: ethers.Transaction
  if (asset.contract_address!=ethers.constants.AddressZero) {
    const contract = new ethers.Contract(asset.contract_address, erc20Abi, signer)
    const currentApproval = await contract.allowance(account, contracts.positionManager.address)
    if (currentApproval<position.amount) {
      await contract.approve(contracts.positionManager.address, position.amount)
    }
    tx = await contracts.positionManager["deposit((address,uint256,uint256,uint256,(address,address,bool,uint256)[]),address[],uint256[])"]
    (position, [asset.contract_address], [position.amount])
  } else {
    tx = await contracts.positionManager["deposit((address,uint256,uint256,uint256,(address,address,bool,uint256)[]),address[],uint256[])"]
    (position, [], [], {value: position.amount})
  }
  return tx.hash
}

export const swap = async (contracts, signer, provided, desired, swaps, conversions, expectedAssets) => {
  const account = await signer.getAddress()
  let ethSupplied = ethers.BigNumber.from('0')
  for (const [i, token] of provided.tokens.entries()) {
    if (token!=ethers.constants.AddressZero) {
      const assetContract = new ethers.Contract(token, erc20Abi, signer)
      const tokensSupplied = provided.amounts[i]
      const currentAllowance = await assetContract.allowance(account, contracts.universalSwap.address)
      if (currentAllowance<tokensSupplied) {
        await assetContract.approve(contracts.universalSwap.address, tokensSupplied)
      }
    } else {
      ethSupplied =provided.amounts[i]
    }
  }
  for (const nft of provided.nfts) {
    const manager = new ethers.Contract(nft.manager, npmAbi, signer)
    await manager.approve(contracts.universalSwap.address, nft.tokenId)
  }
  const addressZeroIndex = provided.tokens.findIndex(token=>token===ethers.constants.AddressZero)
  if (addressZeroIndex>-1) {
      provided.tokens.splice(addressZeroIndex, 1)
      provided.amounts.splice(addressZeroIndex, 1)
  }
  
  const tx = await contracts.universalSwap.swap(provided, swaps, conversions, desired, account, {value:ethSupplied})
  const hash = tx.hash
  const rc = await tx.wait()
  const event = rc.events?.find((event:any) => event.event === 'AssetsSent')
  // @ts-ignore
  const [receiver, tokens, managers, amountsAndIds] = event!.args
  for (const [index, asset] of expectedAssets.entries()) {
    if (index<tokens.length) {
      const amountObtained = +ethers.utils.formatUnits(amountsAndIds[index], asset.contract_decimals)
      asset.value = asset.value*amountObtained/asset.amount
      asset.amount = amountObtained
    } else {
      const manager = new ethers.Contract(asset.contract_address, npmAbi, signer)
      const {liquidity} = await manager.positions(amountsAndIds[index])
      const amountObtained = +ethers.utils.formatUnits(liquidity, asset.contract_decimals)
      asset.value = asset.value*amountObtained/asset.amount
      asset.amount = amountObtained
    }
  }
  return {expectedAssets, hash}
}

export const depositAgain = async (contracts, signer, position, assetsToConvert, chainId, slippage) => {
  const provided = {
    tokens: [],
    amounts: [],
    nfts: []
  }
  const desired = {
    outputERC20s: [],
    outputERC721s: [],
    ratios: [],
    minAmountsOut: []
  }
  for (const asset of assetsToConvert) {
    provided.tokens.push(asset.contract_address)
    provided.amounts.push(ethers.utils.parseUnits(asset.tokensSupplied, asset.contract_decimals))
  }
  const account = await signer.getAddress()
  const usdTotal = assetsToConvert.reduce((a, b)=>a+b.usdcValue, 0)
  const bankId = position.positionData.bankId.toNumber()
  const bankContract = contracts.banks[bankId]
  const underlyingTokens = await bankContract.callStatic.getUnderlyingForRecurringDeposit(position.positionData.bankToken)
  let swaps, conversions
  if (underlyingTokens[0].length===1 && underlyingTokens[0][0]===provided.tokens[0] && provided.tokens.length===1) {
    swaps = []
    conversions = []
  } else {
    const totalRatio = underlyingTokens[1].reduce((a, b)=>a.add(b), ethers.BigNumber.from('0'))
    for (const [index, token] of underlyingTokens[0].entries()) {
      const {price, decimals} = await getPrice(chainId, token)
      const percentageAllocated = underlyingTokens[1][index].toNumber()/totalRatio.toNumber()
      const usd = usdTotal*percentageAllocated
      const expectedTokens = usd/price
      const allowedSlippage = expectedTokens*(1-slippage/100)
      const minAmount = ethers.utils.parseUnits(allowedSlippage.toFixed(decimals).toString(), decimals)
      desired.minAmountsOut.push(minAmount)
      desired.outputERC20s.push(token)
      desired.ratios.push(underlyingTokens[1][index].toNumber())
    }
    const {swaps:s, conversions:c} = await contracts.universalSwap.preSwapComputation(provided, desired)
    swaps = s
    conversions = c
  }
  let ethSupplied = ethers.BigNumber.from('0')
  for (const asset of assetsToConvert) {
    const address = asset.contract_address
    if (address!=ethers.constants.AddressZero) {
      const supplied = ethers.utils.parseUnits(asset.tokensSupplied.toString(), asset.tokenDecimals)
      const contract = new ethers.Contract(address, erc20Abi,signer)
      const allowance = await contract.allowance(account, contracts.positionManager.address)
      if (allowance.lt(supplied)){
        await contract.approve(contracts.positionManager.address, supplied)
      }
    } else {
      ethSupplied = ethers.utils.parseUnits(asset.tokensSupplied.toString(), asset.tokenDecimals)
    }
  }
  const addressZeroIndex = provided.tokens.findIndex(token=>token===ethers.constants.AddressZero)
  if (addressZeroIndex>-1) {
      provided.tokens.splice(addressZeroIndex, 1)
      provided.amounts.splice(addressZeroIndex, 1)
  }
  const tx = await contracts.positionManager.depositInExisting(position.positionId, provided, swaps, conversions, desired.minAmountsOut, {value: ethSupplied})
  return tx.hash
}

export const adjustLiquidationPoints = async (contracts, positionId, liquidationConditions) => {
  const tx = await contracts.positionManager.adjustLiquidationPoints(positionId, liquidationConditions)
  return tx.hash
}

export const harvest = async (contracts, positionId) => {
  const tx = await contracts.positionManager.harvestRewards(positionId)
  return tx.hash
}

export const compound = async (contracts, positionId, slippage, chainId) => {
  const {rewards, rewardAmounts} = await contracts.positionManager.callStatic.harvestRewards(positionId)
  const usdValues = []
  for (const [index, reward] of rewards.entries()) {
    const tokenData = await getTokenDetails(chainId, reward)
    const amount = +ethers.utils.formatUnits(rewardAmounts[index].toString(), tokenData.decimals)
    const usdValue = amount*tokenData.price
    usdValues.push(usdValue)
  }

  const position = await contracts.positionManager.getPosition(positionId)
  const usdSupplied = usdValues.reduce((a, b)=>a+b, 0)
  const bankId = position.bankId.toNumber()
  const bankContract = contracts.banks[bankId]
  const underlyingTokens = await bankContract.callStatic.getUnderlyingForRecurringDeposit(position.bankToken)
  const minAmounts = []
  const totalRatio = underlyingTokens[1].reduce((a, b)=>a.add(b), ethers.BigNumber.from('0'))
  for (const [index, token] of underlyingTokens[0].entries()) {
    const {data:{price, decimals}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token}`)).json()
    const percentageAllocated = underlyingTokens[1][index].toNumber()/totalRatio.toNumber()
    const usd = usdSupplied*percentageAllocated
    const expectedTokens = usd/price
    const allowedSlippage = expectedTokens*(1-slippage/100)
    const minAmount = ethers.utils.parseUnits(allowedSlippage.toFixed(decimals).toString(), decimals)
    minAmounts.push(minAmount)
  }
  const tx = await contracts.positionManager.harvestAndRecompound(positionId, minAmounts)
  return tx.hash
}

export const withdraw = async (contracts, positionId, amount) => {
  const tx = await contracts.positionManager.withdraw(positionId, amount)
  return tx.hash
}

export const close = async (contracts, positionId) => {
  const tx = await contracts.positionManager.close(positionId)
  return tx.hash
}