import {
  useColorModeValue,
  Flex,
  NumberInput,
  NumberInputField,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Box,
  Text,
  useDisclosure,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { useState } from "react";
import { FetchPositionData } from "../contractCalls/dataFetching";
import { withdraw } from "../contractCalls/transactions";
import { getBlockExplorerUrlTransaction, nFormatter } from "../utils";
import { DangerButton, PrimaryButton } from "./Buttons";
import { useAppContext } from "./Provider";
import { level0 } from "./Theme";
import { close } from "../contractCalls/transactions";

const WithdrawModal = ({
  position,
  refreshData,
  closeSelf,
}: {
  position: FetchPositionData;
  refreshData: Function;
  closeSelf: Function;
}) => {
  const positionSizeDecimals = +position?.formattedAmount || 0;
  const { isOpen: isCloseOpen, onOpen: onCloseOpen, onClose: onCloseClose } = useDisclosure();
  const { contracts, onError, chainId, successModal } = useAppContext();
  const [value, setValue] = useState(0);
  const [isWithdrawing, setWithdrawing] = useState(false);
  const [percentage, setPercentage] = useState("0");
  const usdWithdraw = (value / positionSizeDecimals) * position.usdcValue || 0;
  const [isClosing, setClosing] = useState(false);
  const handleChange = (value) => {
    setValue(+value);
    setPercentage(((value * 100) / positionSizeDecimals).toFixed(1));
  };
  const hangleChangeSlider = (value) => {
    setPercentage(value);
    setValue((positionSizeDecimals * value) / 100);
  };
  const withdrawFromPostion = () => {
    if (value === 0) return;
    console.log(typeof value);
    setWithdrawing(true);
    withdraw(
      contracts,
      position.positionId,
      ethers.utils.parseUnits(value.toFixed(position.decimals), position.decimals)
    )
      .then((hash) => {
        setWithdrawing(false);
        refreshData();
        closeSelf();
        successModal(
          "Withdrawal Successful",
          <Text>
            Assets were withdrawn successfully, View{" "}
            <a href={getBlockExplorerUrlTransaction(chainId, hash)} target="_blank" rel="noopener noreferrer">
              <Text as="u" textColor={"blue.500"}>
                transaction
              </Text>
            </a>
            &nbsp;on block explorer.
          </Text>
        );
      })
      .catch((error) => {
        onError(error);
        setWithdrawing(false);
      });
  };

  const closePosition = () => {
    setClosing(true);
    close(contracts, position.positionId)
      .then((hash) => {
        setClosing(false);
        successModal(
          "Withdrawal Successful",
          <Text>
            Assets were withdrawn successfully, View{" "}
            <a href={getBlockExplorerUrlTransaction(chainId, hash)} target="_blank" rel="noopener noreferrer">
              <Text as="u" textColor={"blue.500"}>
                transaction
              </Text>
            </a>
            &nbsp;on block explorer.
          </Text>
        );
        onCloseClose();
      })
      .catch((error) => {
        setClosing(false);
        onError(error);
      });
  };

  return (
    <Box>
      <Box backgroundColor={useColorModeValue(...level0)} padding="4" borderRadius={"lg"}>
        <Flex mb={"4"} justifyContent={"space-between"}>
          <Box>
            <Text as={"b"} mr={"4"}>
              USD Value:
            </Text>
            <Flex alignItems={"center"}>
              <Text>${usdWithdraw.toFixed(4)}</Text>
            </Flex>
          </Box>
          <Box mb={"4"}>
            <Text as={"b"} mr={"4"}>
              Available:
            </Text>
            <Text>{nFormatter(positionSizeDecimals, 5)}</Text>
          </Box>
        </Flex>
        <Box margin={"auto"} width={"100%"}>
          <NumberInput
            bgColor="hidden"
            min={0}
            max={positionSizeDecimals}
            value={value}
            onChange={handleChange}
            size="lg"
          >
            <NumberInputField bgColor={useColorModeValue("white", "gray.900")} />
          </NumberInput>
          <Box width={"93%"} margin="auto">
            <Slider
              aria-label="slider-ex-1"
              textColor="black"
              flex="1"
              focusThumbOnChange={false}
              value={+percentage}
              max={100}
              onChange={hangleChangeSlider}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px" children={percentage} />
            </Slider>
          </Box>
        </Box>
      </Box>
      <Flex mt={"4"} justifyContent={"space-around"}>
        <PrimaryButton isLoading={isWithdrawing} size="large" onClick={withdrawFromPostion}>
          Withdraw
        </PrimaryButton>
        <DangerButton size={"large"} onClick={onCloseOpen}>
          &nbsp;&nbsp;Close&nbsp;&nbsp;
        </DangerButton>
      </Flex>
      <Modal isCentered isOpen={isCloseOpen} onClose={onCloseClose}>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent padding={"5"}>
          <ModalHeader>Close Position</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={"10"}>Are you sure you want to close the position?</Text>
            <Flex justifyContent={"end"}>
              <DangerButton isLoading={isClosing} mr={"5"} size="large" onClick={closePosition}>
                Confirm
              </DangerButton>
              <PrimaryButton loadingText={"Closing"} size="large" onClick={onCloseClose}>
                Cancel
              </PrimaryButton>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WithdrawModal;
