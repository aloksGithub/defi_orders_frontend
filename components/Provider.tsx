import { ChakraProvider, Flex, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, Text } from '@chakra-ui/react'
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
import { ethers } from 'ethers'
import positionManagerAbi from "../constants/abis/PositionManager.json"
import universalSwapAbi from "../constants/abis/UniversalSwap.json"
import bankBaseAbi from "../constants/abis/BankBase.json"
import erc20Abi from "../constants/abis/ERC20.json"
import uniswapV3PoolInteractorAbi from "../constants/abis/UniswapV3PoolInteractor.json"
import deploymentAddresses from "../constants/deployments.json"
import theme from './Theme'

const AppContext = createContext({
  userAssets: [],
  account: undefined,
  chainId: undefined,
  connector: undefined,
  supportedAssets: {},
  contracts: undefined,
  slippageControl: {slippage:0.5, setSlippage: undefined},
  onError: (error:Error)=>{}
});

export function AppWrapper({ children }) {
  const {isActive, account, chainId, connector, provider} = useWeb3React()
  const [slippage, setSlippage] = useState(0.5)
  const usedChainId = chainId==1337?parseInt(process.env.NEXT_PUBLIC_CURRENTLY_FORKING):chainId
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: errorHappened, onOpen: triggerError, onClose: closeErrorModal } = useDisclosure();
  const { isOpen: alertOpen, onOpen: openAlert, onClose: closeAlert } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState('')
  const [userData, setUserData] = useState({
    userAssets: [],
    account: undefined,
    chainId: undefined,
    connector: undefined
  })
  const [supportedAssets, setSupportedAssets] = useState({})
  const [contracts, setContracts] = useState<{
    positionManager: ethers.Contract,
    banks: ethers.Contract[],
    universalSwap: ethers.Contract,
    usdcContract: ethers.Contract
    uniswapV3PoolInteractor: ethers.Contract
  }>()

  useEffect(() => {
    void connector.connectEagerly?.()
    openAlert()
  }, [])

  useEffect(() => {
    const getContracts = async () => {
      const signer = provider.getSigner(account)
      if (!(chainId in deploymentAddresses)) {
        onOpen()
        setContracts({positionManager:undefined, banks:undefined, universalSwap:undefined, usdcContract:undefined, uniswapV3PoolInteractor:undefined})
        return
      }
      onClose()
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
      const uniswapV3PoolInteractor = new ethers.Contract(deploymentAddresses[chainId].uniswapV3PoolInteractor, uniswapV3PoolInteractorAbi, signer)
      setContracts({positionManager, banks, universalSwap, usdcContract, uniswapV3PoolInteractor})
    }
    if (provider && chainId) {
      getContracts()
    }
  }, [provider, chainId])

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

  const onError = (error:Error) => {
    console.log(error)
    // @ts-ignore
    if (error.reason?.includes('slippage')) {
      setErrorMessage("Transaction failed due to high slippage. You can try setting a higher slippage threshold from the settings")
    } else {
      setErrorMessage("Transaction failed with no revert reason. Please contact us at ...")
    }
    triggerError()
  }

  return (
    <AppContext.Provider value={{supportedAssets, ...userData, contracts, slippageControl: {slippage, setSlippage}, onError}}>
      {children}
      <Modal size={'sm'} isCentered isOpen={isOpen} onClose={onClose}>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px)'
        />
        <ModalContent>
          <ModalHeader>Unsupported chain</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Selected chain is not currently supported, please switch to BSC</Text>
          </ModalBody>
          <ModalFooter>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal size={'sm'} isCentered isOpen={errorHappened} onClose={closeErrorModal}>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px)'
        />
        <ModalContent>
          <ModalHeader>Transaction Failed</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{errorMessage}</Text>
          </ModalBody>
          <ModalFooter>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal size={'sm'} isCentered isOpen={alertOpen} onClose={closeAlert}>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px)'
        />
        <ModalContent>
          <ModalHeader>Welcome</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={'3'}>Welcome to the alpha version of Delimit. Please do not use a large
              amount of funds as we are still testing and fixing issues.</Text>
            <Text fontSize={'sm'}>Note: All positions created in the alpha version will be liquidated and returned by February 2023</Text>
          </ModalBody>
          <ModalFooter>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
    <ChakraProvider theme={theme}>
    <Web3ReactProvider connectors={connectors}>
      <AppWrapper>
      <Navbar></Navbar>
      {children}
      </AppWrapper>
    </Web3ReactProvider>
    </ChakraProvider>
  )
}
