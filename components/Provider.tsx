import {
  ChakraProvider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Text,
  Box,
  useColorModeValue,
  useColorMode,
} from "@chakra-ui/react";
import { CoinbaseWallet } from "@web3-react/coinbase-wallet";
import { useWeb3React, Web3ReactHooks, Web3ReactProvider } from "@web3-react/core";
import { MetaMask } from "@web3-react/metamask";
import { Network } from "@web3-react/network";
import { WalletConnect } from "@web3-react/walletconnect";
import { ReactElement, useEffect, useState } from "react";
import { coinbaseWallet, hooks as coinbaseWalletHooks } from "../connectors/coinbaseWallet";
import { hooks as metaMaskHooks, metaMask } from "../connectors/metaMask";
import { hooks as networkHooks, network } from "../connectors/network";
import { hooks as walletConnectHooks, walletConnect } from "../connectors/walletConnect";
import { supportedChainAssets } from "../utils";
import { Navbar } from "./Navbar";
import { createContext, useContext } from "react";
import { ethers } from "ethers";
import deploymentAddresses from "../constants/deployments.json";
import theme from "./Theme";
import { GrCircleInformation } from "react-icons/gr";
import { BiErrorAlt } from "react-icons/bi";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { Footer } from "./Footer";
import { level0 } from "./Theme";
import { Asset, SwapContracts, defaultContext, UserAsset } from "../Types";
import {
  PositionManager__factory,
  UniversalSwap__factory,
  BankBase__factory,
  ERC20__factory,
  ISwapper__factory,
  IOracle__factory,
} from "../codegen";
import useUserAssets from "../hooks/useUserAssets";

const AppContext = createContext(defaultContext);

