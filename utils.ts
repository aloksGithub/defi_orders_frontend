import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { WalletConnect } from '@web3-react/walletconnect'
import type { Connector } from '@web3-react/types'
import { ethers } from 'ethers'
import erc20Abi from "./constants/abis/ERC20.json"
import supportedProtocols from "./constants/supportedProtocols.json"

export function getName(connector: Connector) {
  if (connector instanceof MetaMask) return 'MetaMask'
  if (connector instanceof WalletConnect) return 'WalletConnect'
  if (connector instanceof CoinbaseWallet) return 'Coinbase'
  if (connector instanceof Network) return 'Network'
  if (connector instanceof GnosisSafe) return 'Gnosis Safe'
  return 'Unknown'
}

export const chainLogos = {
  1: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=023",
  137: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=023",
  8001: "https://cryptologos.cc/logos/polygon-matic-logo.svg?v=023",
  56: "https://seeklogo.com/images/B/binance-coin-bnb-logo-CD94CC6D31-seeklogo.com.png?v=637697418070000000",
  97: "https://seeklogo.com/images/B/binance-coin-bnb-logo-CD94CC6D31-seeklogo.com.png?v=637697418070000000",
  250: "https://cryptologos.cc/logos/fantom-ftm-logo.svg?v=023",
  4002: "https://cryptologos.cc/logos/fantom-ftm-logo.svg?v=023",
  1337: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=023"
}

export const supportedChains = [1, 56, 97, 1337]

export const chainNames = {
  1: "Ethereum",
  137: "Matic",
  8001: "Mumbai",
  56: "BSC",
  97: "BSC (Testnet)",
  250: "Fantom",
  4002: "Fantom (Testnet)",
  1337: "Localhost"
}

export const walletLogos = {
  MetaMask: "https://seeklogo.com/images/M/metamask-logo-09EDE53DBD-seeklogo.com.png",
  Coinbase: "https://seeklogo.com/images/C/coinbase-coin-logo-C86F46D7B8-seeklogo.com.png",
  WalletConnect: "https://seeklogo.com/images/W/walletconnect-logo-EE83B50C97-seeklogo.com.png"
}

export const getUnderlyingTokens = async (contracts, token) => {
  const underlying = await contracts.universalSwap.getUnderlying(token)
  return underlying
}