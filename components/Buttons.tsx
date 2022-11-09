import { Button } from "@chakra-ui/react"

export const PrimaryButton = (props) => {
  const {size='medium'} = props
  let buttonProps:any
  if (size=='medium') {
    buttonProps = {...props, size: {base: 'sm', md: 'md'}}
  } else if (size=='large') {
    buttonProps = {...props, size: {base: 'md', md: 'lg'}}
  }
  return (
    <Button colorScheme='blue' rounded={'full'} {...buttonProps}></Button>
  )
}

export const SecondaryButton = (props) => {
  const {size='medium'} = props
  let buttonProps:any
  if (size=='medium') {
    buttonProps = {...props, size: {base: 'sm', md: 'md'}}
  } else if (size=='large') {
    buttonProps = {...props, size: {base: 'md', md: 'lg'}}
  }
  return (
    <Button rounded={'full'} {...buttonProps}></Button>
  )
}

export const DangerButton = (props) => {
  const {size='medium'} = props
  let buttonProps:any
  if (size=='medium') {
    buttonProps = {...props, size: {base: 'sm', md: 'md'}}
  } else if (size=='large') {
    buttonProps = {...props, size: {base: 'md', md: 'lg'}}
  }
  return (
    <Button colorScheme={'red'} rounded={'full'} {...buttonProps}></Button>
  )
}

export const FancyButton = (props) => {
  return (
    <Button paddingBlock={'5'} bgGradient='linear(to-l, #822bd9, #3db0f2)' maxWidth={'300px'}
    justifyContent={'center'} alignItems={'center'} borderRadius={'2xl'} boxShadow={'dark-lg'}
    _active={{bgGradient: 'linear(to-l, #531c8a, #308bbf)'}}
    _hover={{cursor: 'pointer', bgGradient: 'linear(to-l, #6823ad, #3db0f2)'}} {...props}></Button>
  )
}