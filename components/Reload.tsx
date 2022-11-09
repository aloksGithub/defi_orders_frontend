import { Center } from "@chakra-ui/react"
import { AiOutlineReload } from "react-icons/ai"
import { keyframes } from '@chakra-ui/react'

export const Reload = ({onReload, loading}) => {

  const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `

  const animation = loading?`${spin} infinite 1s linear`:undefined

  const reload = () => {
    if (loading) return
    onReload()
  }

  return (
    <Center w={'40px'} h={'40px'} p={'2'} borderRadius={'lg'}
    backgroundColor={!loading?'gray.200':'gray.100'}
    _hover={{cursor:!loading?'pointer':undefined, backgroundColor: !loading?'gray.300':'gray.200'}} onClick={reload}>
      <Center animation={animation}>
        <AiOutlineReload style={{}} fontSize={'1.2rem'}></AiOutlineReload>
      </Center>
    </Center>
  )
}