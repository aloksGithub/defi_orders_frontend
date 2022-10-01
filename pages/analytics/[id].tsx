import { useAppContext } from "../../components/Provider"
import { Box, Flex, Text, Grid, GridItem, useColorModeValue, Skeleton, TableContainer, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router'
import { useWeb3React } from "@web3-react/core";
import { fetchPosition, getGraphData } from "../../contractCalls/dataFetching";
import { fetchImportantPoints } from "../../contractCalls/dataFetching";
import { LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

const Analytics = () => {
  const {contracts} = useAppContext()
  const {provider, account} = useWeb3React()
  const router = useRouter()
  const { id } = router.query
  const [position, setPosition] = useState(undefined)
  const [analytics, setAnalytics] = useState(undefined)
  const [roi, setRoi] = useState('0')
  const [pnl, setPnl] = useState('0')
  const [graphData, setGraphData] = useState(undefined)

  console.log(graphData)

  useEffect(() => {
    const fetch = async () => {
      const data = await getGraphData(contracts, id, provider, -1)
      setGraphData(data)
    }
    if (contracts && provider) {
      fetch()
    }
  }, [contracts, provider, id])

  useEffect(() => {
    const fetch = async () => {
      // @ts-ignore
      const position = await fetchPosition(parseInt(id), contracts, provider.getSigner(account))
      const positionData = await fetchImportantPoints(contracts, id, provider)
      const roi = positionData.usdcWithdrawn+position.usdcValue-positionData.usdcDeposited
      const pnl = roi*100/positionData.usdcDeposited
      console.log(position.usdcValue, positionData.usdcDeposited)
      setRoi(roi.toFixed(4))
      setPnl(pnl.toFixed(4))
      setAnalytics(positionData)
      setPosition(position)
    }
    if (contracts && provider) {
      fetch()
    }
  }, [contracts, provider, id])

  return (
    <Flex marginTop={10} marginBottom={10} justifyContent={'center'}>
    <Box
      justifyContent={'space-between'}
      bg={useColorModeValue('white', 'gray.900')}
      boxShadow={'2xl'}
      rounded={'lg'}
      p={10}>
        <Grid
        w={'100%'}
        gridTemplateRows={'100px'}
        templateColumns='repeat(3, 1fr)'
        gap={10}
      >
        <GridItem colSpan={1}>
          <Text fontSize='2xl' as={'b'}>NAV</Text>
          <Text>${position?.usdcValue.toFixed(3)}</Text>
        </GridItem>
        <GridItem colSpan={1}>
          <Text fontSize='2xl' as={'b'}>ROI</Text>
          <Text>{roi}%</Text>
        </GridItem>
        <GridItem colSpan={1}>
          <Text fontSize='2xl' as={'b'}>PnL</Text>
          <Text>${pnl}</Text>
        </GridItem>
      </Grid>
      <Text fontSize='2xl' as={'b'}>Historical Position Value</Text>
      {
        graphData?<Box mt={'6'} mb={'12'}>
        <LineChart width={500} height={300} data={graphData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" padding={{left: 10}}>
          </XAxis>
          <YAxis dataKey={"value"}>
          </YAxis>
          <Tooltip />
          {/* <Legend /> */}
          <Line type="monotone" dataKey="value" />
        </LineChart>
        </Box>:
        <Skeleton mt={'6'} mb={'12'} height={'300px'}></Skeleton>
      }
      <Grid
        w={'100%'}
        gridTemplateRows={'80px'}
        templateColumns='repeat(3, 1fr)'
        mb={'8'}
        gap={10}
      >
        <GridItem colSpan={1}>
          <Text fontSize='xl' as={'b'}>Asset</Text>
          <Text>{position?.name}</Text>
        </GridItem>
        <GridItem colSpan={1}>
          <Text fontSize='xl' as={'b'}>Underlying Tokens</Text>
          {
            position?.underlying.map((token)=> <Text>{token}</Text>)
          }
        </GridItem>
      </Grid>
      <Text fontSize='2xl' as={'b'}>Transactions</Text>
      <TableContainer mt={'6'}>
        <Table size='sm'>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Transaction Type</Th>
              <Th>Tokens</Th>
              <Th>USD Value</Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              analytics?.data.map((transaction)=> {
                return (
                  <Tr>
                    <Td>{transaction.date}</Td>
                    <Td>{transaction.transactionType}</Td>
                    <Td>{transaction.tokens}</Td>
                    <Td>${transaction.usdc.toFixed(5)}</Td>
                  </Tr>
                )
              })
            }
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
    </Flex>
  )
}

export default Analytics