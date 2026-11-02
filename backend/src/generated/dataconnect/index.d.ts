import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface CreateWardrobeData {
  wardrobe_insert: Wardrobe_Key;
}

export interface CreateWardrobeItemData {
  wardrobeItem_insert: WardrobeItem_Key;
}

export interface CreateWardrobeItemVariables {
  itemName: string;
  wardrobeId: number;
  photoUri?: string | null;
  purchaseDate?: TimestampString | null;
  expiryDate?: TimestampString | null;
  price?: number | null;
  brand?: string | null;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  state?: string | null;
}

export interface CreateWardrobeVariables {
  name: string;
  description?: string | null;
}

export interface DeleteWardrobeData {
  wardrobe_delete?: Wardrobe_Key | null;
}

export interface DeleteWardrobeItemData {
  wardrobeItem_delete?: WardrobeItem_Key | null;
}

export interface DeleteWardrobeItemVariables {
  id: number;
}

export interface DeleteWardrobeVariables {
  id: number;
}

export interface EnsureUserData {
  user_upsert: User_Key;
}

export interface EnsureUserVariables {
  email?: string | null;
  displayName?: string | null;
}

export interface GetMeData {
  user?: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    createdAt: TimestampString;
  } & User_Key;
}

export interface GetWardrobeData {
  wardrobe?: {
    id: number;
    name: string;
    description?: string | null;
    ownerUid: string;
    createdAt: TimestampString;
  } & Wardrobe_Key;
}

export interface GetWardrobeItemData {
  wardrobeItem?: {
    id: number;
    photoUri?: string | null;
    wardrobeId: number;
    ownerUid: string;
  } & WardrobeItem_Key;
}

export interface GetWardrobeItemVariables {
  id: number;
}

export interface GetWardrobeVariables {
  id: number;
}

export interface ListWardrobeItemsByWardrobeData {
  wardrobeItems: ({
    id: number;
    photoUri?: string | null;
    itemName: string;
    purchaseDate?: TimestampString | null;
    expiryDate?: TimestampString | null;
    price?: number | null;
    brand?: string | null;
    category?: string | null;
    color?: string | null;
    size?: string | null;
    state?: string | null;
    wardrobeId: number;
    ownerUid: string;
    createdAt: TimestampString;
  } & WardrobeItem_Key)[];
}

export interface ListWardrobeItemsByWardrobeVariables {
  wardrobeId: number;
}

export interface ListWardrobeItemsData {
  wardrobeItems: ({
    id: number;
    photoUri?: string | null;
    itemName: string;
    purchaseDate?: TimestampString | null;
    expiryDate?: TimestampString | null;
    price?: number | null;
    brand?: string | null;
    category?: string | null;
    color?: string | null;
    size?: string | null;
    state?: string | null;
    wardrobeId: number;
    ownerUid: string;
    createdAt: TimestampString;
  } & WardrobeItem_Key)[];
}

export interface ListWardrobesData {
  wardrobes: ({
    id: number;
    name: string;
    description?: string | null;
    ownerUid: string;
    createdAt: TimestampString;
  } & Wardrobe_Key)[];
}

export interface ListWardrobesWithItemsData {
  wardrobes: ({
    id: number;
    name: string;
    description?: string | null;
    ownerUid: string;
    createdAt: TimestampString;
    items: ({
      id: number;
      photoUri?: string | null;
      price?: number | null;
      createdAt: TimestampString;
    } & WardrobeItem_Key)[];
  } & Wardrobe_Key)[];
}

export interface User_Key {
  uid: string;
  __typename?: 'User_Key';
}

export interface WardrobeItem_Key {
  id: number;
  __typename?: 'WardrobeItem_Key';
}

export interface Wardrobe_Key {
  id: number;
  __typename?: 'Wardrobe_Key';
}

