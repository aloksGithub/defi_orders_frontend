import { MinusIcon, AddIcon, DeleteIcon } from "@chakra-ui/icons"
import { TableContainer, Table, Thead, Tr, Th, Tbody, Text, Td, Flex, NumberInput, NumberInputField, Button, useDisclosure, Box, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react"
import {Select} from "chakra-react-select";
import { ethers } from "ethers"
import { forwardRef, useEffect, useState, useImperativeHandle } from "react"
import { useAppContext } from "./Provider"
import { Heading3 } from "./Typography";

  // @ts-ignore
const LiquidationConditions = forwardRef(({assetPrice, initialLiquidationPoints, resetFlag}, _ref) => {
  const {contracts} = useAppContext()
  const [newLiquidationPoints, setNewLiquidationPoints] = useState([{
    watchedToken: ethers.constants.AddressZero, below: 0, above: 0, liquidateTo: contracts?.usdcContract.address, price: 0
    }])
  const {chainId, supportedAssets} = useAppContext()
  const [error, setError] = useState("")
  const { isOpen, onOpen, onClose } = useDisclosure();
  // @ts-ignore
  const assetsArray = supportedAssets.ERC20


  useEffect(()=> {
    if (initialLiquidationPoints) {
      setNewLiquidationPoints(JSON.parse(JSON.stringify(initialLiquidationPoints)))
    }
  }, [resetFlag, initialLiquidationPoints])

  useImperativeHandle(_ref, () => ({
    getFormattedConditions: () => {
      let formattedConditions = []
      // @ts-ignore
      for (let [index, condition] of newLiquidationPoints.entries()) {
        if (!condition.watchedToken) {
          setError(`Invalid asset to watch for condition ${index+1}`)
          onOpen()
          return
        }
        if (!condition.liquidateTo) {
          setError(`Invalid liquidate to token for condition ${index+1}`)
          onOpen()
          return
        }
        if (condition.below>parseFloat(condition.price)) {
          setError(`Lower limit for condition ${index+1} is greater than current price`)
          onOpen()
          return
        }
        if (condition.above<parseFloat(condition.price)) {
          setError(`Upper limit for condition ${index+1} is lesser than current price`)
          onOpen()
          return
        }
        if (condition.above) {
          const upperCondition = {
            watchedToken: condition.watchedToken,
            liquidateTo: condition.liquidateTo,
            lessThan: false,
            liquidationPoint: ethers.utils.parseUnits(condition.above.toString(), 18).toString()
          }
          formattedConditions.push(JSON.parse(JSON.stringify(upperCondition)))
        }
        if (condition.below) {
          const lowerCondition = {
            watchedToken: condition.watchedToken,
            liquidateTo: condition.liquidateTo,
            lessThan: true,
            liquidationPoint: ethers.utils.parseUnits(condition.below.toString(), 18).toString()
          }
          formattedConditions.push(JSON.parse(JSON.stringify(lowerCondition)))
        }
      }
      return formattedConditions
    }
  }))

  const addCondition = () => {
  const temp = [...newLiquidationPoints]
    temp.push({
      watchedToken: undefined,
      below: 0, above: 0,
      liquidateTo: undefined,
      price: 0
    })
    setNewLiquidationPoints(temp)
  }

  const removeCondition = (index: number) => {
    if (newLiquidationPoints.length===1) return
    const temp = [...newLiquidationPoints]
    temp.splice(index, 1)
    setNewLiquidationPoints(temp)
  }

  useEffect(() => {
    const temp = JSON.parse(JSON.stringify(newLiquidationPoints))
    for (const condition of temp) {
      if (condition.watchedToken===ethers.constants.AddressZero) {
        condition.price = assetPrice
      }
    }
    setNewLiquidationPoints(temp)
  }, [assetPrice])

  const modifyCondition = async (value, key, index) => {
    const temp = [...newLiquidationPoints]
    temp[index][key] = value || undefined
    if (key==='watchedToken') {
      if (value!=ethers.constants.AddressZero) {
        const {data: {price}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${value}`)).json()
        temp[index].price = price
      } else {
        temp[index].price = assetPrice
      }
    }
    setNewLiquidationPoints(temp)
  }

  return (
    <Box marginTop={'5'}>
      <div style={{ overflowX: 'auto', maxWidth: "80vw", borderRadius:15 }}>
      <Table size='lg'
        sx={{
          "td, th":{
            'padding-left': '15px',
            'padding-right': '15px'
          },
          "input": {
            'padding-left': '10px',
            'padding-right': '10px',
          },
        }}>
        <Thead backgroundColor={'cyan.50'}>
          <Tr>
            <Th>
              <div>
                <Heading3>Asset to watch/</Heading3>
                <Heading3>Liquidate to</Heading3>
              </div>
            </Th>
            <Th>Liquidate when</Th>
            <Th>Current Value</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {
            newLiquidationPoints.map((condition, index)=> {
              console.log(condition)
              return(
              <Tr>
                <Td style={{width: '180px'}}>
                  <Select
                    useBasicStyles
                    menuPosition="fixed"
                    options={[{value: ethers.constants.AddressZero, label: "Value of Position"}, ...(assetsArray||[])]}
                    value={[{value: ethers.constants.AddressZero, label: "Value of Position"}, ...(assetsArray||[])].find(asset=>asset.value===condition.watchedToken?.toLowerCase())}
                    onChange={(newValue)=>modifyCondition(newValue.value, 'watchedToken', index)}
                  />
                  <div style={{height: '12px'}}></div>
                  <Select
                    useBasicStyles
                    menuPosition="fixed"
                    options={assetsArray}
                    value={assetsArray?.find(asset=>asset.value===condition.liquidateTo?.toLowerCase())}
                    onChange={(newValue)=>modifyCondition(newValue.value, 'liquidateTo', index)}
                  />
                </Td>
                <Td>
                <Flex alignItems={'center'}>
                  <Text fontSize={'xs'} mr='2'>Price above</Text>
                  <NumberInput value={condition.above||''} width={'32'} min={+condition.price+0.1}
                  onChange={(valueString)=>modifyCondition(valueString, 'above', index)}>
                    <NumberInputField backgroundColor={'white'}></NumberInputField>
                  </NumberInput>
                </Flex>
                <Flex alignItems={'center'} mt='2'>
                <Text fontSize={'xs'} mr='2'>Price below</Text>
                  <NumberInput value={condition.below||''} width={'32'} min={0} max={+condition.price+0.1}
                  onChange={(valueString)=>modifyCondition(valueString, 'below', index)}>
                    <NumberInputField backgroundColor={'white'}></NumberInputField>
                  </NumberInput>
                  </Flex>
                </Td>
                <Td>${condition?.price||0}</Td>
                <Td>
                    <Flex justifyContent={'center'}>
                      <DeleteIcon _hover={{cursor: 'pointer'}} onClick={()=>removeCondition(index)}></DeleteIcon>
                    </Flex>
                </Td>
              </Tr>
            )})
          }
          <Tr>
            <Td></Td><Td></Td><Td></Td>
            <Td>
              <Button onClick={addCondition}>
                <AddIcon></AddIcon>
              </Button>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </div>
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
    </Box>
  )
})

export default LiquidationConditions