import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe
} from "firebase/auth";
import { auth } from "../services/firebase";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthRepository {
  signup: (data: AuthCredentials) => Promise<User>;
  login: (data: AuthCredentials) => Promise<User>;
  logout: () => Promise<void>;
  subscribe: (cb: (user: User | null) => void) => Unsubscribe;
}

export const authRepository: AuthRepository = {
  async signup({ email, password }) {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    return res.user;
  },
  async login({ email, password }) {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  },
  async logout() {
    await signOut(auth);
  },
  subscribe(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