/** Generated Node Admin SDK operation action function for the 'EnsureUser' Mutation. Allow users to execute without passing in DataConnect. */
export function ensureUser(dc: DataConnect, vars?: EnsureUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<EnsureUserData>>;
/** Generated Node Admin SDK operation action function for the 'EnsureUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function ensureUser(vars?: EnsureUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<EnsureUserData>>;

/** Generated Node Admin SDK operation action function for the 'CreateWardrobe' Mutation. Allow users to execute without passing in DataConnect. */
export function createWardrobe(dc: DataConnect, vars: CreateWardrobeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateWardrobeData>>;
/** Generated Node Admin SDK operation action function for the 'CreateWardrobe' Mutation. Allow users to pass in custom DataConnect instances. */
export function createWardrobe(vars: CreateWardrobeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateWardrobeData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteWardrobe' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteWardrobe(dc: DataConnect, vars: DeleteWardrobeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteWardrobeData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteWardrobe' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteWardrobe(vars: DeleteWardrobeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteWardrobeData>>;

/** Generated Node Admin SDK operation action function for the 'CreateWardrobeItem' Mutation. Allow users to execute without passing in DataConnect. */
export function createWardrobeItem(dc: DataConnect, vars: CreateWardrobeItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateWardrobeItemData>>;
/** Generated Node Admin SDK operation action function for the 'CreateWardrobeItem' Mutation. Allow users to pass in custom DataConnect instances. */
export function createWardrobeItem(vars: CreateWardrobeItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateWardrobeItemData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteWardrobeItem' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteWardrobeItem(dc: DataConnect, vars: DeleteWardrobeItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteWardrobeItemData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteWardrobeItem' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteWardrobeItem(vars: DeleteWardrobeItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteWardrobeItemData>>;

/** Generated Node Admin SDK operation action function for the 'GetMe' Query. Allow users to execute without passing in DataConnect. */
export function getMe(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMeData>>;
/** Generated Node Admin SDK operation action function for the 'GetMe' Query. Allow users to pass in custom DataConnect instances. */
export function getMe(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMeData>>;

/** Generated Node Admin SDK operation action function for the 'ListWardrobes' Query. Allow users to execute without passing in DataConnect. */
export function listWardrobes(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListWardrobesData>>;
/** Generated Node Admin SDK operation action function for the 'ListWardrobes' Query. Allow users to pass in custom DataConnect instances. */
export function listWardrobes(options?: OperationOptions): Promise<ExecuteOperationResponse<ListWardrobesData>>;

/** Generated Node Admin SDK operation action function for the 'ListWardrobesWithItems' Query. Allow users to execute without passing in DataConnect. */
export function listWardrobesWithItems(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListWardrobesWithItemsData>>;
/** Generated Node Admin SDK operation action function for the 'ListWardrobesWithItems' Query. Allow users to pass in custom DataConnect instances. */
export function listWardrobesWithItems(options?: OperationOptions): Promise<ExecuteOperationResponse<ListWardrobesWithItemsData>>;

/** Generated Node Admin SDK operation action function for the 'GetWardrobe' Query. Allow users to execute without passing in DataConnect. */
export function getWardrobe(dc: DataConnect, vars: GetWardrobeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetWardrobeData>>;
/** Generated Node Admin SDK operation action function for the 'GetWardrobe' Query. Allow users to pass in custom DataConnect instances. */
export function getWardrobe(vars: GetWardrobeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetWardrobeData>>;

/** Generated Node Admin SDK operation action function for the 'GetWardrobeItem' Query. Allow users to execute without passing in DataConnect. */
export function getWardrobeItem(dc: DataConnect, vars: GetWardrobeItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetWardrobeItemData>>;
/** Generated Node Admin SDK operation action function for the 'GetWardrobeItem' Query. Allow users to pass in custom DataConnect instances. */
export function getWardrobeItem(vars: GetWardrobeItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetWardrobeItemData>>;

/** Generated Node Admin SDK operation action function for the 'ListWardrobeItems' Query. Allow users to execute without passing in DataConnect. */
export function listWardrobeItems(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListWardrobeItemsData>>;
/** Generated Node Admin SDK operation action function for the 'ListWardrobeItems' Query. Allow users to pass in custom DataConnect instances. */
export function listWardrobeItems(options?: OperationOptions): Promise<ExecuteOperationResponse<ListWardrobeItemsData>>;

/** Generated Node Admin SDK operation action function for the 'ListWardrobeItemsByWardrobe' Query. Allow users to execute without passing in DataConnect. */
export function listWardrobeItemsByWardrobe(dc: DataConnect, vars: ListWardrobeItemsByWardrobeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListWardrobeItemsByWardrobeData>>;
/** Generated Node Admin SDK operation action function for the 'ListWardrobeItemsByWardrobe' Query. Allow users to pass in custom DataConnect instances. */
export function listWardrobeItemsByWardrobe(vars: ListWardrobeItemsByWardrobeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListWardrobeItemsByWardrobeData>>;

