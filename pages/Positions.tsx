import { useWeb3React } from "@web3-react/core";
import { useAppContext } from "../components/Provider"
import { Box, Flex, Table, TableContainer, Tbody, Th, Thead, Tr, Text, Td, Button, Center, Heading, Stack, useColorModeValue, SkeletonText, Skeleton } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { fetchPositions } from "../contractCalls/dataFetching";

const Card = ({position}) => {

  return (
    <Box py={6} m={'4'} minW={'300px'}>
      <Flex direction={'column'}
        justifyContent={'space-between'}
        h={'100%'}
        w={'full'}
        bg={useColorModeValue('white', 'gray.900')}
        boxShadow={'2xl'}
        rounded={'lg'}
        p={6}
        textAlign={'center'}>
        <Heading mb={'3'} fontSize={'xl'} fontFamily={'body'}>
        {position.name}
        </Heading>
        <Flex mb={'3'} flexDir={'column'} alignItems={'start'}>
        <Heading fontSize={'m'} >
        Underlying
        </Heading>
        {
          position.underlying.map((token)=> <Text>{token}</Text>)
        }
        </Flex>
        <Flex mb={'3'} flexDir={'column'} alignItems={'start'}>
        <Heading fontSize={'m'} >
        USD Value
        </Heading>
        ${position.usdcValue}
        </Flex>

        <Stack mt={8} direction={'row'} spacing={4}>
        <Link href={`/editPosition/${position.positionId}`}>
          <Button
            flex={1}
            fontSize={'sm'}
            rounded={'full'}
            bg={'blue.400'}
            color={'white'}
            boxShadow={
              '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
            }
            _hover={{
              bg: 'blue.500',
            }}
            _focus={{
              bg: 'blue.500',
            }}>
            Edit
          </Button>
          </Link>
          <Button
            flex={1}
            fontSize={'sm'}
            rounded={'full'}
            bg={'green.400'}
            color={'white'}
            boxShadow={
              '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
            }
            _hover={{
              bg: 'green.500',
            }}
            _focus={{
              bg: 'green.500',
            }}>
            Analytics
          </Button>
        </Stack>
      </Flex>
    </Box>
  )
}

const Positions = () => {
  const {contracts} = useAppContext()
  const {account, provider} = useWeb3React()
  const [positions, setPositions] = useState(undefined)

  useEffect(() => {
    const fetchUserPositions = async () => {
      setPositions([])
      const positions = await fetchPositions(contracts, provider.getSigner(account))
      setPositions(positions)
    }
    if (contracts && provider) {
      fetchUserPositions()
    }
  }, [contracts, provider])

  return <>
    <Box marginTop={20}>
      <Heading textAlign={'center'}>Your Positions</Heading>
      <Flex marginInline={'auto'} wrap={'wrap'} justifyContent={'center'} alignContent={'stretch'} maxW={'1000px'}>
      {
        positions?positions.map(position=><Card position={position}></Card>):
        Array.from(Array(6).keys()).map(()=> {
          return (
          <Box py={6} px={'10'} m={'4'} boxShadow='lg' bg='white' minW={'300px'} height={'300'}>
          <Skeleton
            width={'80%'}
            height='40px'
            color='white'
            mb={'8'}
          />
            <SkeletonText mt='4' noOfLines={7} spacing='4'/>
          </Box>)
        })
      }
      </Flex>
      {/* <TableContainer marginTop={5} borderRadius={15} overflow={'hidden'}>
        <Table size='lg'>
          <Thead backgroundColor={'cyan.50'}>
            <Tr>
              <Th>Asset</Th>
              <Th>Underlying Assets</Th>
              <Th>USD Value</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              positions?.map((position, index)=> {
                return <>
                  <Tr backgroundColor={index%2==0?'cyan.100':'cyan.50'}
                  _hover={{
                    backgroundColor: 'white'
                  }}>
                    <Td>{position.name}</Td>
                    <Td>
                      {
                        position.underlying.map((token)=> <Text>{token}</Text>)
                      }
                    </Td>
                    <Td>${position.usdcValue}</Td>
                    <Td display={'flex'} flexDir={'column'}>
                      <Link href={`/editPosition/${position.positionId}`}><Button size={'sm'} mb='3'>Edit</Button></Link>
                      <Button size={'sm'}>Analytics</Button>
                    </Td>
                  </Tr>
                </>
              })
            }
          </Tbody>
        </Table>
      </TableContainer> */}
    </Box>
  </>
}

export default Positions