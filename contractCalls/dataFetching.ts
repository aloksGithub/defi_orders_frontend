import { ethers } from "ethers";
import erc20Abi from "../constants/abis/ERC20.json"
import { nativeTokens } from "../utils";
import { blockExplorerAPIs } from "../utils";
import EthDater from 'ethereum-block-by-date'

export const getAmountsOut = async (contracts, signer, assetsToConvert, wantedAssets) => {
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
  for (const asset of wantedAssets) {
    desired.outputERC20s.push(asset.contract_address)
    desired.ratios.push(Math.floor(asset.percentage*10000))
    desired.minAmountsOut.push(ethers.utils.parseUnits(asset.minOut.toFixed(asset.contract_decimals), asset.contract_decimals))
  }
  const {amounts, swaps, conversions, expectedUSDValues} = await contracts.universalSwap.getAmountsOut(provided, desired)
  const stableTokenAddress = await contracts.universalSwap.stableToken()
  const stableToken = new ethers.Contract(stableTokenAddress, erc20Abi, signer)
  const decimals = await stableToken.decimals()
  for (const [index, asset] of wantedAssets.entries()) {
    wantedAssets[index].amount = ethers.utils.formatUnits(amounts[index], asset.contract_decimals)
    wantedAssets[index].value = ethers.utils.formatUnits(expectedUSDValues[index], decimals)
  }
  return {swaps, conversions, provided, desired, wantedAssets}
}

export const fetchPosition = async (id:number, contracts, signer, chainId) => {
  if (!contracts.positionManager) return
  let positionData = await contracts.positionManager.getPosition(id)
  const {position, bankTokenInfo, underlyingTokens, underlyingAmounts, underlyingValues, rewardTokens, rewardAmounts, rewardValues, usdValue} = positionData
  const stableDecimals = await contracts.stableToken.decimals()
  const usdcValue = +ethers.utils.formatUnits(usdValue, stableDecimals)
  const depositToken = bankTokenInfo.lpToken
  const depositTokenContract = new ethers.Contract(depositToken, erc20Abi, signer)
  let decimals
  let name
  if (depositToken!=ethers.constants.AddressZero) {
    decimals = await depositTokenContract.decimals()
    name = await depositTokenContract.name()
  } else {
    decimals = 18
    name = nativeTokens[chainId].contract_name
  }
  const underlying = await Promise.all(underlyingTokens.map(async (token, index) => {
    const contract = new ethers.Contract(token, erc20Abi, signer)
    const name = await contract.name()
    const decimals = await contract.decimals()
    const amount = +ethers.utils.formatUnits(underlyingAmounts[index], decimals)
    const value = +ethers.utils.formatUnits(underlyingValues[index], stableDecimals)
    return {name, amount, value, address:token}
  }))
  const rewards = await Promise.all(rewardTokens.map(async (token, index) => {
    const contract = new ethers.Contract(token, erc20Abi, signer)
    const name = await contract.name()
    const decimals = await contract.decimals()
    const amount = +ethers.utils.formatUnits(rewardAmounts[index], decimals)
    const value = +ethers.utils.formatUnits(rewardValues[index], stableDecimals)
    return {name, amount, value, address:token}
  }))

  return {
    positionId: id, positionData:{...position, amountDecimal: ethers.utils.formatUnits(position.amount, decimals)},
    decimals,
    tokenContract:bankTokenInfo.lpToken,
    name,
    usdcValue,
    rewards,
    underlying
  }
}

const getBlockFromExplorer = async (chainId:number, daysAgo:number) => {
  const timeNow = Math.floor(new Date().getTime()/1000)
  const url = `${blockExplorerAPIs[chainId]}/api?module=block&action=getblocknobytime&timestamp=${timeNow-daysAgo*24*60*60}&closest=before&apikey=YourApiKeyToken`
  const response = await fetch(url)
  const block = +(await response.json()).result
  return block
}

const getBlockFromProvider = async (provider, daysAgo) => {
  const dater = new EthDater(provider)
  const seconds = daysAgo*24*60*60
  const timeNow = new Date()
  timeNow.setSeconds(timeNow.getSeconds() - seconds);
  const block = await dater.getDate(timeNow)
  return block.block
}

export const getGraphData = async (contracts, id, provider, duration, chainId) => {
  const usdcDecimals = await contracts.stableToken.decimals()
  const blocks = []
  const timestamps = []
  const numPoints = 30
  const latestBlock = await provider.getBlock("latest")
  const currentTime = latestBlock.timestamp
  const previousTimestamp = (await provider.getBlock(latestBlock.number-1)).timestamp
  const blockTime = currentTime-previousTimestamp
  let startBlock
  const positionInteractions = await contracts.positionManager.getPositionInteractions(id)
  if (duration===-1) {
    startBlock = +positionInteractions[0].blockNumber
    startBlock += (latestBlock.number-startBlock)%numPoints
  } else {
    // startBlock = await getBlockFromProvider(provider, duration)
    // startBlock = await getBlockFromExplorer(chainId, duration)
    startBlock = latestBlock.number-blockTime*numPoints*duration
    startBlock = startBlock>=+positionInteractions[0].blockNumber?startBlock:+positionInteractions[0].blockNumber
    startBlock += (latestBlock.number-startBlock)%numPoints
  }
  blocks.push(startBlock)
  while (true) {
    const block = blocks[blocks.length-1]+(latestBlock.number-startBlock)/numPoints
    const timestamp = (await provider.getBlock(block)).timestamp
    timestamps.push(timestamp*1000)
    if (block>=latestBlock.number || blocks.length===30) {
      break
    }
    blocks.push(block)
  }
  blocks.push(latestBlock.number)
  const timestamp = (await provider.getBlock(latestBlock.number)).timestamp
  timestamps.push(timestamp*1000)
  const dataPoints = blocks.map((block)=> {
    return contracts.positionManager.estimateValue(id, contracts.stableToken.address, {blockTag: block})
  })
  let usdValues = await Promise.all(dataPoints)
  usdValues = usdValues.map(value=>parseFloat(ethers.utils.formatUnits(value.toString(), usdcDecimals)))
  let graphData = timestamps.map((timestamp, index) => {
    const time = new Date(timestamp)
    if (timestamps[timestamps.length-1]-timestamps[0]<86400000) {
      return {
        name: time.toTimeString().split(' ')[0].slice(0, 5),
        value: usdValues[index].toFixed(4)
      }
    } else {
      return {
        name: `${time.toDateString().split(' ')[2]} ${time.toDateString().split(' ')[1]}`,
        value: usdValues[index].toFixed(4)
      }
    }
  })
  return graphData
}

