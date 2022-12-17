import { BigNumberish, ethers } from "ethers";
import erc20Abi from "../constants/abis/ERC20.json"
import npmAbi from "../constants/abis/INonFungiblePositionsManager.json"
import { getPrice } from "../utils";
import { Contracts, WantedAsset } from "../Types";
import { JsonRpcSigner, JsonRpcProvider } from "@ethersproject/providers";
import { ConversionStruct, LiquidationConditionStruct, ProvidedStruct, SwapPointStruct } from "../codegen/PositionManager";
import { ERC20__factory, INonFungiblePositionsManager__factory } from "../codegen";
import { DesiredStruct } from "../codegen/UniversalSwap";

export const depositNew = async (contracts: Contracts, signer: JsonRpcSigner, position, asset) => {
  const account = await signer.getAddress()
  let tx: ethers.Transaction
  if (asset.contract_address!=ethers.constants.AddressZero) {
    const contract = ERC20__factory.connect(asset.contract_address, signer)
    const currentApproval = await contract.allowance(account, contracts.positionManager.address)
    if (currentApproval<position.amount) {
      await contract.approve(contracts.positionManager.address, position.amount)
    }
    tx = await contracts.positionManager.deposit(position, [asset.contract_address], [position.amount])
  } else {
    tx = await contracts.positionManager.deposit(position, [], [], {value: position.amount})
  }
  return tx.hash
}

export const swap = async (
  contracts: Contracts,
  signer: JsonRpcSigner,
  provided: ProvidedStruct, desired: DesiredStruct,
  swaps: SwapPointStruct[], conversions: ConversionStruct[],
  expectedAssets: WantedAsset[]) => {
  const account = await signer.getAddress()
  let ethSupplied: BigNumberish = ethers.BigNumber.from('0')
  for (const [i, token] of provided.tokens.entries()) {
    if (token!=ethers.constants.AddressZero) {
      console.log("CHECK", token, signer)
      // @ts-ignore
      const assetContract = ERC20__factory.connect(token, signer)
      console.log("Success")
      const tokensSupplied = provided.amounts[i]
      const currentAllowance = await assetContract.allowance(account, contracts.universalSwap.address)
      if (currentAllowance<tokensSupplied) {
        await assetContract.approve(contracts.universalSwap.address, tokensSupplied)
      }
    } else {
      ethSupplied = await provided.amounts[i]
    }
  }
  for (const nft of provided.nfts) {
    const manager = INonFungiblePositionsManager__factory.connect(await nft.manager, signer)
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
      asset.quote = asset.price*amountObtained
      asset.expected = amountObtained
    } else {
      const manager = INonFungiblePositionsManager__factory.connect(asset.contract_address, signer)
      const {liquidity} = await manager.positions(amountsAndIds[index])
      const amountObtained = +ethers.utils.formatUnits(liquidity, asset.contract_decimals)
      asset.quote = asset.price*amountObtained
      asset.expected = amountObtained
    }
  }
  return {expectedAssets, hash}
}

export const depositAgain = async (contracts: Contracts, signer: JsonRpcSigner, position, assetsToConvert, chainId: number, slippage: number) => {
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
      const contract = ERC20__factory.connect(address, signer)
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

export const adjustLiquidationPoints = async (contracts: Contracts, positionId: BigNumberish, liquidationConditions: LiquidationConditionStruct[]) => {
  const tx = await contracts.positionManager.adjustLiquidationPoints(positionId, liquidationConditions)
  return tx.hash
}

export const harvest = async (contracts: Contracts, positionId: BigNumberish) => {
  const tx = await contracts.positionManager.harvestRewards(positionId)
  return tx.hash
}

export const compound = async (contracts: Contracts, positionId: BigNumberish, positionInfo, slippage: number, chainId: number) => {
  const {rewards, rewardAmounts} = await contracts.positionManager.getPositionRewards(positionId)
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
  for (const [index, reward] of rewards.entries()) {
    provided.tokens.push(reward)
    provided.amounts.push(rewardAmounts[index])
  }
  const usdValues = []
  for (const [index, reward] of rewards.entries()) {
    const {price, decimals} = await getPrice(chainId, reward)
    const amount = +ethers.utils.formatUnits(rewardAmounts[index].toString(), decimals)
    const usdValue = amount*price
    usdValues.push(usdValue)
  }

  const usdSupplied = usdValues.reduce((a, b)=>a+b, 0)
  const bankId = positionInfo.bankId.toNumber()
  const bankContract = contracts.banks[bankId]
  const [underlying, ratios] = await bankContract.getUnderlyingForRecurringDeposit(positionInfo.bankToken)
  const totalRatio = ratios.reduce((a, b)=>a.add(b), ethers.BigNumber.from('0'))
  console.log(underlying, positionInfo.bankToken, bankId)
  for (const [index, token] of underlying.entries()) {
    desired.outputERC20s.push(token)
    desired.ratios.push(ratios[index])
    const {price, decimals} = await getPrice(chainId, token)
    const percentageAllocated = ratios[index].toNumber()/totalRatio.toNumber()
    const usd = usdSupplied*percentageAllocated
    const expectedTokens = usd/price
    const allowedSlippage = expectedTokens*(1-slippage/100)
    const minAmount = ethers.utils.parseUnits(allowedSlippage.toFixed(decimals).toString(), decimals)
    desired.minAmountsOut.push(minAmount)
  }
  const {swaps, conversions} = await contracts.universalSwap.preSwapComputation(provided, desired)
  const tx = await contracts.positionManager.harvestAndRecompound(positionId, swaps, conversions, desired.minAmountsOut)
  return tx.hash
}

export const withdraw = async (contracts: Contracts, positionId: BigNumberish, amount: BigNumberish) => {
  const tx = await contracts.positionManager.withdraw(positionId, amount)
  return tx.hash
}

export const close = async (contracts: Contracts, positionId: BigNumberish) => {
  const tx = await contracts.positionManager.close(positionId)
  return tx.hash
}