import { MinusIcon, AddIcon } from "@chakra-ui/icons"
import { TableContainer, Table, Thead, Tr, Th, Tbody, Text, Td, Flex, NumberInput, NumberInputField, Button, useDisclosure, Box, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react"
import Select from "react-select";
import { ethers } from "ethers"
import { forwardRef, useEffect, useState, useImperativeHandle } from "react"
import { useAppContext } from "./Provider"

  // @ts-ignore
const LiquidationConditions = forwardRef(({assetPrice, initialLiquidationPoints, resetFlag}, _ref) => {
  const {contracts} = useAppContext()
  const [newLiquidationPoints, setNewLiquidationPoints] = useState([{
    watchedToken: ethers.constants.AddressZero, below: 0, above: 0, liquidateTo: contracts.usdcContract.address, price: 0
    }])
  const {chainId, supportedAssets} = useAppContext()
  const [error, setError] = useState("")
  const { isOpen, onOpen, onClose } = useDisclosure();
  // @ts-ignore
  const assetsArray = supportedAssets.ERC20

  console.log(initialLiquidationPoints)

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
    <Box>
    <TableContainer marginTop={5} borderRadius={15} overflow={'hidden'}>
      <Table size='lg'>
        <Thead backgroundColor={'cyan.50'}>
          <Tr>
            <Th>Watched Asset</Th>
            <Th>Liquidation Points</Th>
            <Th>Liquidate To</Th>
            <Th>Current Value</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {
            newLiquidationPoints.map((condition, index)=> {
              return(
              <Tr>
                <Td>
                  <Select
                    menuPosition="fixed"
                    options={[{value: ethers.constants.AddressZero, label: "Value of Position"}, ...(assetsArray||[])]}
                    value={[{value: ethers.constants.AddressZero, label: "Value of Position"}, ...(assetsArray||[])].find(asset=>asset.value===condition.watchedToken?.toLowerCase())}
                    onChange={(newValue)=>modifyCondition(newValue.value, 'watchedToken', index)}
                  />
                </Td>
                <Td>
                <Flex alignItems={'center'}>
                  <Text fontSize={'xs'} mr='2'>Price above</Text>
                  <NumberInput value={condition.above||''} maxW={32} min={0}
                  onChange={(valueString)=>modifyCondition(valueString, 'above', index)}>
                    <NumberInputField backgroundColor={'white'}></NumberInputField>
                  </NumberInput>
                </Flex>
                <Flex alignItems={'center'} mt='2'>
                <Text fontSize={'xs'} mr='2'>Price below</Text>
                  <NumberInput value={condition.below||''} maxW={32} min={0} max={condition.price+0.1}
                  onChange={(valueString)=>modifyCondition(valueString, 'below', index)}>
                    <NumberInputField backgroundColor={'white'}></NumberInputField>
                  </NumberInput>
                  </Flex>
                </Td>
                <Td>
                  <Select
                    menuPosition="fixed"
                    options={assetsArray}
                    value={assetsArray?.find(asset=>asset.value===condition.liquidateTo?.toLowerCase())}
                    onChange={(newValue)=>modifyCondition(newValue.value, 'liquidateTo', index)}
                  />
                </Td>
                <Td>${condition.price}</Td>
                <Td>
                  {
                    index>0?
                    <Button onClick={()=>removeCondition(index)}><MinusIcon></MinusIcon></Button>:
                    <></>
                  }
                </Td>
              </Tr>
            )})
          }
          <Tr>
            <Td></Td><Td></Td><Td></Td><Td></Td>
            <Td>
              <Button onClick={addCondition}>
                <AddIcon></AddIcon>
              </Button>
            </Td>
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
    </Box>
  )
})

export default LiquidationConditions