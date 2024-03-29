import styled from 'styled-components'
import { Flex } from '.'
import { FlexProps } from './Flex'

export const Circle = styled(Flex)<FlexProps>`
  align-items: center;
  overflow: hidden;
  border-radius: 50%;
`
