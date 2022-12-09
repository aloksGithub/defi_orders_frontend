import { ChakraProvider, Flex, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, Text, Box } from '@chakra-ui/react'
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
import { getPrice } from '../utils'
import { Navbar } from './Navbar'
import { createContext, useContext } from 'react';
import { ethers } from 'ethers'
import positionManagerAbi from "../constants/abis/PositionManager.json"
import universalSwapAbi from "../constants/abis/UniversalSwap.json"
import bankBaseAbi from "../constants/abis/BankBase.json"
import erc20Abi from "../constants/abis/ERC20.json"
import deploymentAddresses from "../constants/deployments.json"
import theme from './Theme'
import {GrCircleInformation} from 'react-icons/gr'
import { BiErrorAlt } from "react-icons/bi"
import { CheckCircleIcon } from '@chakra-ui/icons'
import { Footer } from './Footer'

const AppContext = createContext({
  userAssets: {data: [], loading: false, error: false},
  hardRefreshAssets: ()=>{}, softRefreshAssets: ()=>{},
  account: undefined,
  chainId: undefined,
  connector: undefined,
  supportedAssets: {},
  contracts: undefined,
  slippageControl: {slippage:0.5, setSlippage: undefined},
  counter: 0,
  onError: (error:Error)=>{},
  successModal: (title:string, body:ReactElement)=>{}
});

export function AppWrapper({ children }) {
  const {account, chainId, connector, provider} = useWeb3React()
  const [slippage, setSlippage] = useState(0.5)
  const usedChainId = chainId==1337?parseInt(process.env.NEXT_PUBLIC_CURRENTLY_FORKING):chainId
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: errorHappened, onOpen: triggerError, onClose: closeErrorModal } = useDisclosure();
  const { isOpen: alertOpen, onOpen: openAlert, onClose: closeAlert } = useDisclosure();
  const { isOpen: isOpenSuccess, onOpen: onOpenSuccess, onClose: onCloseSuccess } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadTrigger, setReloadTrigger] = useState(false)
  const [softReloadTrigger, setSoftReloadTrigger] = useState(false)
  const [successTitle, setSuccessTitle] = useState('')
  const [successBody, setSuccessBody] = useState<ReactElement>()

  const [userAssets, setUserAssets] = useState<any>({data: [], loading: true, error: false})
  const [supportedAssets, setSupportedAssets] = useState({})
  const [contracts, setContracts] = useState<any>()

  const [counter, setCounter] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setCounter(counter + 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [counter]);

  useEffect(() => {
    if (counter%60===0) {
      softRefreshAssets()
    }
  }, [counter])

  const hardRefreshAssets = async () => {
    if (userAssets.loading) return
    setUserAssets({...userAssets, loading:true})
    setReloadTrigger(!reloadTrigger)
  }

  useEffect(() => {
    const updateQuotes = async () => {
      const temp = [...userAssets?.data||[]]
      for (let i = 0; i<temp.length; i++) {
        const {price} = await getPrice(usedChainId, temp[i].contract_address)
        temp[i].quote = +ethers.utils.formatUnits(temp[i].balance, temp[i].contract_decimals)*price
      }
      setUserAssets({...userAssets, data: temp, loading: false})
    }
    updateQuotes()
  }, [softReloadTrigger])

  const softRefreshAssets = async () => {
    setUserAssets({...userAssets, loading:true})
    setSoftReloadTrigger(!softReloadTrigger)
  }

  useEffect(() => {
    void connector.connectEagerly?.()
    openAlert()
  }, [])

  useEffect(() => {
    const getContracts = async () => {
      const signer = provider.getSigner(account)
      if (!(chainId in deploymentAddresses)) {
        onOpen()
        setContracts({positionManager:undefined, banks:undefined, universalSwap:undefined, stableToken:undefined, uniswapV3PoolInteractor:undefined})
        return
      }
      try {
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
        const stableTokenAddress = await positionManager.stableToken()
        const stableToken = new ethers.Contract(stableTokenAddress, erc20Abi, provider)
        const uniswapV3PoolInteractor = undefined
        setContracts({positionManager, banks, universalSwap, stableToken, uniswapV3PoolInteractor})
      } catch {
        
      }
    }
    if (provider && chainId) {
      getContracts()
    }
  }, [provider, chainId, account])

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
      try {
        const {data} = await (await fetch(`/api/userAssets?chainId=${usedChainId}&address=${account}`)).json()
        const assets = data?data.items:[]
        setUserAssets({...userAssets, data: assets, loading:false, error:false})
      } catch (error) {
        setUserAssets({...userAssets, data:[], loading:false, error:true})
      }
    }
    if (account && usedChainId) {
      setUserAssets({...userAssets, data: undefined, loading:true})
      fetchUserData()
    }
  }, [account, usedChainId, provider, reloadTrigger])
  
  const onError = (error:Error) => {
    console.log(error)
    // @ts-ignore
    if (error.reason?.includes('slippage')) {
      setErrorMessage("Transaction failed due to high slippage. You can try setting a higher slippage threshold from the settings")
    } else {
      setErrorMessage("Transaction failed with no revert reason. Please contact us at info@de-limit.com")
    }
    triggerError()
  }

  const successModal = (title:string, body:ReactElement) => {
    setSuccessTitle(title)
    setSuccessBody(body)
    onOpenSuccess()
  }

  return (
    <AppContext.Provider
    value={{
      supportedAssets, userAssets,
      hardRefreshAssets, softRefreshAssets,
      account, chainId: usedChainId, connector,
      contracts,
      slippageControl: {slippage, setSlippage}, onError,
      counter, successModal
    }}>
      {children}
      <Modal size={'sm'} isCentered isOpen={isOpen} onClose={onClose}>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px)'
        />
        <ModalContent>
          <ModalHeader>
          <Flex alignItems={'center'}>
              {<BiErrorAlt color='red' fontSize={'2rem'}/>}
              <Text ml={'4'}>Unsupported Chain</Text>
            </Flex>
          </ModalHeader>
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
          <ModalHeader>
            <Flex>
              {<GrCircleInformation color='yellow' fontSize={'2rem'}/>}
              <Text ml={'4'}>Welcome</Text>
            </Flex>
          </ModalHeader>
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
      <Modal size={'sm'} isCentered isOpen={isOpenSuccess} onClose={onCloseSuccess}>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px)'
        />
        <ModalContent>
          <ModalHeader>
            <Flex alignItems={'center'}>
              {<CheckCircleIcon color='green.400' fontSize={'2rem'}/>}
              <Text ml={'4'}>{successTitle}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {successBody}
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
      <Box
        position={'absolute'}
        width={'100%'}
        minHeight={'100vh'}
        paddingTop={'80px'}
        paddingBottom={'140px'}
        // bgGradient='linear(to-r, white, #e0e8ff, #e0e8ff, #e0e8ff, #e0e8ff, #e0e8ff, white)'
        bgGradient='linear(to-b, gray.100, #edfdff)'
        >
        {children}
      <Footer/>
      </Box>
      </AppWrapper>
    </Web3ReactProvider>
    </ChakraProvider>
  )
}
