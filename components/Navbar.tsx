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
  Switch,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, SettingsIcon, SunIcon, MoonIcon } from '@chakra-ui/icons';
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
    href: "/"
  },
  {
    label: "Assets",
    href: "/Assets"
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
      backgroundColor={children.href===asPath?'gray.300':undefined}
      _hover={{
        cursor: 'pointer',
        textDecoration: 'none',
        backgroundColor: 'gray.300'
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
          backgroundColor: 'gray.300'
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
            backgroundColor: 'gray.300'
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
                backgroundColor: 'gray.300'
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
      <Box borderBottomColor={'gray.300'} shadow='base' position={'fixed'} zIndex={100} style={{width: '100vw'}} backgroundColor='gray.100' px={4}>
        <Flex maxWidth={'1300px'} margin='auto' h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={4} height='100%' alignItems={'center'}>
            <Box borderRadius={'2xl'} paddingInline='4' paddingBlock={'2'}>
              <Text fontSize={'2xl'} as='b' color='blue.600'>Delimit</Text>
            </Box>
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
            <Flex
              display={{ base: 'none', md: 'flex' }}
              padding='2'
              alignItems={'center'} justifyContent={'center'}
              mr={'4'} rounded={'md'}
              _hover={{cursor: 'pointer', backgroundColor: 'gray.300'}}
              onClick={onOpenSettings}>
              <SettingsIcon color={'gray.600'} width={'20px'} height={'20px'}></SettingsIcon>
            </Flex>
            <Wallet/>
          </Flex>
        </Flex>
      </Box>
      <Modal size={'xs'} isCentered isOpen={isOpenSettings} onClose={closeSettings}>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px)'
        />
        <ModalContent>
          <ModalHeader>Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex alignItems={'center'}>
              <Text width={'50%'} alignItems={'center'}>Slippage:</Text>
              <NumberInput width={'50%'} min={0} max={100} onChange={(valueString)=>setTemp(parseSlippage(valueString))} value={formatSlippage(temp)}>
                <NumberInputField />
              </NumberInput>
            </Flex>
            <Flex marginTop={'5'} alignItems='center'>
              <Text width={'50%'} alignItems={'center'}>Dark Mode:</Text>
              <Flex width={'50%'}>
                <SunIcon/>
                <Switch paddingInline='2'></Switch>
                <MoonIcon/>
              </Flex>
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
        <Box boxShadow={'2xl'} zIndex={3} ref={wrapperRef} position={'fixed'} width={'100%'} background={'gray.100'} pb={2} display={{ md: 'none' }}
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
              backgroundColor: 'gray.300'
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