import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

export async function login(email, senha) {
  return await signInWithEmailAndPassword(auth, email, senha);
}

export async function logout() {
  return await signOut(auth);
}