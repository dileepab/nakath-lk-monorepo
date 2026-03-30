import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

import { getFirebaseStorage } from "@/lib/firebase-client"

export type ProfileAssetKind = "profile-photo" | "nic-front" | "nic-back" | "selfie"

const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"])

export function isAllowedProfileAssetFile(file: File) {
  return allowedImageMimeTypes.has(file.type)
}

export function allowedProfileAssetTypesLabel() {
  return "JPG, PNG, WEBP, or HEIC"
}

function assetPath(userId: string, kind: ProfileAssetKind) {
  return `profiles/${userId}/${kind}/current`
}

export async function uploadProfileAsset(userId: string, kind: ProfileAssetKind, file: File) {
  if (!isAllowedProfileAssetFile(file)) {
    throw new Error("Unsupported file type.")
  }

  const storage = getFirebaseStorage()
  const path = assetPath(userId, kind)
  const storageRef = ref(storage, path)

  await uploadBytes(storageRef, file, {
    contentType: file.type || undefined,
  })

  const url = await getDownloadURL(storageRef)

  return { path, url }
}
