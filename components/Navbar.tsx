import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useColorModeValue,
  ModalOverlay,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  NumberInput,
  NumberInputField,
  Stack,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, SettingsIcon } from '@chakra-ui/icons';
import { useWeb3React } from '@web3-react/core'
import { getName, chainLogos, chainNames, supportedChains, walletLogos } from '../utils'
import React from 'react';
import { coinbaseWallet } from '../connectors/coinbaseWallet'
import { metaMask } from '../connectors/metaMask'
import { walletConnect } from '../connectors/walletConnect'
import { useAppContext } from './Provider';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {CSSTransition} from 'react-transition-group'

const Links = [
  {
    label: "Swap",
    href: "/UniversalSwap"
  },
  {
    label: "Assets",
    href: "/"
  },
  {
    label: "Positions",
    href: "/Positions"
  }
];

const NavLink = ({ children }: { children: any }) => {
  const { asPath } = useRouter()
  return (
    <Link href={children.href}>
      <Flex
      alignItems={'center'}
      py={2}
      px={3}
      rounded={'md'}
      bg={children.href===asPath?useColorModeValue('gray.200', 'gray.700'):undefined}
      _hover={{
        cursor: 'pointer',
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}>
        <Text as='b'>{children.label}</Text>
      </Flex>
    </Link>
);}

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
                supportedChains.map((id, index) => {
                  const logoUrl = chainLogos[id]
                  return (
                    <MenuItem key={`menuItem_${index}`} onClick={()=>activateController(connector, id)} paddingBlock={2}>
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
          }}>{account.slice(0, 4)+"..."+account.slice(-3)}
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
          {connectors.map((connector, index)=>{
            const walletName = getName(connector)
            const logoUrl = walletLogos[walletName]
            return (
              <Flex key={`wallet_${index}`} marginBlock={5} cursor={"pointer"} padding={3} rounded={'md'}
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
  const {slippageControl: {slippage, setSlippage}} = useAppContext()
  const [temp, setTemp] = useState(slippage)
  const { isOpen: isOpenSettings, onOpen: onOpenSettings, onClose: onCloseSettings } = useDisclosure();
  const parseSlippage = (val) => val.replace(/^\%/, '')
  const formatSlippage = (val) => val+`%`
  const closeSettings = () => {
    setTemp(slippage)
    onCloseSettings()
  }
  const confirmSlippage = () => {
    setSlippage(temp)
    onCloseSettings()
  }
  const wrapperRef = useRef(null);
  // useOutsideAlerter(wrapperRef);
  
  // function useOutsideAlerter(ref) {
  //   useEffect(() => {
  //     function handleClickOutside(event) {
  //       if (ref.current && !ref.current.contains(event.target)) {
  //         onClose()
  //       }
  //     }
  //     document.addEventListener("mousedown", handleClickOutside);
  //     return () => {
  //       document.removeEventListener("mousedown", handleClickOutside);
  //     };
  //   }, [ref]);
  // }

  return (
    <>
      <Box position={'fixed'} zIndex={100} style={{width: '100vw'}} bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={4} height='100%' alignItems={'center'}>
            <Box mr={'5'}>Logo</Box>
            <HStack
              as={'nav'}
              height='100%'
              spacing={5}
              display={{ base: 'none', md: 'flex' }}>
              {Links.map((link) => (
                <NavLink key={link.href}>{link}</NavLink>
              ))}
            </HStack>
          </HStack>
          <Flex alignItems={'center'} justifyContent={'center'}>
            <SettingsIcon display={{ base: 'none', md: 'flex' }} onClick={onOpenSettings} color={'gray.600'} width={'20px'} height={'20px'} _hover={{cursor:'pointer'}} mr={'4'}></SettingsIcon>
            <Wallet/>
          </Flex>
        </Flex>
      </Box>
      <Modal size={'sm'} isCentered isOpen={isOpenSettings} onClose={closeSettings}>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px)'
        />
        <ModalContent>
          <ModalHeader>Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex justifyContent={'space-between'} alignItems={'center'}>
              <Text alignItems={'center'}>Slippage:</Text>
              <NumberInput  min={0} max={100} onChange={(valueString)=>setTemp(parseSlippage(valueString))} value={formatSlippage(temp)}>
                <NumberInputField />
              </NumberInput>
            </Flex>
          </ModalBody>
          <ModalFooter>
          <Button onClick={confirmSlippage} paddingInline={'10'} colorScheme='blue' rounded={'full'}>Ok</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Box sx={{
          '.my-node-enter': {
            'opacity': 0,
            'transform': 'translateX(-100%)',
          },
          '.my-node-enter-active': {
            'opacity': 1,
            'transform': 'translateX(0%)',
            'transition': 'opacity 300ms, transform 300ms',
          },
          '.my-node-exit': {
            'opacity': 1,
            'transform': 'translateX(0%)',
          },
          '.my-node-exit-active': {
            'opacity': 0,
            'transform': 'translateX(-100%)',
            'transition': 'opacity 300ms, transform 300ms',
          }
        }}>
      <CSSTransition classNames="my-node" nodeRef={wrapperRef} in={isOpen} timeout={300} unmountOnExit>
        <Box zIndex={3} ref={wrapperRef} position={'fixed'} width={'100%'} background={'gray.100'} pb={2} display={{ md: 'none' }}
        onClick={onClose}>
          <Stack pt={'68px'} spacing={0} as={'nav'}>
            {Links.map((link) => (
              <NavLink key={link.href}>{link}</NavLink>
            ))}
            <Flex
            alignItems={'center'}
            px={3}
            py={2}
            rounded={'md'}
            onClick={onOpenSettings}
            _hover={{
              cursor: 'pointer',
              textDecoration: 'none',
              bg: useColorModeValue('gray.200', 'gray.700'),
            }}>
              <Text as='b'>Settings</Text>
            </Flex>
          </Stack>
        </Box>
      </CSSTransition>
      </Box>
    </>
  );
}