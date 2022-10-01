import { ChakraProvider } from '@chakra-ui/react'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { useWeb3React, Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { WalletConnect } from '@web3-react/walletconnect'
import { ReactElement, useEffect, useState } from 'react'
import { coinbaseWallet, hooks as coinbaseWalletHooks } from '../connectors/coinbaseWallet'
import { hooks as metaMaskHooks, metaMask } from '../connectors/metaMask'
import { hooks as networkHooks, network } from '../connectors/network'
import { hooks as walletConnectHooks, walletConnect } from '../connectors/walletConnect'
import { getName } from '../utils'
import { Navbar } from './Navbar'
import { createContext, useContext } from 'react';
import supportedProtocols from '../constants/supportedProtocols.json'
import { ethers } from 'ethers'
import positionManagerAbi from "../constants/abis/PositionManager.json"
import universalSwapAbi from "../constants/abis/UniversalSwap.json"
import bankBaseAbi from "../constants/abis/BankBase.json"
import erc20Abi from "../constants/abis/ERC20.json"
import deploymentAddresses from "../constants/deployments.json"

const AppContext = createContext({
  userAssets: [],
  account: undefined,
  chainId: undefined,
  connector: undefined,
  supportedAssets: {},
  contracts: undefined,
  slippageControl: {slippage:0.5, setSlippage: undefined}
});

export function AppWrapper({ children }) {
  const {isActive, account, chainId, connector, provider} = useWeb3React()
  const [slippage, setSlippage] = useState(0.5)
  const usedChainId = chainId==1337?parseInt(process.env.NEXT_PUBLIC_CURRENTLY_FORKING):chainId
  
  const [userData, setUserData] = useState({
    userAssets: [],
    account: undefined,
    chainId: undefined,
    connector: undefined
  })
  const [supportedAssets, setSupportedAssets] = useState({})
  const [contracts, setContracts] = useState<{positionManager: ethers.Contract, banks: ethers.Contract[], universalSwap: ethers.Contract, usdcContract: ethers.Contract}>()
  useEffect(() => {
    void connector.connectEagerly?.()
  }, [])

  useEffect(() => {
    const getContracts = async () => {
      const signer = provider.getSigner(account)
      if (!(chainId in deploymentAddresses)) {
        return
      }
      const positionManager = new ethers.Contract(deploymentAddresses[chainId].positionsManager, positionManagerAbi, signer)
      const numBanks = await positionManager.numBanks()
      const banks = []
      for (let i = 0; i<numBanks.toNumber(); i++) {
        const bankAddress = await positionManager.banks(i)
        const bank = new ethers.Contract(bankAddress, bankBaseAbi, signer)
        banks.push(bank)
      }
      const universalSwapAddress = await positionManager.universalSwap()
      const universalSwap = new ethers.Contract(universalSwapAddress, universalSwapAbi, signer)
      const usdcContract = new ethers.Contract(deploymentAddresses[chainId].usdc, erc20Abi, provider)
      setContracts({positionManager, banks, universalSwap, usdcContract})
    }
    if (provider && chainId) {
      getContracts()
    }
  }, [provider])

  const addAssets = (assets, protocol) => {
    const temp = {...supportedAssets}
    console.log("ADDING ASSet", protocol)
    temp[protocol] = assets
    setSupportedAssets(temp)
  }

  const getAssets = async (url: string, query: string, protocol: string) => {
    console.log(`fetching for ${protocol}`)
    for (let i =0; i<5; i++) {
      try {
        const res = await (await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })).json()
        if ('tokens' in res.data) {
          return res.data.tokens.map(token=>{
            return {
              value: token.id,
              label: token.symbol
            }
          })
        } else if ('pairs' in res.data) {
          const formattedAssets = res.data.pairs.map(asset=> {
            return {
              value: asset.id,
              label: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} LP`
            }
          })
          return formattedAssets
        } else if ('pools' in res.data) {
          const formattedAssets = res.data.pools.map(asset=> {
            return {
              value: asset.id,
              label: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} LP`
            }
          })
          return formattedAssets
        }
        return res.data
      } catch {
        continue
      }
    }
  }

  useEffect(() => {
    const fetchSupportedAssets = async () => {
      const {data} = await (await fetch(`/api/supportedTokens?chainId=${usedChainId}`)).json()
      setSupportedAssets(data)
    }
    if (usedChainId) {
      fetchSupportedAssets()
    }
  }, [usedChainId])

  useEffect(() => {
    const fetchUserData = async () => {
      const {data} = await (await fetch(`/api/userAssets?chainId=${usedChainId}&address=${account}`)).json()
      const assets = data?data.items:[]
      console.log(assets)
      setUserData({
        userAssets: assets, account, chainId: usedChainId, connector
      })
    }
    if (account && usedChainId) {
      fetchUserData()
    }
  }, [account, usedChainId, provider, contracts])

  return (
    <AppContext.Provider value={{supportedAssets, ...userData, contracts, slippageControl: {slippage, setSlippage}}}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

const connectors: [MetaMask | WalletConnect | CoinbaseWallet | Network, Web3ReactHooks][] = [
  [metaMask, metaMaskHooks],
  [walletConnect, walletConnectHooks],
  [coinbaseWallet, coinbaseWalletHooks],
  [network, networkHooks],
]

export default function Provider({children}) {
  return (
    <ChakraProvider>
    <Web3ReactProvider connectors={connectors}>
      <AppWrapper>
      <Navbar></Navbar>
      {children}
      </AppWrapper>
    </Web3ReactProvider>
    </ChakraProvider>
  )
}