export const fetchImportantPoints = async (contracts, id, provider) => {
  const stableDecimals = await contracts.stableToken.decimals()
  let usdcDeposited = 0
  let usdcWithdrawn = 0

  let positionData = await contracts.positionManager.getPosition(id)
  
  let positionInteractions = await contracts.positionManager.getPositionInteractions(id)
  const depositToken = positionInteractions[0].assets.tokens[0]
  const depositTokenContract = new ethers.Contract(depositToken, erc20Abi, provider)
  const depositTokenDecimals = await depositTokenContract.decimals()
  positionInteractions = positionInteractions.map(interaction=>{
    if (interaction.action==='deposit') {
      usdcDeposited+=+ethers.utils.formatUnits(interaction.usdValue, stableDecimals)
    }
    if (interaction.action==='harvest' || interaction.action==='withdraw' || interaction.action==='liquidate' || interaction.action==='close') {
      usdcWithdrawn+=+ethers.utils.formatUnits(interaction.usdValue, stableDecimals)
    }
    return {
      ...interaction,
      sizeChange: ethers.utils.formatUnits(interaction.positionSizeChange, depositTokenDecimals),
      usdValue: +ethers.utils.formatUnits(interaction.usdValue, stableDecimals),
      date:(new Date(interaction.timestamp * 1000)).toLocaleDateString()
    }
  })
  // await Promise.all(positionInteractions.map(async (interaction, index)=> {
  //   const block = interaction[0].toNumber()
  //   const interactionType = interaction[2].toNumber()
  //   const timestamp = (await provider.getBlock(block)).timestamp
  //   const date = (new Date(timestamp * 1000)).toLocaleDateString()
  //   const blockData = (await contracts.positionManager.functions.getPosition(id, {blockTag: block}))[0]
  //   const size = blockData.amount
  //   let prevSize = 0
  //   let prevUsdcValue = 0
  //   if (index>0) {
  //     const prevBlockData = (await contracts.positionManager.functions.getPosition(id, {blockTag: block-1}))[0]
  //     prevUsdcValue = await contracts.positionManager.callStatic.closeToUSDC(id, {blockTag: block-1})
  //     prevSize = prevBlockData.amount
  //   }
  //   if (transactionType==='Deposit'||transactionType==='Compound') {
  //     usdcDeposited+=usdcChange
  //   } else if (transactionType==='Withdrawal'||transactionType==='Bot Liquidate'||transactionType==='Harvest') {
  //     usdcWithdrawn-=usdcChange
  //   }
  //   data.push({
  //     transactionType,
  //     date,
  //     timestamp,
  //     usdc: Math.abs(usdcChange),
  //     tokens: sizeChange
  //   })
  // }))
  // const interactionsArray = Array.from(Array(numInteractions).keys())
  // const interactionsData = interactionsArray.map(i=> 
  //   contracts.positionManager.positionInteractions(id, i).then(async (b)=>{
  //     const block = b.toNumber()
  //     const timestamp = (await provider.getBlock(block)).timestamp
  //     const date = (new Date(timestamp * 1000)).toLocaleDateString()
  //     const blockData = (await contracts.positionManager.functions.getPosition(id, {blockTag: block}))[0]
  //     const size = blockData.amount
  //     let prevSize = 0
  //     let prevUsdcValue = 0
  //     if (i>0) {
  //       const prevBlockData = (await contracts.positionManager.functions.getPosition(id, {blockTag: block-1}))[0]
  //       prevUsdcValue = await contracts.positionManager.callStatic.closeToUSDC(id, {blockTag: block-1})
  //       prevSize = prevBlockData.amount
  //     }
  //     const blockUsdcValue = await contracts.positionManager.callStatic.closeToUSDC(id, {blockTag: block})
  //     const usdcChange = parseFloat(ethers.utils.formatUnits(blockUsdcValue.sub(prevUsdcValue).toString(), usdcDecimals))
  //     const sizeChange = size.sub(prevSize).toString()
  //     const transactionType = usdcChange>0?'deposit':'withdrawal'
  //     if (transactionType==='deposit') {
  //       usdcDeposited+=usdcChange
  //     } else {
  //       usdcWithdrawn-=usdcChange
  //     }
  //     data.push({
  //       transactionType,
  //       date,
  //       timestamp,
  //       usdc: Math.abs(usdcChange),
  //       tokens: sizeChange
  //     })
  //   })
  // )
  // await Promise.all(interactionsData)
  return {data: positionInteractions, usdcDeposited, usdcWithdrawn}
}