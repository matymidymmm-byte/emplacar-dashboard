import { auth, db } from "./firebase";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export async function login(email, senha) {
  const credencial =
    await signInWithEmailAndPassword(
      auth,
      email,
      senha
    );
    await credencial.user.getIdToken(true);

  await setDoc(
    doc(db, "usuariosOnline", credencial.user.uid),
    {
      email: credencial.user.email,
      ultimoLogin: new Date().toISOString(),
      online: true,
    },
    { merge: true }
  );

  return credencial;
}

export async function logout() {
  const usuario = auth.currentUser;

  if (usuario) {
    await updateDoc(
      doc(db, "usuariosOnline", usuario.uid),
      {
        online: false,
        ultimoLogout:
          new Date().toISOString(),
      }
    );
  }

  return await signOut(auth);
}