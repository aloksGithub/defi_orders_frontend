import { ethers } from 'ethers'
import pairAbi from "../../constants/abis/IUniswapV2Pair.json"
import erc20Abi from "../../constants/abis/ERC20.json"

const getPrice = async (chainId:number, address:string) => {
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

export default async function serverSideCall(req, res) {
  const {
    query: { chainId, address },
  } = req;
  if (!address) {
    console.log("Trying to fetch price for undefined")
    return
  }
    const response = await getPrice(chainId, address)
    let price = response.data[0].items[0].price
    if (['Pancake LPs', 'Biswap LPs'].includes(response.data[0].items[0].contract_metadata.contract_name)) {
      const provider = new ethers.providers.JsonRpcProvider(process.env[chainId])
      const contract = new ethers.Contract(response.data[0].contract_address, pairAbi, provider)
      const token0 = await contract.token0()
      const token1 = await contract.token1()
      const token0Contract = new ethers.Contract(token0, erc20Abi, provider)
      const token1Contract = new ethers.Contract(token1, erc20Abi, provider)
      const decimals0 = await token0Contract.decimals()
      const decimals1 = await token1Contract.decimals()
      const {reserve0, reserve1} = await contract.getReserves()
      const decimalsPool = await contract.decimals()
      const totalSupply = +ethers.utils.formatUnits((await contract.totalSupply()), decimalsPool)
      const token0Price = (await getPrice(chainId, token0)).data[0].items[0].price
      const token1Price = (await getPrice(chainId, token1)).data[0].items[0].price
      const poolWorth = token0Price*(+ethers.utils.formatUnits(reserve0, decimals0)) + token1Price*(+ethers.utils.formatUnits(reserve1, decimals1))
      price = poolWorth/totalSupply
    }
    const name = response.data[0].items[0].contract_metadata.contract_name
    const decimals = response.data[0].items[0].contract_metadata.contract_decimals
    console.log("CHECK", price)
    res.status(200).json({
      data: {price, name, decimals},
    });
}