export function AppWrapper({ children }) {
  const { account, chainId, connector, provider } = useWeb3React();
  const [slippage, setSlippage] = useState(0.5);
  const usedChainId = chainId == 1337 ? parseInt(process.env.NEXT_PUBLIC_CURRENTLY_FORKING) : chainId;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: errorHappened, onOpen: triggerError, onClose: closeErrorModal } = useDisclosure();
  const { isOpen: alertOpen, onOpen: openAlert, onClose: closeAlert } = useDisclosure();
  const { isOpen: isOpenSuccess, onOpen: onOpenSuccess, onClose: onCloseSuccess } = useDisclosure();
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadTrigger, setReloadTrigger] = useState(false);
  const [softReloadTrigger, setSoftReloadTrigger] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");
  const [successBody, setSuccessBody] = useState<ReactElement>();

  const [supportedAssets, setSupportedAssets] = useState<Asset[]>([]);
  const [contracts, setContracts] = useState<SwapContracts>();
  

  const onError = (error: any) => {
    if (typeof error === "string") {
      setErrorMessage(error);
      triggerError();
      return;
    }
    console.log(error.reason);
    // @ts-ignore
    if (error?.reason?.includes("execution reverted: 3")) {
      setErrorMessage(
        "Transaction failed due to high slippage. You can try setting a higher slippage threshold from the settings"
      );
    } else {
      setErrorMessage("Transaction failed with no revert reason. Please contact us at info@de-limit.com");
    }
    triggerError();
  };
  const {userAssets, loading: loadingAssets} = useUserAssets(account, usedChainId, contracts, onError, reloadTrigger)

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
    if (counter % 60 === 0) {
      hardRefreshAssets();
    }
  }, [counter]);

  const hardRefreshAssets = async () => {
    if (loadingAssets) return;
    setReloadTrigger(!reloadTrigger);
  };

  useEffect(() => {
    void connector.connectEagerly?.();
    openAlert();
  }, []);

  useEffect(() => {
    const getContracts = async () => {
      const signer = provider.getSigner(account);
      if (!(chainId in deploymentAddresses)) {
        onOpen();
        return;
      }
      try {
        const positionManager = PositionManager__factory.connect(deploymentAddresses[chainId].positionsManager, signer);
        const banks = (await positionManager.getBanks()).map((bank) => BankBase__factory.connect(bank, signer));
        const universalSwap = UniversalSwap__factory.connect(deploymentAddresses[chainId].universalSwap, signer);
        const oracleAddress = await universalSwap.oracle();
        const oracle = IOracle__factory.connect(oracleAddress, signer);
        const swapperAddresses = await universalSwap.getSwappers();
        const swappers = swapperAddresses.map((address) => ISwapper__factory.connect(address, signer));
        const networkTokenAddress = await universalSwap.networkToken();
        const networkToken = ERC20__factory.connect(networkTokenAddress, signer);
        const stableTokenAddress = await positionManager.stableToken();
        const stableToken = ERC20__factory.connect(stableTokenAddress, provider);
        const uniswapV3PoolInteractor = undefined;
        setContracts({ positionManager, banks, universalSwap, oracle, swappers, networkToken, stableToken });
      } catch (error) {
        console.log(error);
      }
    };
    if (provider && chainId) {
      getContracts();
    } else {
      setContracts(undefined)
    }
  }, [provider, chainId, account]);

  useEffect(() => {
    if (usedChainId) {
      setSupportedAssets(supportedChainAssets[usedChainId]);
    }
  }, [usedChainId]);

  const successModal = (title: string, body: ReactElement) => {
    setSuccessTitle(title);
    setSuccessBody(body);
    onOpenSuccess();
  };

  return (
    <AppContext.Provider
      value={{
        supportedAssets,
        userAssets: {data: userAssets, loading: loadingAssets},
        hardRefreshAssets,
        account,
        chainId: usedChainId,
        connector,
        contracts,
        slippageControl: { slippage, setSlippage },
        onError,
        counter,
        successModal,
      }}
    >
      {children}
      <Modal size={"sm"} isCentered isOpen={isOpen} onClose={onClose}>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>
            <Flex alignItems={"center"}>
              {<BiErrorAlt color="red" fontSize={"2rem"} />}
              <Text ml={"4"}>Unsupported Chain</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Selected chain is not currently supported, please switch to BSC</Text>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
      <Modal size={"sm"} isCentered isOpen={errorHappened} onClose={closeErrorModal}>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>Error</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{errorMessage}</Text>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
      <Modal size={"sm"} isCentered isOpen={alertOpen} onClose={closeAlert}>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>
            <Flex>
              {<GrCircleInformation color="yellow" fontSize={"2rem"} />}
              <Text ml={"4"}>Welcome</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={"3"}>
              Welcome to the alpha version of Delimit. Please do not use a large amount of funds as we are still testing
              and fixing issues.
            </Text>
            <Text fontSize={"sm"}>
              Note: All positions created in the alpha version will be liquidated and returned by February 2023
            </Text>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
      <Modal size={"sm"} isCentered isOpen={isOpenSuccess} onClose={onCloseSuccess}>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>
            <Flex alignItems={"center"}>
              {<CheckCircleIcon color="green.400" fontSize={"2rem"} />}
              <Text ml={"4"}>{successTitle}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>{successBody}</ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

const Wrapper = ({ children }) => {
  const { colorMode } = useColorMode();
  return (
    <Box
      position={"absolute"}
      width={"100%"}
      minHeight={"100vh"}
      paddingTop={"80px"}
      pb="32"
      backgroundColor={useColorModeValue(...level0)}
      // bgGradient='linear(to-r, white, #e0e8ff, #e0e8ff, #e0e8ff, #e0e8ff, #e0e8ff, white)'
      // bgGradient='linear(to-b, gray.100, #edfdff)'
    >
      {children}
      <Footer />
    </Box>
  );
};

const connectors: [MetaMask | WalletConnect | CoinbaseWallet | Network, Web3ReactHooks][] = [
  [metaMask, metaMaskHooks],
  [walletConnect, walletConnectHooks],
  [coinbaseWallet, coinbaseWalletHooks],
  [network, networkHooks],
];

export default function Provider({ children }) {
  return (
    <ChakraProvider theme={theme}>
      <Web3ReactProvider connectors={connectors}>
        <AppWrapper>
          <Navbar></Navbar>
          <Wrapper>{children}</Wrapper>
          {/* <Box
        position={'absolute'}
        width={'100%'}
        minHeight={'100vh'}
        paddingTop={'80px'}
        paddingBottom={'140px'}
        // bgGradient='linear(to-r, white, #e0e8ff, #e0e8ff, #e0e8ff, #e0e8ff, #e0e8ff, white)'
        // bgGradient='linear(to-b, gray.100, #edfdff)'
        >
        {children}
      <Footer/>
      </Box> */}
        </AppWrapper>
      </Web3ReactProvider>
    </ChakraProvider>
  );
}
