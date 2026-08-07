import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'

export async function register(name, email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName: name })
  return result.user
}
export async function login(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}
export async function logout() {
  await signOut(auth)
}
export async function getToken() {
  const user = auth.currentUser
  if (!user) return null
  return await user.getIdToken()
}