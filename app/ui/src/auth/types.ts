import {UserSession} from "@gen/core/session/v1/session_pb";
import {IUser} from "@gen/interface";

/** The active session of the logged in user. */
export type Session = UserSession


export interface JWT {
  userId: string;
  sessionId: string;
  user: IUser
  iat: number,
  iss: string,
  aud: string,
  exp: number
}
