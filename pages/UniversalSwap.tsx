import { AddIcon, MinusIcon, ArrowBackIcon } from '@chakra-ui/icons'
import { useAppContext } from "../components/Provider"
import {
  Table,
  Thead,
  Tbody,
  NumberInput,
  NumberInputField,
  Tr,
  Th,
  Td,
  Text,
  TableContainer,
  Button,
  Flex,
  Box,
  useDisclosure, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, useColorModeValue, ModalOverlay, Heading
} from '@chakra-ui/react'
import { useRef, useState } from 'react'
import {
  Select,
} from "chakra-react-select";
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import erc20Abi from "../constants/abis/ERC20.json"
import { SupplyAssets } from '../components/selectAssets';


const UniversalSwap = () => {
  const childStateRef = useRef()
  const {account, chainId, supportedAssets, contracts, slippageControl: {slippage}} = useAppContext()
  const {provider} = useWeb3React()
  
  const [totalToConvert, setTotal] = useState(0)
  const [wantedAsset, setWantedAsset] = useState()
  const assetsArray = [].concat.apply([], Object.values(supportedAssets))
  const [converting, setConverting] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure();

  const proceed = () => {
    // @ts-ignore
    const assetsToConvert = childStateRef.current.getFormattedConditions()
    if (!assetsToConvert || assetsToConvert.length===0) return
    const usdToConvert = assetsToConvert.reduce((prev, asset)=>prev+asset.usdcValue, 0)
    if (usdToConvert==0) return
    setWantedAsset(undefined)
    onOpen()
    setTotal(usdToConvert)
  }

  const swap = async () => {
    if (!wantedAsset) return
    setConverting(true)
    // @ts-ignore
    const assetsToConvert = childStateRef.current.getFormattedConditions()
    const erc20Supplied = assetsToConvert.map(asset=>asset.asset)
    const erc20Amounts = assetsToConvert.map(asset=>ethers.utils.parseUnits(asset.tokensSupplied.toString(), asset.tokenDecimals))
    for (let [index, token] of erc20Supplied.entries()) {
      const contract = new ethers.Contract(token, erc20Abi, provider.getSigner(account))
      const currentApproval = await contract.allowance(account, contracts.universalSwap.address)
      console.log(currentApproval.toString())
      if (currentApproval>=erc20Amounts[index]) {
        continue
      }
      try {
        await contract.functions.approve(contracts.universalSwap.address, erc20Amounts[index])
      } catch {
        console.log("Transaction failed")
      }
    }
    const {data:{price, decimals}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${wantedAsset.value}`)).json()
    const expectedTokens = totalToConvert/price
    const allowedSlippage = expectedTokens*(1-slippage/100)
    const minAmount = ethers.utils.parseUnits(allowedSlippage.toFixed(decimals).toString(), decimals)
    console.log(erc20Supplied, erc20Amounts, wantedAsset.value, minAmount)
    try {
      await contracts.universalSwap.functions["swap(address[],uint256[],address,uint256)"](erc20Supplied, erc20Amounts, wantedAsset.value, minAmount)
      setConverting(false)
    } catch {
      console.log("Transaction failed")
      setConverting(false)
    }
  }

  return (
    <Flex marginTop={20} alignItems={'center'} direction={'column'}>
      <Heading>Selecte Assets to Swap</Heading>
      <SupplyAssets ref={childStateRef}/>
        <Flex marginTop={5} marginBottom={25} justifyContent={'end'}>
        <Button colorScheme='blue' rounded={'full'} mr={'4'} size='lg' onClick={proceed}>Proceed</Button>
        </Flex>
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
        <ModalContent>
          <ModalHeader>Convert Assets</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>USD Supplied ${totalToConvert.toFixed(3)}</Text>
            <Text mb={3}>Convert To:</Text>
            <Select
              size="sm"
              colorScheme="purple"
              options={assetsArray}
              placeholder={"Enter address or asset name"}
              onChange={(newValue)=>setWantedAsset(newValue)}
            />
            <Flex justifyContent={'center'}>
            <Button mt={4} onClick={swap} isLoading={converting}>Convert</Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default UniversalSwap