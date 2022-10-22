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