import "server-only"

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import { getMessaging } from "firebase-admin/messaging"
import { getStorage } from "firebase-admin/storage"

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n")
}

export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.APP_FIREBASE_ADMIN_PROJECT_ID &&
      process.env.APP_FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.APP_FIREBASE_ADMIN_PRIVATE_KEY,
  )
}

function getFirebaseAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin environment variables are missing.")
  }

  return getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId: process.env.APP_FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.APP_FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: normalizePrivateKey(process.env.APP_FIREBASE_ADMIN_PRIVATE_KEY ?? ""),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp())
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp())
}

export function getFirebaseAdminStorage() {
  return getStorage(getFirebaseAdminApp())
}

export function getFirebaseAdminMessaging() {
  return getMessaging(getFirebaseAdminApp())
}
