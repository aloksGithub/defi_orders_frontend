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
import type { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent, PromiseOrValue } from "./common";

export interface BankBaseInterface extends utils.Interface {
  functions: {
    "burn(uint256,address,uint256,address)": FunctionFragment;
    "decodeId(uint256)": FunctionFragment;
    "getIdFromLpToken(address)": FunctionFragment;
    "getLPToken(uint256)": FunctionFragment;
    "getPendingRewardsForUser(uint256,address)": FunctionFragment;
    "getPositionTokens(uint256,address)": FunctionFragment;
    "getRewards(uint256)": FunctionFragment;
    "getUnderlyingForFirstDeposit(uint256)": FunctionFragment;
    "getUnderlyingForRecurringDeposit(uint256)": FunctionFragment;
    "harvest(uint256,address,address)": FunctionFragment;
    "isUnderlyingERC721()": FunctionFragment;
    "mint(uint256,address,address[],uint256[])": FunctionFragment;
    "mintRecurring(uint256,address,address[],uint256[])": FunctionFragment;
    "name()": FunctionFragment;
    "owner()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "burn"
      | "decodeId"
      | "getIdFromLpToken"
      | "getLPToken"
      | "getPendingRewardsForUser"
      | "getPositionTokens"
      | "getRewards"
      | "getUnderlyingForFirstDeposit"
      | "getUnderlyingForRecurringDeposit"
      | "harvest"
      | "isUnderlyingERC721"
      | "mint"
      | "mintRecurring"
      | "name"
      | "owner"
      | "renounceOwnership"
      | "transferOwnership"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "burn",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<string>, PromiseOrValue<BigNumberish>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "decodeId", values: [PromiseOrValue<BigNumberish>]): string;
  encodeFunctionData(functionFragment: "getIdFromLpToken", values: [PromiseOrValue<string>]): string;
  encodeFunctionData(functionFragment: "getLPToken", values: [PromiseOrValue<BigNumberish>]): string;
  encodeFunctionData(
    functionFragment: "getPendingRewardsForUser",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "getPositionTokens",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "getRewards", values: [PromiseOrValue<BigNumberish>]): string;
  encodeFunctionData(functionFragment: "getUnderlyingForFirstDeposit", values: [PromiseOrValue<BigNumberish>]): string;
  encodeFunctionData(
    functionFragment: "getUnderlyingForRecurringDeposit",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "harvest",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<string>, PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "isUnderlyingERC721", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "mint",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<string>[],
      PromiseOrValue<BigNumberish>[]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "mintRecurring",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<string>,
      PromiseOrValue<string>[],
      PromiseOrValue<BigNumberish>[]
    ]
  ): string;
  encodeFunctionData(functionFragment: "name", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
  encodeFunctionData(functionFragment: "transferOwnership", values: [PromiseOrValue<string>]): string;

  decodeFunctionResult(functionFragment: "burn", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "decodeId", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getIdFromLpToken", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getLPToken", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getPendingRewardsForUser", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getPositionTokens", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getRewards", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getUnderlyingForFirstDeposit", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getUnderlyingForRecurringDeposit", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "harvest", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "isUnderlyingERC721", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "mint", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "mintRecurring", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;

  events: {
    "Burn(uint256,address,uint256,address)": EventFragment;
    "Harvest(uint256,address,address)": EventFragment;
    "Mint(uint256,address,uint256)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Burn"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Harvest"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Mint"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export interface BurnEventObject {
  tokenId: BigNumber;
  userAddress: string;
  amount: BigNumber;
  receiver: string;
}
export type BurnEvent = TypedEvent<[BigNumber, string, BigNumber, string], BurnEventObject>;

export type BurnEventFilter = TypedEventFilter<BurnEvent>;

export interface HarvestEventObject {
  tokenId: BigNumber;
  userAddress: string;
  receiver: string;
}
export type HarvestEvent = TypedEvent<[BigNumber, string, string], HarvestEventObject>;

export type HarvestEventFilter = TypedEventFilter<HarvestEvent>;

export interface MintEventObject {
  tokenId: BigNumber;
  userAddress: string;
  amount: BigNumber;
}
export type MintEvent = TypedEvent<[BigNumber, string, BigNumber], MintEventObject>;

export type MintEventFilter = TypedEventFilter<MintEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<[string, string], OwnershipTransferredEventObject>;

export type OwnershipTransferredEventFilter = TypedEventFilter<OwnershipTransferredEvent>;

export interface BankBase extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: BankBaseInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    burn(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      receiver: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    decodeId(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string, string, BigNumber]>;

    getIdFromLpToken(lpToken: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[boolean, BigNumber]>;

    getLPToken(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string]>;

    getPendingRewardsForUser(
      tokenId: PromiseOrValue<BigNumberish>,
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]] & { rewards: string[]; amounts: BigNumber[] }>;

    getPositionTokens(
      tokenId: PromiseOrValue<BigNumberish>,
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]] & { tokens: string[]; amounts: BigNumber[] }>;

    getRewards(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string[]] & { rewardsArray: string[] }>;

    getUnderlyingForFirstDeposit(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]] & { underlying: string[]; ratios: BigNumber[] }>;

    getUnderlyingForRecurringDeposit(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]] & { ratios: BigNumber[] }>;

    harvest(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      receiver: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    isUnderlyingERC721(overrides?: CallOverrides): Promise<[boolean]>;

    mint(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      suppliedTokens: PromiseOrValue<string>[],
      suppliedAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    mintRecurring(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      suppliedTokens: PromiseOrValue<string>[],
      suppliedAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    name(overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(overrides?: Overrides & { from?: PromiseOrValue<string> }): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  burn(
    tokenId: PromiseOrValue<BigNumberish>,
    userAddress: PromiseOrValue<string>,
    amount: PromiseOrValue<BigNumberish>,
    receiver: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  decodeId(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string, string, BigNumber]>;

  getIdFromLpToken(lpToken: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[boolean, BigNumber]>;

  getLPToken(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;

  getPendingRewardsForUser(
    tokenId: PromiseOrValue<BigNumberish>,
    user: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<[string[], BigNumber[]] & { rewards: string[]; amounts: BigNumber[] }>;

  getPositionTokens(
    tokenId: PromiseOrValue<BigNumberish>,
    user: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<[string[], BigNumber[]] & { tokens: string[]; amounts: BigNumber[] }>;

  getRewards(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string[]>;

  getUnderlyingForFirstDeposit(
    tokenId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[string[], BigNumber[]] & { underlying: string[]; ratios: BigNumber[] }>;

  getUnderlyingForRecurringDeposit(
    tokenId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<[string[], BigNumber[]] & { ratios: BigNumber[] }>;

  harvest(
    tokenId: PromiseOrValue<BigNumberish>,
    userAddress: PromiseOrValue<string>,
    receiver: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  isUnderlyingERC721(overrides?: CallOverrides): Promise<boolean>;

  mint(
    tokenId: PromiseOrValue<BigNumberish>,
    userAddress: PromiseOrValue<string>,
    suppliedTokens: PromiseOrValue<string>[],
    suppliedAmounts: PromiseOrValue<BigNumberish>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  mintRecurring(
    tokenId: PromiseOrValue<BigNumberish>,
    userAddress: PromiseOrValue<string>,
    suppliedTokens: PromiseOrValue<string>[],
    suppliedAmounts: PromiseOrValue<BigNumberish>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  name(overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(overrides?: Overrides & { from?: PromiseOrValue<string> }): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    burn(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      receiver: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]]>;

    decodeId(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<[string, string, BigNumber]>;

    getIdFromLpToken(lpToken: PromiseOrValue<string>, overrides?: CallOverrides): Promise<[boolean, BigNumber]>;

    getLPToken(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string>;

    getPendingRewardsForUser(
      tokenId: PromiseOrValue<BigNumberish>,
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]] & { rewards: string[]; amounts: BigNumber[] }>;

    getPositionTokens(
      tokenId: PromiseOrValue<BigNumberish>,
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]] & { tokens: string[]; amounts: BigNumber[] }>;

    getRewards(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<string[]>;

    getUnderlyingForFirstDeposit(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]] & { underlying: string[]; ratios: BigNumber[] }>;

    getUnderlyingForRecurringDeposit(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string[], BigNumber[]] & { ratios: BigNumber[] }>;

    harvest(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      receiver: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<
      [string[], BigNumber[]] & {
        rewardAddresses: string[];
        rewardAmounts: BigNumber[];
      }
    >;

    isUnderlyingERC721(overrides?: CallOverrides): Promise<boolean>;

    mint(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      suppliedTokens: PromiseOrValue<string>[],
      suppliedAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    mintRecurring(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      suppliedTokens: PromiseOrValue<string>[],
      suppliedAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    name(overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    transferOwnership(newOwner: PromiseOrValue<string>, overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "Burn(uint256,address,uint256,address)"(
      tokenId?: null,
      userAddress?: null,
      amount?: null,
      receiver?: null
    ): BurnEventFilter;
    Burn(tokenId?: null, userAddress?: null, amount?: null, receiver?: null): BurnEventFilter;

    "Harvest(uint256,address,address)"(tokenId?: null, userAddress?: null, receiver?: null): HarvestEventFilter;
    Harvest(tokenId?: null, userAddress?: null, receiver?: null): HarvestEventFilter;

    "Mint(uint256,address,uint256)"(tokenId?: null, userAddress?: null, amount?: null): MintEventFilter;
    Mint(tokenId?: null, userAddress?: null, amount?: null): MintEventFilter;

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
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      receiver: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    decodeId(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;

    getIdFromLpToken(lpToken: PromiseOrValue<string>, overrides?: CallOverrides): Promise<BigNumber>;

    getLPToken(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;

    getPendingRewardsForUser(
      tokenId: PromiseOrValue<BigNumberish>,
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getPositionTokens(
      tokenId: PromiseOrValue<BigNumberish>,
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getRewards(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;

    getUnderlyingForFirstDeposit(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<BigNumber>;

    getUnderlyingForRecurringDeposit(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    harvest(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      receiver: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    isUnderlyingERC721(overrides?: CallOverrides): Promise<BigNumber>;

    mint(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      suppliedTokens: PromiseOrValue<string>[],
      suppliedAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    mintRecurring(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      suppliedTokens: PromiseOrValue<string>[],
      suppliedAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    name(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(overrides?: Overrides & { from?: PromiseOrValue<string> }): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    burn(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      amount: PromiseOrValue<BigNumberish>,
      receiver: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    decodeId(id: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getIdFromLpToken(lpToken: PromiseOrValue<string>, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getLPToken(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getPendingRewardsForUser(
      tokenId: PromiseOrValue<BigNumberish>,
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getPositionTokens(
      tokenId: PromiseOrValue<BigNumberish>,
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getRewards(tokenId: PromiseOrValue<BigNumberish>, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getUnderlyingForFirstDeposit(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getUnderlyingForRecurringDeposit(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    harvest(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      receiver: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    isUnderlyingERC721(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    mint(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      suppliedTokens: PromiseOrValue<string>[],
      suppliedAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    mintRecurring(
      tokenId: PromiseOrValue<BigNumberish>,
      userAddress: PromiseOrValue<string>,
      suppliedTokens: PromiseOrValue<string>[],
      suppliedAmounts: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    name(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(overrides?: Overrides & { from?: PromiseOrValue<string> }): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
