import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

import { getFirebaseStorage } from "@/lib/firebase-client"

export type ProfileAssetKind = "profile-photo" | "nic-document" | "selfie"

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-")
}

function assetPath(userId: string, kind: ProfileAssetKind, fileName: string) {
  return `profiles/${userId}/${kind}/${Date.now()}-${sanitizeFileName(fileName)}`
}

export async function uploadProfileAsset(userId: string, kind: ProfileAssetKind, file: File) {
  const storage = getFirebaseStorage()
  const path = assetPath(userId, kind, file.name)
  const storageRef = ref(storage, path)

  await uploadBytes(storageRef, file, {
    contentType: file.type || undefined,
  })

  const url = await getDownloadURL(storageRef)

  return { path, url }
}
