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
  useDisclosure, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, useColorModeValue, ModalOverlay
} from '@chakra-ui/react'
import { useState } from 'react'
import {
  Select,
} from "chakra-react-select";
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import erc20Abi from "../constants/abis/ERC20.json"


const UniversalSwap = () => {
  const {userAssets, account, chainId, supportedAssets, contracts} = useAppContext()
  const {provider} = useWeb3React()
  
  const filteredAssets = userAssets.filter(asset=>asset.quote>0)
  const [assetsToConvert, setAssetsToConvert] = useState<any>(new Array(filteredAssets.length))
  const [totalToConvert, setTotal] = useState(0)
  const [phase, setPhase] = useState(0)
  const [assetType, setAssetType] = useState()
  const [wantedAsset, setWantedAsset] = useState()
  const assetsArray = [].concat.apply([], Object.values(supportedAssets))
  const { isOpen, onOpen, onClose } = useDisclosure();

  
  const addAsset = (i: number) => {
    if (assetsToConvert[i]) return
    const tempAssets = [...assetsToConvert]
    tempAssets[i] = {...filteredAssets[i], toConvert: 0}
    setAssetsToConvert(tempAssets)
  }

  const removeAsset = (i: number) => {
    const tempAssets = [...assetsToConvert]
    tempAssets[i] = undefined
    setAssetsToConvert(tempAssets)
  }

  const setAmount = (i:number, tokens:number) => {
    const tempAssets = [...assetsToConvert]
    tempAssets[i].toConvert = tokens || 0
    setAssetsToConvert(tempAssets)
  }

  const proceed = () => {
    const chosenAssets = assetsToConvert.filter(asset=>asset!=undefined)
    const usdToConvert = chosenAssets.reduce((prev, asset)=>prev+asset.quote*asset.toConvert/(asset.balance/10**asset.contract_decimals), 0)
    if (usdToConvert==0) return
    setWantedAsset(undefined)
    onOpen()
    setPhase(1)
    setTotal(usdToConvert)
  }

  const swap = async () => {
    const chosenAssets = assetsToConvert.filter(asset=>asset!=undefined)
    const erc20Supplied = chosenAssets.filter(asset=>asset.supports_erc[0]==='erc20').map(asset=>asset.contract_address)
    const erc20Amounts = chosenAssets.filter(asset=>asset.supports_erc[0]==='erc20').map(asset=>ethers.utils.parseUnits(asset.toConvert.toString(), asset.contract_decimals))
    console.log(erc20Amounts, erc20Supplied)
    for (let [index, token] of erc20Supplied.entries()) {
      const contract = new ethers.Contract(token, erc20Abi, provider.getSigner(account))
      const currentApproval = await contract.allowance(account, contracts.universalSwap.address)
      if (currentApproval>=erc20Amounts[index]) {
        continue
      }
      await contract.functions.approve(contracts.universalSwap.address, erc20Amounts[index], {maxFeePerGas: 381548280860})
    }
    await contracts.universalSwap.functions["swap(address[],uint256[],address,uint256)"](erc20Supplied, erc20Amounts, wantedAsset.value, 0, {maxFeePerGas: 381548280860})
  }

  return (
    <Flex marginTop={20} alignItems={'center'} direction={'column'}>
      <Box>
        <Text fontSize='xl' as={'b'}>Assets to Convert</Text>
        <TableContainer marginTop={5} borderRadius={15} overflow={'hidden'}>
          <Table size='lg'>
            <Thead backgroundColor={'cyan.50'}>
              <Tr>
                <Th>Asset</Th>
                <Th>USD Converted</Th>
                <Th>Tokens to Convert</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {
                assetsToConvert.map((asset, index) => asset?(
                  <Tr backgroundColor={index%2==0?'cyan.100':'cyan.50'}
                  _hover={{
                    backgroundColor: 'white'
                  }}>
                    <Td>
                      <Flex>
                      <img src={asset.logo_url} style={{width: 20, height: 20, marginRight: 4}}/>
                      {asset.contract_name}
                      </Flex>
                    </Td>
                    <Td>${(asset.quote*asset.toConvert/(asset.balance/10**asset.contract_decimals)).toFixed(3)}</Td>
                    <Td>
                      <NumberInput maxW={32} min={0} max={asset.balance/10**asset.contract_decimals}
                      onChange={(valueString)=>setAmount(index, parseFloat(valueString))}>
                        <NumberInputField backgroundColor={'white'}></NumberInputField>
                      </NumberInput>
                    </Td>
                    <Td><Button onClick={()=>removeAsset(index)}><MinusIcon/></Button></Td>
                  </Tr>
                ):<></>)
              }
            </Tbody>
          </Table>
        </TableContainer>
        {
          assetsToConvert.filter(asset=>asset).length==0?
          <Text marginBlock={5} textAlign={'center'}>Add assets from table below</Text>:<></>
        }
        <Flex marginTop={5} marginBottom={25} justifyContent={'end'}>
        <Button alignSelf={'flex-end'} onClick={proceed}>Proceed</Button>
        </Flex>
        
        <Text fontSize='xl' as={'b'}>Available Assets</Text>
        <TableContainer marginTop={5} borderRadius={15} overflow={'hidden'}>
          <Table size='lg'>
            <Thead backgroundColor={'cyan.50'}>
              <Tr>
                <Th>Asset</Th>
                <Th>Worth USD</Th>
                <Th>Balance</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {
                filteredAssets.map((asset, index) => (
                  <Tr backgroundColor={index%2==0?'cyan.100':'cyan.50'}
                  _hover={{
                    backgroundColor: 'white'
                  }}>
                    <Td>
                      <Flex>
                      <img src={asset.logo_url} style={{width: 20, height: 20, marginRight: 4}}/>
                      {asset.contract_name}
                      </Flex>
                    </Td>
                    <Td>${asset.quote.toFixed(3)}</Td>
                    <Td>{(asset.balance/10**asset.contract_decimals).toFixed(3)}</Td>
                    <Td><Button onClick={()=>addAsset(index)}><AddIcon/></Button></Td>
                  </Tr>
                ))
              }
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
      
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
            <Button mt={4} onClick={swap}>Convert</Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default UniversalSwap