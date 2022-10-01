import { MinusIcon, AddIcon } from "@chakra-ui/icons";
import { useDisclosure, Flex, TableContainer, Table, Text, Thead, Tr, Th, Tbody, Td, NumberInput, NumberInputField, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Box } from "@chakra-ui/react";
import Select from "react-select";
import { ethers } from "ethers";
import { forwardRef, useState, useImperativeHandle } from "react"
import { useAppContext } from "./Provider";

export const SupplyAssets = forwardRef((props, _ref) => {
  const {userAssets} = useAppContext()
  const [error, setError] = useState("")
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const filteredAssets = userAssets.filter(asset=>asset.quote>0)
  const [assetsToConvert, setAssetsToConvert] = useState<any>([{asset: undefined, tokenDecimals: undefined, tokensAvailable: undefined, usdcValue: undefined, tokensSupplied: undefined}])
  const assetOptions = filteredAssets.map(asset=>{
    return {
      value: asset.contract_address,
      label: asset.contract_name
    }
  })
  const addAsset = () => {
    setAssetsToConvert([...assetsToConvert, {asset: undefined, tokenDecimals: undefined, tokensAvailable: undefined, usdcValue: undefined, tokensSupplied: undefined}])
  }

  const removeAsset = (i: number) => {
    if (assetsToConvert.length===1) return
    const tempAssets = [...assetsToConvert]
    tempAssets.splice(i, 1)
    setAssetsToConvert(tempAssets)
  }

  const setSupply = (i:number, tokens: number) => {
    const temp = [...assetsToConvert]
    temp[i].tokensSupplied = tokens
    const assetDetails = filteredAssets.find(asset=>asset.contract_address===temp[i].asset)
    const balance = ethers.utils.formatUnits(assetDetails.balance, assetDetails.contract_decimals)
    const usdAvailable = assetDetails.quote
    const usdSupplied = (usdAvailable*tokens/parseFloat(balance))
    temp[i].usdcValue = usdSupplied
    setAssetsToConvert(temp)
  }

  const setAsset = (i:number, asset:string) => {
    const temp = [...assetsToConvert]
    temp[i].asset = asset
    const assetDetails = filteredAssets.find(asset=>asset.contract_address===temp[i].asset)
    const balance = ethers.utils.formatUnits(assetDetails.balance, assetDetails.contract_decimals)
    temp[i].tokensAvailable = balance
    temp[i].tokenDecimals = assetDetails.contract_decimals
    setAssetsToConvert(temp)
  }

  useImperativeHandle(_ref, () => ({
    getFormattedConditions: () => {
      for (const asset of assetsToConvert) {
        if (!asset.asset || !asset.tokensSupplied || !asset.usdcValue) {
          setError(`Invalid data`)
          onOpen()
          return
        }
      }
      return assetsToConvert
    }
  }))

  return (
    <Flex>
        <TableContainer marginTop={5} borderRadius={15}>
          <Table size='lg'>
            <Thead backgroundColor={'cyan.50'}>
              <Tr>
                <Th>Asset</Th>
                <Th>USD Supplied</Th>
                <Th>Tokens Supplied</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {
                assetsToConvert.map((asset, index) => asset?(
                  <Tr>
                    <Td>
                      <Select
                      menuPosition="fixed"
                      options={assetOptions}
                      onChange={(newValue)=>setAsset(index, newValue.value)}
                      />
                    </Td>
                    <Td>${(asset?.usdcValue || 0).toFixed(3)}</Td>
                    <Td>
                      <NumberInput isDisabled={asset.asset==undefined} maxW={32} min={0} max={asset?.tokensAvailable||99999999}
                      onChange={(valueString)=>setSupply(index, parseFloat(valueString))}>
                        <NumberInputField backgroundColor={'white'}></NumberInputField>
                      </NumberInput>
                    </Td>
                    <Td><Button onClick={()=>removeAsset(index)}><MinusIcon/></Button></Td>
                  </Tr>
                ):<></>)
              }
              <Tr>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td><Button onClick={addAsset}><AddIcon/></Button></Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
        <ModalContent>
          <ModalHeader>Error</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>{error}</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
})