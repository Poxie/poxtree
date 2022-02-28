import { User } from "../../utils/types";
import userInitialState from "./userInitialState";

export type UserAction = {
    type: 'SET_USER' | 'SET_USER_IS_ME',
    payload: any
}
export type UserState = {user: (User & {isMe?: boolean}) | null, loading: boolean};

export const SET_USER = 'SET_USER';
export const SET_USER_IS_ME = 'SET_USER_IS_ME';