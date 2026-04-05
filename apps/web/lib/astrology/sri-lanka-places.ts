export type KnownSriLankaPlace = {
  name: string
  latitude: number
  longitude: number
  aliases?: string[]
}

export const sriLankaPlaces: KnownSriLankaPlace[] = [
  { name: "Ampara", latitude: 7.2975, longitude: 81.682 },
  { name: "Anuradhapura", latitude: 8.3114, longitude: 80.4037 },
  { name: "Akuressa", latitude: 6.0964, longitude: 80.4808 },
  { name: "Avissawella", latitude: 6.9553, longitude: 80.211 },
  { name: "Badulla", latitude: 6.9934, longitude: 81.055 },
  { name: "Bandarawela", latitude: 6.8289, longitude: 80.9856 },
  { name: "Batticaloa", latitude: 7.7102, longitude: 81.6924 },
  { name: "Beruwala", latitude: 6.4788, longitude: 79.9828, aliases: ["Beruwela"] },
  { name: "Bingiriya", latitude: 7.592827, longitude: 79.934917 },
  { name: "Biyagama", latitude: 6.9541, longitude: 79.9982 },
  { name: "Chilaw", latitude: 7.5758, longitude: 79.7953 },
  { name: "Colombo", latitude: 6.9271, longitude: 79.8612 },
  { name: "Dambulla", latitude: 7.8567, longitude: 80.6517 },
  { name: "Dehiwala", latitude: 6.851, longitude: 79.8653, aliases: ["Dehiwala-Mount Lavinia", "Mount Lavinia"] },
  { name: "Embilipitiya", latitude: 6.3439, longitude: 80.8489 },
  { name: "Galle", latitude: 6.0535, longitude: 80.221 },
  { name: "Gampaha", latitude: 7.0917, longitude: 79.9999 },
  { name: "Hambantota", latitude: 6.1241, longitude: 81.1185 },
  { name: "Hatton", latitude: 6.8916, longitude: 80.5955 },
  { name: "Horana", latitude: 6.7159, longitude: 80.0626 },
  { name: "Ja-Ela", latitude: 7.0744, longitude: 79.8919, aliases: ["Ja Ela"] },
  { name: "Jaffna", latitude: 9.6615, longitude: 80.0255 },
  { name: "Kadawatha", latitude: 7.0013, longitude: 79.9582 },
  { name: "Kalmunai", latitude: 7.4167, longitude: 81.8167 },
  { name: "Kalutara", latitude: 6.5854, longitude: 79.9607 },
  { name: "Kandy", latitude: 7.2906, longitude: 80.6337 },
  { name: "Kegalle", latitude: 7.2513, longitude: 80.3464 },
  { name: "Kilinochchi", latitude: 9.3961, longitude: 80.3982 },
  { name: "Kotte", latitude: 6.9022, longitude: 79.909, aliases: ["Sri Jayawardenepura Kotte", "Sri Jayewardenepura Kotte"] },
  { name: "Kuliyapitiya", latitude: 7.4688, longitude: 80.0401 },
  { name: "Kurunegala", latitude: 7.4863, longitude: 80.3623 },
  { name: "Maharagama", latitude: 6.848, longitude: 79.9265 },
  { name: "Mannar", latitude: 8.977, longitude: 79.9042 },
  { name: "Matale", latitude: 7.4675, longitude: 80.6234 },
  { name: "Matara", latitude: 5.9549, longitude: 80.555 },
  { name: "Monaragala", latitude: 6.8721, longitude: 81.3497 },
  { name: "Moratuwa", latitude: 6.773, longitude: 79.8816 },
  { name: "Mullaitivu", latitude: 9.2671, longitude: 80.8128 },
  { name: "Nawalapitiya", latitude: 7.0509, longitude: 80.5311 },
  { name: "Negombo", latitude: 7.2083, longitude: 79.8358 },
  { name: "Nuwara Eliya", latitude: 6.9497, longitude: 80.7891 },
  { name: "Panadura", latitude: 6.7132, longitude: 79.9026 },
  { name: "Pannala", latitude: 7.3256, longitude: 80.0276 },
  { name: "Point Pedro", latitude: 9.8167, longitude: 80.2333 },
  { name: "Polonnaruwa", latitude: 7.9403, longitude: 81.0188 },
  { name: "Puttalam", latitude: 8.0362, longitude: 79.8283 },
  { name: "Ratnapura", latitude: 6.6828, longitude: 80.3992 },
  { name: "Tangalle", latitude: 6.0243, longitude: 80.7974 },
  { name: "Trincomalee", latitude: 8.5874, longitude: 81.2152 },
  { name: "Vavuniya", latitude: 8.7514, longitude: 80.4971 },
  { name: "Wariyapola", latitude: 7.6289, longitude: 80.2459 },
  { name: "Wattala", latitude: 6.9892, longitude: 79.8917 },
]

export const sriLankaBirthPlaceSuggestions = sriLankaPlaces.map((place) => place.name)

export function normalizeSriLankaLookupKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/,?\s*sri lanka$/i, "")
    .replace(/[.]/g, " ")
    .replace(/\s+/g, " ")
}

export function toSriLankaTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}
