import { ethers } from 'ethers'
import pairAbi from "../../constants/abis/IUniswapV2Pair.json"
import erc20Abi from "../../constants/abis/ERC20.json"
import cacheData from "memory-cache";

const getPriceCovalent = async (chainId:number, address:string) => {
  for (let i = 0; i<5; i++) {
    try {
      const baseUrl = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/${chainId}/USD/${address}/?quote-currency=USD&format=JSON&key=${process.env.COVALENT_KEY}`;
      const response = await (await fetch (baseUrl)).json();
      return response
    } catch (err) {
      console.log(`Failed attempt ${i} to fetch token price. Error: ${err}`)
      continue
    }
  }
}

export const getPriceActual = async (chainId:number, address:string, decimals:number, name) => {
  const data = cacheData.get(`${chainId}_${address.toLowerCase()}`)
  const provider = new ethers.providers.JsonRpcProvider(process.env[chainId])
  let price:number
  if (!data) {
    const contract = new ethers.Contract(address, pairAbi, provider)
    const token0 = await contract.token0()
    const token1 = await contract.token1()
    const token0Info = (await getPriceCovalent(chainId, token0)).data[0]
    const token1Info = (await getPriceCovalent(chainId, token1)).data[0]
    const decimals0 = token0Info.contract_decimals
    const decimals1 = token1Info.contract_decimals
    const {reserve0, reserve1} = await contract.getReserves()
    const r0 = +ethers.utils.formatUnits(reserve0, decimals0)
    const r1 = +ethers.utils.formatUnits(reserve1, decimals1)
    const totalSupply = +ethers.utils.formatUnits((await contract.totalSupply()), decimals)
    const token0Price = token0Info.items[0].price
    const token1Price = token1Info.items[0].price
    const poolWorth = token0Price*r0 + token1Price*r1
    price = poolWorth/totalSupply
    const toCache = {
      value: address,
      label: name,
      contract_name: name,
      underlying: [
        {address: token0, symbol: token0Info.contract_ticker_symbol, decimals: decimals0, name: token0Info.contract_name, logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${token0}.png`},
        {address: token1, symbol: token1Info.contract_ticker_symbol, decimals: decimals1, name: token1Info.contract_name, logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${token1}.png`}
      ],
      manager:undefined
    }
    cacheData.put(toCache)
  } else {
    const token0 = data.underlying[0].address
    const token1 = data.underlying[1].address
    const contract = new ethers.Contract(address, pairAbi, provider)
    const {reserve0, reserve1} = await contract.getReserves()
    const r0 = +ethers.utils.formatUnits(reserve0, data.underlying[0].decimals)
    const r1 = +ethers.utils.formatUnits(reserve1, data.underlying[1].decimals)
    const totalSupply = +ethers.utils.formatUnits((await contract.totalSupply()), decimals)
    const token0Price = (await getPriceCovalent(chainId, token0)).data[0].items[0].price
    const token1Price = (await getPriceCovalent(chainId, token1)).data[0].items[0].price
    const poolWorth = token0Price*r0 + token1Price*r1
    price = poolWorth/totalSupply
  }
  return price
}

export default async function serverSideCall(req, res) {
  const {
    query: { chainId, address },
  } = req;
  if (!address) {
    console.log("Trying to fetch price for undefined")
    return
  }
    const response = await getPriceCovalent(chainId, address)
    let price = response.data[0].items[0].price
    if (['Pancake LPs', 'Biswap LPs', 'SushiSwap LP Token', 'Uniswap V2'].includes(response.data[0].items[0].contract_metadata.contract_name)) {
      price = await getPriceActual(chainId, address, response.data[0].contract_decimals, response.data[0].contract_name)
    }
    const name = response.data[0].items[0].contract_metadata.contract_name
    const symbol = response.data[0].items[0].contract_metadata.contract_ticker_symbol
    const decimals = response.data[0].items[0].contract_metadata.contract_decimals
    res.status(200).json({
      data: {price, name, decimals, symbol},
    });
}