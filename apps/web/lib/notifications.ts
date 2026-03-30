import { getMessaging, getToken, onMessage } from "firebase/messaging"
import { arrayUnion, doc, setDoc } from "firebase/firestore"

import { getFirebaseApp, getFirebaseDb, isFirebaseConfigured } from "./firebase-client"

export async function requestNotificationPermission(userId: string) {
  if (!userId || !isFirebaseConfigured()) {
    return null
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("This browser does not support desktop notification")
    return null
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    console.warn("Push notifications are not configured: missing NEXT_PUBLIC_FIREBASE_VAPID_KEY")
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission === "granted") {
      const messaging = getMessaging(getFirebaseApp())

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey,
      })

      if (token) {
        // Merge the token into the profile document so first-time users do not fail on missing docs.
        const db = getFirebaseDb()
        const userRef = doc(db, "profiles", userId)
        await setDoc(
          userRef,
          {
            fcmTokens: arrayUnion(token),
          },
          { merge: true },
        )

        return token
      }
    }
  } catch (error) {
    console.error("An error occurred while retrieving token.", error)
  }
  return null
}

export function onMessageListener() {
  if (typeof window !== "undefined" && "Notification" in window) {
    const messaging = getMessaging(getFirebaseApp())
    return new Promise((resolve) => {
      onMessage(messaging, (payload) => {
        resolve(payload)
      })
    })
  }
}
