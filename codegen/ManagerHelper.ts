/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export type LiquidationConditionStruct = {
  watchedToken: PromiseOrValue<string>;
  liquidateTo: PromiseOrValue<string>;
  lessThan: PromiseOrValue<boolean>;
  liquidationPoint: PromiseOrValue<BigNumberish>;
  slippage: PromiseOrValue<BigNumberish>;
};

export type LiquidationConditionStructOutput = [
  string,
  string,
  boolean,
  BigNumber,
  BigNumber
] & {
  watchedToken: string;
  liquidateTo: string;
  lessThan: boolean;
  liquidationPoint: BigNumber;
  slippage: BigNumber;
};

export type PositionStruct = {
  user: PromiseOrValue<string>;
  bank: PromiseOrValue<string>;
  bankToken: PromiseOrValue<BigNumberish>;
  amount: PromiseOrValue<BigNumberish>;
  liquidationPoints: LiquidationConditionStruct[];
};

export type PositionStructOutput = [
  string,
  string,
  BigNumber,
  BigNumber,
  LiquidationConditionStructOutput[]
] & {
  user: string;
  bank: string;
  bankToken: BigNumber;
  amount: BigNumber;
  liquidationPoints: LiquidationConditionStructOutput[];
};

export type BankTokenInfoStruct = {
  lpToken: PromiseOrValue<string>;
  manager: PromiseOrValue<string>;
  idInManager: PromiseOrValue<BigNumberish>;
};

export type BankTokenInfoStructOutput = [string, string, BigNumber] & {
  lpToken: string;
  manager: string;
  idInManager: BigNumber;
};

export type PositionDataStruct = {
  position: PositionStruct;
  bankTokenInfo: BankTokenInfoStruct;
  underlyingTokens: PromiseOrValue<string>[];
  underlyingAmounts: PromiseOrValue<BigNumberish>[];
  underlyingValues: PromiseOrValue<BigNumberish>[];
  rewardTokens: PromiseOrValue<string>[];
  rewardAmounts: PromiseOrValue<BigNumberish>[];
  rewardValues: PromiseOrValue<BigNumberish>[];
  usdValue: PromiseOrValue<BigNumberish>;
};

export type PositionDataStructOutput = [
  PositionStructOutput,
  BankTokenInfoStructOutput,
  string[],
  BigNumber[],
  BigNumber[],
  string[],
  BigNumber[],
  BigNumber[],
  BigNumber
] & {
  position: PositionStructOutput;
  bankTokenInfo: BankTokenInfoStructOutput;
  underlyingTokens: string[];
  underlyingAmounts: BigNumber[];
  underlyingValues: BigNumber[];
  rewardTokens: string[];
  rewardAmounts: BigNumber[];
  rewardValues: BigNumber[];
  usdValue: BigNumber;
};

export interface ManagerHelperInterface extends utils.Interface {
  functions: {
    "checkLiquidate(uint256)": FunctionFragment;
    "estimateValue(uint256,address)": FunctionFragment;
    "getPosition(uint256)": FunctionFragment;
    "getPositionRewards(uint256)": FunctionFragment;
    "getPositionTokens(uint256)": FunctionFragment;
    "initialize(address)": FunctionFragment;
    "recommendBank(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "checkLiquidate"
      | "estimateValue"
      | "getPosition"
      | "getPositionRewards"
      | "getPositionTokens"
      | "initialize"
      | "recommendBank"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "checkLiquidate",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "estimateValue",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getPosition",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getPositionRewards",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getPositionTokens",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "recommendBank",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "checkLiquidate",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "estimateValue",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getPosition",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getPositionRewards",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getPositionTokens",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "recommendBank",
    data: BytesLike
  ): Result;

  events: {
    "Initialized(uint8)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
}

export interface InitializedEventObject {
  version: number;
}
export type InitializedEvent = TypedEvent<[number], InitializedEventObject>;

export type InitializedEventFilter = TypedEventFilter<InitializedEvent>;

export interface ManagerHelper extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ManagerHelperInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    checkLiquidate(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber, boolean] & { index: BigNumber; liquidate: boolean }>;

    estimateValue(
      positionId: PromiseOrValue<BigNumberish>,
      inTermsOf: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getPosition(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[PositionDataStructOutput]>;

    getPositionRewards(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[], BigNumber[]] & {
        rewards: string[];
        rewardAmounts: BigNumber[];
        rewardValues: BigNumber[];
      }
    >;

    getPositionTokens(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[], BigNumber[]] & {
        tokens: string[];
        amounts: BigNumber[];
        values: BigNumber[];
      }
    >;

    initialize(
      _manager: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    recommendBank(
      lpToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]]>;
  };

  checkLiquidate(
    positionId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[BigNumber, boolean] & { index: BigNumber; liquidate: boolean }>;

  estimateValue(
    positionId: PromiseOrValue<BigNumberish>,
    inTermsOf: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getPosition(
    positionId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<PositionDataStructOutput>;

  getPositionRewards(
    positionId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<
    [string[], BigNumber[], BigNumber[]] & {
      rewards: string[];
      rewardAmounts: BigNumber[];
      rewardValues: BigNumber[];
    }
  >;

  getPositionTokens(
    positionId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<
    [string[], BigNumber[], BigNumber[]] & {
      tokens: string[];
      amounts: BigNumber[];
      values: BigNumber[];
    }
  >;

  initialize(
    _manager: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  recommendBank(
    lpToken: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<[string[], BigNumber[]]>;

  callStatic: {
    checkLiquidate(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber, boolean] & { index: BigNumber; liquidate: boolean }>;

    estimateValue(
      positionId: PromiseOrValue<BigNumberish>,
      inTermsOf: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getPosition(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PositionDataStructOutput>;

    getPositionRewards(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[], BigNumber[]] & {
        rewards: string[];
        rewardAmounts: BigNumber[];
        rewardValues: BigNumber[];
      }
    >;

    getPositionTokens(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[], BigNumber[]] & {
        tokens: string[];
        amounts: BigNumber[];
        values: BigNumber[];
      }
    >;

    initialize(
      _manager: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    recommendBank(
      lpToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]]>;
  };

  filters: {
    "Initialized(uint8)"(version?: null): InitializedEventFilter;
    Initialized(version?: null): InitializedEventFilter;
  };

  estimateGas: {
    checkLiquidate(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    estimateValue(
      positionId: PromiseOrValue<BigNumberish>,
      inTermsOf: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getPosition(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getPositionRewards(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getPositionTokens(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initialize(
      _manager: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    recommendBank(
      lpToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    checkLiquidate(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    estimateValue(
      positionId: PromiseOrValue<BigNumberish>,
      inTermsOf: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getPosition(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getPositionRewards(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getPositionTokens(
      positionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initialize(
      _manager: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    recommendBank(
      lpToken: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
