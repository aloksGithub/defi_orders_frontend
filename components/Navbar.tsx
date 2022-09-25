import { ReactNode, useCallback, useEffect } from 'react';
import {
  Box,
  Flex,
  Avatar,
  HStack,
  Link,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  ModalOverlay,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useWeb3React } from '@web3-react/core'
import { getName, chainLogos, chainNames, supportedChains, walletLogos } from '../utils'
import React from 'react';
import { coinbaseWallet, hooks as coinbaseWalletHooks } from '../connectors/coinbaseWallet'
import { hooks as metaMaskHooks, metaMask } from '../connectors/metaMask'
import { hooks as networkHooks, network } from '../connectors/network'
import { hooks as walletConnectHooks, walletConnect } from '../connectors/walletConnect'

const Links = [
  {
    label: "Your Assets",
    href: "/Assets"
  },
  {
    label: "Your Positions",
    href: "/Positions"
  },
  {
    label: "Get Assets",
    href: "/UniversalSwap"
  }
];

const NavLink = ({ children }: { children: any }) => (
  <Link
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
    href={children.href}>
      <Text as='b'>{children.label}</Text>
    
  </Link>
);

const Wallet = () => {
  const {isActive, account, chainId, connector} = useWeb3React()
  const connectors = [metaMask, coinbaseWallet, walletConnect]

  const Overlay = () => (
    <ModalOverlay
      bg='blackAlpha.300'
      backdropFilter='blur(10px)'
    />
  )
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [overlay, setOverlay] = React.useState(<Overlay />)

  const activateController = async (connector, chainId) => {
    try {
      if (chainId) {
        await connector.activate(chainId||1)
      } else {
        await connector.activate()
      }
      onClose()
    } catch {
      console.log("ERROR")
    }
  }

  return (
    <>
    {(isActive && account)?
    (
      <Flex justifyContent={"center"} alignItems={"center"}>
        <Box marginRight={2} px={2} py={1} rounded={'md'} cursor={"pointer"}
        _hover={{
          textDecoration: 'none',
          bg: useColorModeValue('gray.200', 'gray.700'),
        }}>
          <Menu>
            <MenuButton
              as={Button}
              rounded={'full'}
              variant={'link'}
              cursor={'pointer'}
              padding={0}
              display={"flex"}
              alignItems={"center"}
              minW={0}>
              <img src={chainId in chainLogos? chainLogos[chainId]: chainLogos[1]} style={{height: "25px"}}/>
            </MenuButton>
            <MenuList>
              {
                supportedChains.map(id => {
                  const logoUrl = chainLogos[id]
                  return (
                    <MenuItem onClick={()=>activateController(connector, id)} paddingBlock={2}>
                      <Flex alignItems={"center"}>
                        <img src={logoUrl} style={{width: "20px", height: "20px"}}/>
                        <Text paddingLeft={3}>{chainNames[id]}</Text>
                      </Flex>
                    </MenuItem>
                  )
                })
              }
            </MenuList>
          </Menu>
        </Box>
        <Text as='b' cursor={"pointer"} px={2} py={1} rounded={'md'}
          _hover={{
            textDecoration: 'none',
            bg: useColorModeValue('gray.200', 'gray.700'),
          }}
          onClick={() => {
            setOverlay(<Overlay />)
            onOpen()
          }}>{account.slice(0, 5)+"..."+account.slice(-4)}
        </Text>
      </Flex>
    )
    :
    (
      <Box>
        <Button
          onClick={() => {
            setOverlay(<Overlay />)
            onOpen()
          }}
          >
          Connect Wallet
        </Button>
      </Box>
    )}
    <Modal isCentered isOpen={isOpen} onClose={onClose}>
      {overlay}
      <ModalContent>
        <ModalHeader>Connect Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {connectors.map(connector=>{
            const walletName = getName(connector)
            const logoUrl = walletLogos[walletName]
            return (
              <Flex marginBlock={5} cursor={"pointer"} padding={3} rounded={'md'}
              onClick={()=>activateController(connector, undefined)}
              _hover={{
                textDecoration: 'none',
                bg: useColorModeValue('gray.200', 'gray.700'),
              }}>
                <img src={logoUrl} width="30px"/>
                <Text paddingLeft={3}>{walletName}</Text>
              </Flex>
            )
          })}
        </ModalBody>
      </ModalContent>
    </Modal>
    </>
  )
}

export function Navbar() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <Box>Logo</Box>
            <HStack
              as={'nav'}
              spacing={4}
              display={{ base: 'none', md: 'flex' }}>
              {Links.map((link) => (
                <NavLink key={link.href}>{link}</NavLink>
              ))}
            </HStack>
          </HStack>
          <Flex alignItems={'center'}>
            <Wallet/>
          </Flex>
        </Flex>
      </Box>
    </>
  );
}