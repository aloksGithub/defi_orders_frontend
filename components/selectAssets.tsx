import { DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { useDisclosure, IconButton, Flex, Text, NumberInput, NumberInputField, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Box, Input, Skeleton, useColorModeValue } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useState, useEffect, useRef } from "react"
import { useAppContext } from "./Provider";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Reload } from "./Reload";
import { level1, level2 } from "./Theme";

export const SelectAsset = ({assets, asset, onSelect, placeHolder='Select'}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [filter, setFilter] = useState('')
  const [filteredAssets, setFitleredAssets] = useState(assets)

  useEffect(() => {
    if (isOpen) {
      setTimeout(()=>ref.current?.scrollIntoView(), 100)
    }
  }, [isOpen])

  const onSelected = (asset) => {
    onSelect(asset)
    closeModal()
  }

  const closeModal = () => {
    setFilter('')
    onClose()
  }

  useEffect(() => {
    if (assets?.length>0) {
      const newFiltered = assets.filter(asset=> {
        if (asset.contract_name.toLowerCase().includes(filter.toLowerCase()) || asset.contract_address.toLowerCase().includes(filter.toLowerCase())) {
          return true
        }
        return false
      })
      setFitleredAssets(newFiltered)
    }
  }, [filter, assets])

  const onInput = (input:string) => {
    setFilter(input)
  }

  const ref = useRef(null)

  return (
    <Box>
      <Box>
      <Button onClick={onOpen} alignItems={'center'} justifyContent={'center'}
        paddingInline='2' paddingBlock={'1'} borderRadius={'2xl'}>
        {
          asset?.contract_ticker_symbol?<>
          &nbsp;&nbsp;<img  src={asset.logo_url} style={{width: "20px", height: "20px", borderRadius:'15px'}}/>
          <Text ml={'3'} fontSize={'l'}>{asset.contract_ticker_symbol} <ChevronDownIcon/></Text>
          </>:<Text fontSize={'l'}>&nbsp;&nbsp;{placeHolder}<ChevronDownIcon/></Text>
        }
      </Button>
      </Box>
      <Modal isCentered isOpen={isOpen} onClose={closeModal}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
        <ModalContent bgColor={useColorModeValue(...level1)}>
          <ModalHeader>Select {placeHolder==='Select'?'asset':placeHolder}</ModalHeader>
          <ModalCloseButton />
          <ModalBody padding={'6'}>
          <Input mb={'4'} placeholder='Search asset by name or address' onChange={(event)=>onInput(event.target.value)}/>
          <Box overflow={'auto'} maxHeight={'400px'} marginTop={'3'}>
            {
              filteredAssets?.map(selectableAsset=> {
                const chosenOne = selectableAsset.contract_address?.toLowerCase()===asset?.contract_address?.toLowerCase()
                return (
                  <Flex _hover={{cursor:'pointer', backgroundColor: useColorModeValue(...level2)}}
                  ref={chosenOne?ref:undefined}
                  backgroundColor={chosenOne?useColorModeValue(...level2):useColorModeValue(...level1)} padding='2'
                  onClick={()=>onSelected(selectableAsset)}>
                    <img src={selectableAsset.logo_url} style={{width: "20px", height: "20px", borderRadius:'15px'}}/>
                    <Text ml={'3'}>{selectableAsset.contract_name}</Text>
                  </Flex>
                )
              })
            }
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

const Asset = ({i, asset, assets, setAsset, setSupply, removeAsset}) => {
  const {userAssets:{loading}} = useAppContext()

  const onChangeSupply = (tokens) => {
    if (!asset.balance) return
    setSupply(i, tokens)
  }

  const setMax = () => {
    if (!asset.balance) return
    onChangeSupply(+ethers.utils.formatUnits(asset.balance, asset.contract_decimals))
  }

  const onSelect = (asset) => {
    setAsset(i, asset)
  }

  return (
    <Flex width={'100%'} mt='4' padding={'4'} justifyContent={'space-between'} alignItems={'center'} borderRadius={'2xl'}
    backgroundColor={useColorModeValue(...level1)}
    >
      <Box>
        <SelectAsset asset={asset} onSelect={onSelect} assets={assets}/>
        <Flex alignItems={'center'} mt={'3'}>
        <Text textAlign={'center'} borderRadius={'lg'} width={'2rem'} padding={'1'}
        onClick={()=>removeAsset(i)}
        _hover={{cursor: 'pointer', backgroundColor: 'red.400'}} backgroundColor='red.300'><DeleteIcon/></Text>
        </Flex>
      </Box>
      <Flex flexDirection={'column'} alignItems={'end'} textAlign={'end'}>
        <Flex>
          Balance: {!loading?(+ethers.utils.formatUnits(asset?.balance||0, asset?.contract_decimals||1)).toFixed(3):<Skeleton ml={'2'}>Temporary</Skeleton>}
          <Text paddingInline={'1'} backgroundColor='blue.500' color={'white'} ml={'2'} _hover={{cursor: 'pointer', backgroundColor:'blue.300'}} onClick={setMax}>Max</Text>
        </Flex>
        <NumberInput value={asset.tokensSupplied} size='lg' maxW={32} borderStyle='hidden'
        min={0} max={+ethers.utils.formatUnits(asset?.balance||0, asset?.contract_decimals||1)}
        defaultValue={0} onChange={(valueAsNumber)=>onChangeSupply(valueAsNumber)}>
          <NumberInputField fontSize={'2xl'} textAlign={'end'} pr={'0'}
          boxShadow='none' outline={'none'} borderStyle='hidden'
          _hover={{borderStyle: 'hidden'}} _active={{borderStyle: 'hidden', borderTopColor: 'pink.100', borderColor: 'gray.100', boxShadow: 'none'}}/>
        </NumberInput>
        {!loading?<Text>${(asset.usdcValue||0).toFixed(3)}</Text>:<Skeleton>Temporary</Skeleton>}
      </Flex>
    </Flex>
  )
}

export const SupplyAssets = ({assetsToConvert, setAssetsToConvert}) => {
  const {userAssets, hardRefreshAssets} = useAppContext()
  const assets = userAssets?.data
  const loading = userAssets?.loading
  const userAssetsError = userAssets?.error

  // const [assetsToConvert, setAssetsToConvert] = useState<any>([{}])
  const filteredAssets = assets?.filter(asset=>!(assetsToConvert.filter(toConvert=>toConvert.contract_address===asset.contract_address).length>0))

  useEffect(() => {
    if (assets?.length>0 && !loading && !userAssetsError) {
      const newAssets = assetsToConvert.map(asset=> {
        const matchingAsset = assets.find(reloadedAsset=>reloadedAsset.contract_address===asset.contract_address)
        if (matchingAsset && matchingAsset.balance) {
          const balance = ethers.utils.formatUnits(matchingAsset.balance, matchingAsset.contract_decimals)
          const usdAvailable = matchingAsset.quote
          const usdSupplied = (usdAvailable*asset.tokensSupplied/parseFloat(balance))
          return {...asset, balance:matchingAsset.balance, quote:matchingAsset.quote, usdcValue: usdSupplied}
        } else {return {}}
      })
      setAssetsToConvert(newAssets)
    } else {

    }
  }, [userAssets])

  // useEffect(() => {
  //   onChange(assetsToConvert)
  // }, [assetsToConvert])

  const addAsset = () => {
    setAssetsToConvert([...assetsToConvert, {}])
  }
  const removeAsset = (i: number) => {
    if (assetsToConvert.length===1) return
    const tempAssets = [...assetsToConvert]
    tempAssets[i].tokensSupplied = 0
    tempAssets[i].usdcValue = 0
    tempAssets.splice(i, 1)
    setAssetsToConvert(tempAssets)
  }

  const setSupply = (i:number, tokens: number) => {
    const temp = [...assetsToConvert]
    temp[i].tokensSupplied = tokens
    const assetDetails = temp[i]
    const balance = ethers.utils.formatUnits(assetDetails.balance, assetDetails.contract_decimals)
    const usdAvailable = assetDetails.quote
    const usdSupplied = (usdAvailable*tokens/parseFloat(balance))
    temp[i].usdcValue = usdSupplied
    setAssetsToConvert(temp)
  }

  const setAsset = (i:number, asset:string) => {
    const temp = [...assetsToConvert]
    temp[i] = asset
    const assetDetails = temp[i]
    const balance = ethers.utils.formatUnits(assetDetails.balance, assetDetails.contract_decimals)
    temp[i].tokensAvailable = balance
    temp[i].tokenDecimals = assetDetails.contract_decimals
    temp[i].tokensSupplied = 0
    setAssetsToConvert(temp)
  }

  return (
      <Flex padding={'5'} direction={'column'} width={'100%'} maxWidth='450px'
      bg='hidden'
      alignItems={'center'} borderRadius={'2xl'} border='1px' borderColor={useColorModeValue(...level2)}>
        <Flex width={'100%'} justifyContent='space-between' alignItems={'center'}>
          <IconButton color='white' bgColor={useColorModeValue('blue.500', 'blue.600')}
          _hover={{bgColor: useColorModeValue('blue.600', 'blue.700')}}
          _focus={{bgColor: useColorModeValue('blue.700', 'blue.800')}} aria-label='Add Asset' onClick={addAsset} icon={<AddIcon />} />
        <Text>USD Supplied: ${assetsToConvert.reduce((a, b)=>a+(b.usdcValue||0), 0)?.toFixed(3)||0}</Text>
        <Reload onReload={hardRefreshAssets} loading={loading} />
        </Flex>
        {
          assetsToConvert.map((asset, index) => asset?(
            <Asset key={`SuppliedAsset_${index}`} asset={asset} i={index} assets={filteredAssets} removeAsset={removeAsset} setSupply={setSupply} setAsset={setAsset}></Asset>
          ):<></>)
        }
      </Flex>
  )
}