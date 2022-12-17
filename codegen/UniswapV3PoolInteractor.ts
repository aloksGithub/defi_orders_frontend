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
  PayableOverrides,
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

export type AssetStruct = {
  pool: PromiseOrValue<string>;
  manager: PromiseOrValue<string>;
  tokenId: PromiseOrValue<BigNumberish>;
  liquidity: PromiseOrValue<BigNumberish>;
  data: PromiseOrValue<BytesLike>;
};

export type AssetStructOutput = [
  string,
  string,
  BigNumber,
  BigNumber,
  string
] & {
  pool: string;
  manager: string;
  tokenId: BigNumber;
  liquidity: BigNumber;
  data: string;
};

export interface UniswapV3PoolInteractorInterface extends utils.Interface {
  functions: {
    "burn((address,address,uint256,uint256,bytes))": FunctionFragment;
    "getRatio(address,int24,int24)": FunctionFragment;
    "getTickAtRatio(uint160)": FunctionFragment;
    "getUnderlyingAmount((address,address,uint256,uint256,bytes))": FunctionFragment;
    "getUnderlyingTokens(address)": FunctionFragment;
    "mint((address,address,uint256,uint256,bytes),address[],uint256[],address)": FunctionFragment;
    "owner()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "simulateMint((address,address,uint256,uint256,bytes),address[],uint256[])": FunctionFragment;
    "supportedManager()": FunctionFragment;
    "testSupported(address)": FunctionFragment;
    "testSupportedPool(address)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "burn"
      | "getRatio"
      | "getTickAtRatio"
      | "getUnderlyingAmount"
      | "getUnderlyingTokens"
      | "mint"
      | "owner"
      | "renounceOwnership"
      | "simulateMint"
      | "supportedManager"
      | "testSupported"
      | "testSupportedPool"
      | "transferOwnership"
  ): FunctionFragment;

  encodeFunctionData(functionFragment: "burn", values: [AssetStruct]): string;
  encodeFunctionData(
    functionFragment: "getRatio",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getTickAtRatio",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getUnderlyingAmount",
    values: [AssetStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "getUnderlyingTokens",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "mint",
    values: [
      AssetStruct,
      PromiseOrValue<string>[],
      PromiseOrValue<BigNumberish>[],
      PromiseOrValue<string>
    ]
  ): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "simulateMint",
    values: [
      AssetStruct,
      PromiseOrValue<string>[],
      PromiseOrValue<BigNumberish>[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "supportedManager",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "testSupported",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "testSupportedPool",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(functionFragment: "burn", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getRatio", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getTickAtRatio",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getUnderlyingAmount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getUnderlyingTokens",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "mint", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "simulateMint",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportedManager",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "testSupported",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "testSupportedPool",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface UniswapV3PoolInteractor extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: UniswapV3PoolInteractorInterface;

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
    burn(
      asset: AssetStruct,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    getRatio(
      poolAddress: PromiseOrValue<string>,
      tick0: PromiseOrValue<BigNumberish>,
      tick1: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    getTickAtRatio(
      ratio: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[number]>;

    getUnderlyingAmount(
      nft: AssetStruct,
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[]] & { underlying: string[]; amounts: BigNumber[] }
    >;

    getUnderlyingTokens(
      lpTokenAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    mint(
      toMint: AssetStruct,
      underlyingTokens: PromiseOrValue<string>[],
      underlyingAmounts: PromiseOrValue<BigNumberish>[],
      receiver: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    simulateMint(
      toMint: AssetStruct,
      underlyingTokens: PromiseOrValue<string>[],
      underlyingAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { liquidity: BigNumber }>;

    supportedManager(overrides?: CallOverrides): Promise<[string]>;

    testSupported(
      token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    testSupportedPool(
      poolAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  burn(
    asset: AssetStruct,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  getRatio(
    poolAddress: PromiseOrValue<string>,
    tick0: PromiseOrValue<BigNumberish>,
    tick1: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[BigNumber, BigNumber]>;

  getTickAtRatio(
    ratio: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<number>;

  getUnderlyingAmount(
    nft: AssetStruct,
    overrides?: CallOverrides
  ): Promise<
    [string[], BigNumber[]] & { underlying: string[]; amounts: BigNumber[] }
  >;

  getUnderlyingTokens(
    lpTokenAddress: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<string[]>;

  mint(
    toMint: AssetStruct,
    underlyingTokens: PromiseOrValue<string>[],
    underlyingAmounts: PromiseOrValue<BigNumberish>[],
    receiver: PromiseOrValue<string>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  owner(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  simulateMint(
    toMint: AssetStruct,
    underlyingTokens: PromiseOrValue<string>[],
    underlyingAmounts: PromiseOrValue<BigNumberish>[],
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  supportedManager(overrides?: CallOverrides): Promise<string>;

  testSupported(
    token: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  testSupportedPool(
    poolAddress: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    burn(
      asset: AssetStruct,
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[]] & {
        receivedTokens: string[];
        receivedTokenAmounts: BigNumber[];
      }
    >;

    getRatio(
      poolAddress: PromiseOrValue<string>,
      tick0: PromiseOrValue<BigNumberish>,
      tick1: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber, BigNumber]>;

    getTickAtRatio(
      ratio: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<number>;

    getUnderlyingAmount(
      nft: AssetStruct,
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[]] & { underlying: string[]; amounts: BigNumber[] }
    >;

    getUnderlyingTokens(
      lpTokenAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string[]>;

    mint(
      toMint: AssetStruct,
      underlyingTokens: PromiseOrValue<string>[],
      underlyingAmounts: PromiseOrValue<BigNumberish>[],
      receiver: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    simulateMint(
      toMint: AssetStruct,
      underlyingTokens: PromiseOrValue<string>[],
      underlyingAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    supportedManager(overrides?: CallOverrides): Promise<string>;

    testSupported(
      token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    testSupportedPool(
      poolAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
  };

  estimateGas: {
    burn(
      asset: AssetStruct,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    getRatio(
      poolAddress: PromiseOrValue<string>,
      tick0: PromiseOrValue<BigNumberish>,
      tick1: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getTickAtRatio(
      ratio: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getUnderlyingAmount(
      nft: AssetStruct,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getUnderlyingTokens(
      lpTokenAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    mint(
      toMint: AssetStruct,
      underlyingTokens: PromiseOrValue<string>[],
      underlyingAmounts: PromiseOrValue<BigNumberish>[],
      receiver: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    simulateMint(
      toMint: AssetStruct,
      underlyingTokens: PromiseOrValue<string>[],
      underlyingAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    supportedManager(overrides?: CallOverrides): Promise<BigNumber>;

    testSupported(
      token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    testSupportedPool(
      poolAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    burn(
      asset: AssetStruct,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    getRatio(
      poolAddress: PromiseOrValue<string>,
      tick0: PromiseOrValue<BigNumberish>,
      tick1: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getTickAtRatio(
      ratio: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getUnderlyingAmount(
      nft: AssetStruct,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getUnderlyingTokens(
      lpTokenAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    mint(
      toMint: AssetStruct,
      underlyingTokens: PromiseOrValue<string>[],
      underlyingAmounts: PromiseOrValue<BigNumberish>[],
      receiver: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    simulateMint(
      toMint: AssetStruct,
      underlyingTokens: PromiseOrValue<string>[],
      underlyingAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    supportedManager(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    testSupported(
      token: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    testSupportedPool(
      poolAddress: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
