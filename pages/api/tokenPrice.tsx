import { ethers } from "ethers";
import pairAbi from "../../constants/abis/IUniswapV2Pair.json";
import universalSwapAbi from "../../constants/abis/UniversalSwap.json";
import erc20Abi from "../../constants/abis/ERC20.json";
import deploymentAddresses from "../../constants/deployments.json";
var cache = require("memory-cache");
import { supportedChainAssets } from "../../utils";
import { SupportedChains } from "../../Types";

const rpcs = {
  97: process.env.RPC_97,
  56: process.env.RPC_56,
  1: process.env.RPC_1,
};

const getPriceCovalent = async (chainId: number, address: string) => {
  for (let i = 0; i < 5; i++) {
    try {
      const baseUrl = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/${chainId}/USD/${address}/?quote-currency=USD&format=JSON&key=${process.env.COVALENT_KEY}`;
      const response = await (await fetch(baseUrl)).json();
      return response;
    } catch (err) {
      console.log(`Failed attempt ${i} to fetch token price. Error: ${err}`);
      continue;
    }
  }
};

const chainStableTokens = {};

export const getPriceUniversalSwap = async (chainId: SupportedChains, address: string) => {
  const prod = process.env.NEXT_PUBLIC_CURRENTLY_FORKING === "0";
  const provider = new ethers.providers.JsonRpcProvider(prod ? rpcs[chainId] : "http://127.0.0.1:8545/");
  const universalSwapAddress = prod
    ? deploymentAddresses[chainId].universalSwap
    : deploymentAddresses["1337"].universalSwap;
  const universalSwap = new ethers.Contract(universalSwapAddress, universalSwapAbi, provider);
  if (!(chainId.toString() in chainStableTokens)) {
    const stableToken = await universalSwap.stableToken();
    const stableTokenContract = new ethers.Contract(stableToken, erc20Abi, provider);
    const stableDecimals = await stableTokenContract.decimals();
    chainStableTokens[chainId.toString()] = { stableToken, stableDecimals };
  }
  const token = new ethers.Contract(address, erc20Abi, provider);
  const tokenDecimals = address != ethers.constants.AddressZero ? await token.decimals() : 18;
  const price = await universalSwap.estimateValueERC20(
    address,
    ethers.utils.parseUnits("1", tokenDecimals),
    chainStableTokens[chainId.toString()].stableToken
  );
  return {
    price: +ethers.utils.formatUnits(price, chainStableTokens[chainId.toString()].stableDecimals),
    decimals: tokenDecimals,
  };
};

export const fetchTokenDetails = (chainId: SupportedChains, address: string) => {
  const asset = supportedChainAssets[chainId].find((a) => a.contract_address.toLowerCase() == address.toLowerCase());
  return asset;
};

export const getPriceActual = async (chainId: SupportedChains, address: string) => {
  const data = fetchTokenDetails(chainId, address);
  const provider = new ethers.providers.JsonRpcProvider(process.env[`RPC_${chainId}`]);
  let price: number;
  if (!data) {
    const contract = new ethers.Contract(address, pairAbi, provider);
    const token0 = await contract.token0();
    const token1 = await contract.token1();
    const token0Info = (await getPriceCovalent(chainId, token0)).data[0];
    const token1Info = (await getPriceCovalent(chainId, token1)).data[0];
    const decimals0 = token0Info.contract_decimals;
    const decimals1 = token1Info.contract_decimals;
    const { reserve0, reserve1 } = await contract.getReserves();
    const r0 = +ethers.utils.formatUnits(reserve0, decimals0);
    const r1 = +ethers.utils.formatUnits(reserve1, decimals1);
    const totalSupply = +ethers.utils.formatUnits(await contract.totalSupply(), data.contract_decimals);
    const token0Price = token0Info.items[0].price;
    const token1Price = token1Info.items[0].price;
    const poolWorth = token0Price * r0 + token1Price * r1;
    price = poolWorth / totalSupply;
  } else {
    const token0 = data.underlying[0].contract_address;
    const token1 = data.underlying[1].contract_address;
    const contract = new ethers.Contract(address, pairAbi, provider);
    const { reserve0, reserve1 } = await contract.getReserves();
    const r0 = +ethers.utils.formatUnits(reserve0, data.underlying[0].contract_decimals);
    const r1 = +ethers.utils.formatUnits(reserve1, data.underlying[1].contract_decimals);
    const totalSupply = +ethers.utils.formatUnits(await contract.totalSupply(), data.contract_decimals);
    const token0Price = (await getPriceCovalent(chainId, token0)).data[0].items[0].price;
    const token1Price = (await getPriceCovalent(chainId, token1)).data[0].items[0].price;
    const poolWorth = token0Price * r0 + token1Price * r1;
    price = poolWorth / totalSupply;
  }
  return price;
};

export default async function serverSideCall(req, res) {
  const {
    query: { chainId, address },
  } = req;
  if (!address) {
    console.log("Trying to fetch price for undefined");
    return;
  }
  // const response = await getPriceCovalent(chainId, address)
  // let price = response.data[0].items[0].price
  // if (['Pancake LPs', 'Biswap LPs', 'SushiSwap LP Token', 'Uniswap V2'].includes(response.data[0].items[0].contract_metadata.contract_name)) {
  //   price = await getPriceActual(chainId, address, response.data[0].contract_decimals, response.data[0].contract_name)
  // }
  // const decimals = response.data[0].items[0].contract_metadata.contract_decimals
  try {
    const { price, decimals } = await getPriceUniversalSwap(chainId, address);
    res.status(200).json({
      data: { price, decimals },
    });
  } catch {
    const response = await getPriceCovalent(chainId, address);
    let price = response.data[0].items[0].price;
    if (
      ["Pancake LPs", "Biswap LPs", "SushiSwap LP Token", "Uniswap V2"].includes(
        response.data[0].items[0].contract_metadata.contract_name
      )
    ) {
      price = await getPriceActual(chainId, address);
    }

    const decimals = response.data[0].items[0].contract_metadata.contract_decimals;
    res.status(200).json({
      data: { price, decimals },
    });
  }
}
