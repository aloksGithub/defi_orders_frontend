import {CoinbaseWallet} from "@web3-react/coinbase-wallet";
import {GnosisSafe} from "@web3-react/gnosis-safe";
import {MetaMask} from "@web3-react/metamask";
import {Network} from "@web3-react/network";
import {WalletConnect} from "@web3-react/walletconnect";
import type {Connector} from "@web3-react/types";

export function getName(connector: Connector) {
  if (connector instanceof MetaMask) return "MetaMask";
  if (connector instanceof WalletConnect) return "WalletConnect";
  if (connector instanceof CoinbaseWallet) return "Coinbase";
  if (connector instanceof Network) return "Network";
  if (connector instanceof GnosisSafe) return "Gnosis Safe";
  return "Unknown";
}

export const chainLogos = {
  1: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=023",
  137: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=023",
  8001: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=023",
  56: "https://seeklogo.com/images/B/binance-coin-bnb-logo-CD94CC6D31-seeklogo.com.png?v=637697418070000000",
  97: "https://seeklogo.com/images/B/binance-coin-bnb-logo-CD94CC6D31-seeklogo.com.png?v=637697418070000000",
  250: "https://cryptologos.cc/logos/fantom-ftm-logo.svg?v=023",
  4002: "https://cryptologos.cc/logos/fantom-ftm-logo.svg?v=023",
  1337: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=023",
};

export const supportedChains = [1, 56, 97, 1337];

export const chainNames = {
  1: "Ethereum",
  137: "Matic",
  8001: "Mumbai",
  56: "BSC",
  97: "BSC (Testnet)",
  250: "Fantom",
  4002: "Fantom (Testnet)",
  1337: "Localhost",
};

export const walletLogos = {
  MetaMask:
    "https://seeklogo.com/images/M/metamask-logo-09EDE53DBD-seeklogo.com.png",
  Coinbase:
    "https://seeklogo.com/images/C/coinbase-coin-logo-C86F46D7B8-seeklogo.com.png",
  WalletConnect:
    "https://seeklogo.com/images/W/walletconnect-logo-EE83B50C97-seeklogo.com.png",
};

export const getUnderlyingTokens = async (contracts, token) => {
  const underlying = await contracts.universalSwap.getUnderlying(token);
  return underlying;
};

export const getPrice = async (chainId, address) => {
  const {
    data: {price},
  } = await (
    await fetch(`/api/tokenPrice?chainId=${chainId}&address=${address}`)
  ).json();
  return price;
};

export const getTokenDetails = async (chainId, address) => {
  const {data} = await (
    await fetch(`/api/tokenPrice?chainId=${chainId}&address=${address}`)
  ).json();
  return data;
};

const blockExplorers = {
  1: "https://etherscan.io/token/",
  56: "https://bscscan.com/token/",
  250: "https://ftmscan.com/token/",
  137: "https://polygonscan.com/token/",
  97: "https://testnet.bscscan.com/token/",
};

export const getBlockExplorerUrl = (chainId: number, token: string) => {
  return `${blockExplorers[chainId]}${token}`;
};

export function nFormatter(num, digits) {
  if (num < 1) {
    return num.toFixed(digits);
  }
  const lookup = [
    {value: 1, symbol: ""},
    {value: 1e3, symbol: "k"},
    {value: 1e6, symbol: "M"},
    {value: 1e9, symbol: "G"},
    {value: 1e12, symbol: "T"},
    {value: 1e15, symbol: "P"},
    {value: 1e18, symbol: "E"},
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0";
}

const logos = {
  Pancakeswap: "https://cryptologos.cc/logos/pancakeswap-cake-logo.svg?v=023",
  Biswap: "https://cryptologos.cc/logos/biswap-bsw-logo.svg?v=023",
  "Uniswap V2": "https://cryptologos.cc/logos/uniswap-uni-logo.svg?v=023",
  "Uniswap V3": "https://cryptologos.cc/logos/uniswap-uni-logo.svg?v=023",
  Sushiswap: "https://cryptologos.cc/logos/sushiswap-sushi-logo.svg?v=023",
  AAVE: "https://cryptologos.cc/logos/aave-aave-logo.svg?v=023",
};

export const getLogoUrl = async (contract, chainId) => {
  const name = await contract.name();
  if (name === "Biswap LPs") {
    return logos.Biswap;
  } else if (name === "Pancake LPs") {
    return logos.Pancakeswap;
  } else if (name.includes("Venus")) {
    return "https://logos.covalenthq.com/tokens/56/0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63.png";
  } else if (name.includes("AAVE")) {
    return logos.AAVE;
  } else if (name.includes("Uniswap")) {
    return logos["Uniswap V2"];
  }
  return `https://logos.covalenthq.com/tokens/${chainId}/${contract.address.toLowerCase()}.png`;
};
