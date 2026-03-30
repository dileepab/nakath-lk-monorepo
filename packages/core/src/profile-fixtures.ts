import { initialProfileDraft, mergeProfileDraft, type ProfileDraft } from "./profile"

export type BrowseProfileFixture = {
  id: string
  matchScore: number
  source: "fixture" | "current-user"
  draft: ProfileDraft
}

const fixtureBase = mergeProfileDraft(initialProfileDraft)

export const browseProfileFixtures: BrowseProfileFixture[] = [
  {
    id: "fixture-dilani",
    source: "fixture",
    matchScore: 18,
    draft: mergeProfileDraft({
      ...fixtureBase,
      basics: {
        firstName: "Dilani",
        lastName: "Perera",
        gender: "Female",
        age: "27",
        heightCm: "162",
        profession: "Software Engineer",
        district: "Colombo",
        religion: "Buddhist",
        language: "Sinhala",
      },
      horoscope: {
        birthDate: "1998-02-09",
        nakath: "Rohini",
        lagna: "Kanya",
        birthTime: "06:25",
        birthPlace: "Colombo",
      },
      family: {
        education: "Bachelor's degree",
        fatherOccupation: "Accountant",
        motherOccupation: "Retired teacher",
        siblings: "1 sibling",
        summary:
          "A calm, thoughtful profile with a strong family circle, serious marriage intent, and a preference for respectful introductions.",
      },
      preferences: {
        ageMin: "28",
        ageMax: "34",
        preferredDistrict: "Colombo",
        religionPreference: "Buddhist",
        professionPreference: "Professional background",
        willingToMigrate: true,
        expectedFamilySetup: "Flexible",
        spouseCareerExpectation: "Working",
      },
      privacy: {
        photoVisibility: "blurred",
        contactVisibility: "mutual",
        biodataShareMode: "pdf",
      },
      verification: {
        nicStatus: "verified",
        selfieStatus: "verified",
        familyContactAllowed: true,
      },
      media: {
        profilePhotoUrl: "/images/couple-1.jpg",
        profilePhotoPath: "",
        nicFrontUrl: "/fixtures/nic-front-dilani",
        nicFrontPath: "",
        nicBackUrl: "/fixtures/nic-back-dilani",
        nicBackPath: "",
        selfieUrl: "/fixtures/selfie-dilani",
        selfiePath: "",
      },
    }),
  },
  {
    id: "fixture-kasun",
    source: "fixture",
    matchScore: 17,
    draft: mergeProfileDraft({
      basics: {
        firstName: "Kasun",
        lastName: "Ramanayake",
        gender: "Male",
        age: "30",
        heightCm: "175",
        profession: "Doctor",
        district: "Kandy",
        religion: "Buddhist",
        language: "Sinhala",
      },
      horoscope: {
        birthDate: "1995-11-17",
        nakath: "Pushya",
        lagna: "Makara",
        birthTime: "04:55",
        birthPlace: "Kandy",
      },
      family: {
        education: "Doctorate",
        fatherOccupation: "Business owner",
        motherOccupation: "Homemaker",
        siblings: "2 siblings",
        summary:
          "Professionally settled and family-guided, with a preference for a measured introduction before direct contact is shared.",
      },
      preferences: {
        ageMin: "24",
        ageMax: "29",
        preferredDistrict: "Kandy",
        religionPreference: "Buddhist",
        professionPreference: "Graduate or professional background",
        willingToMigrate: false,
        expectedFamilySetup: "Joint Family",
        spouseCareerExpectation: "Flexible",
      },
      privacy: {
        photoVisibility: "family",
        contactVisibility: "family-request",
        biodataShareMode: "family-review",
      },
      verification: {
        nicStatus: "submitted",
        selfieStatus: "submitted",
        familyContactAllowed: true,
      },
      media: {
        profilePhotoUrl: "/images/couple-2.jpg",
        profilePhotoPath: "",
        nicFrontUrl: "/fixtures/nic-front-kasun",
        nicFrontPath: "",
        nicBackUrl: "/fixtures/nic-back-kasun",
        nicBackPath: "",
        selfieUrl: "/fixtures/selfie-kasun",
        selfiePath: "",
      },
    }),
  },
  {
    id: "fixture-nimasha",
    source: "fixture",
    matchScore: 15,
    draft: mergeProfileDraft({
      basics: {
        firstName: "Nimasha",
        lastName: "Silva",
        gender: "Female",
        age: "25",
        heightCm: "160",
        profession: "Teacher",
        district: "Galle",
        religion: "Catholic",
        language: "English",
      },
      horoscope: {
        birthDate: "2000-08-03",
        nakath: "Ada",
        lagna: "Thula",
        birthTime: "08:10",
        birthPlace: "Galle",
      },
      family: {
        education: "Bachelor's degree",
        fatherOccupation: "Government service",
        motherOccupation: "Teacher",
        siblings: "Only child",
        summary:
          "Warm, articulate, and open to a modern introduction format as long as privacy is protected in the early stage.",
      },
      preferences: {
        ageMin: "27",
        ageMax: "33",
        preferredDistrict: "Galle",
        religionPreference: "Christian",
        professionPreference: "Stable professional",
        willingToMigrate: true,
        expectedFamilySetup: "Nuclear Family",
        spouseCareerExpectation: "Working",
      },
      privacy: {
        photoVisibility: "mutual",
        contactVisibility: "mutual",
        biodataShareMode: "whatsapp",
      },
      verification: {
        nicStatus: "verified",
        selfieStatus: "submitted",
        familyContactAllowed: false,
      },
      media: {
        profilePhotoUrl: "/images/couple-3.jpg",
        profilePhotoPath: "",
        nicFrontUrl: "/fixtures/nic-front-nimasha",
        nicFrontPath: "",
        nicBackUrl: "/fixtures/nic-back-nimasha",
        nicBackPath: "",
        selfieUrl: "/fixtures/selfie-nimasha",
        selfiePath: "",
      },
    }),
  },
  {
    id: "fixture-ravindu",
    source: "fixture",
    matchScore: 16,
    draft: mergeProfileDraft({
      basics: {
        firstName: "Ravindu",
        lastName: "Karunaratne",
        gender: "Male",
        age: "29",
        heightCm: "178",
        profession: "Business Owner",
        district: "Matara",
        religion: "Buddhist",
        language: "Sinhala",
      },
      horoscope: {
        birthDate: "1996-01-28",
        nakath: "Bharani",
        lagna: "Dhanu",
        birthTime: "11:30",
        birthPlace: "Matara",
      },
      family: {
        education: "Professional qualification",
        fatherOccupation: "Retired teacher",
        motherOccupation: "Homemaker",
        siblings: "3+ siblings",
        summary:
          "Grounded and family-oriented, with a clear preference for a local future and a softer photo preview until interest is mutual.",
      },
      preferences: {
        ageMin: "24",
        ageMax: "30",
        preferredDistrict: "Matara",
        religionPreference: "Buddhist",
        professionPreference: "Professional or business background",
        willingToMigrate: false,
        expectedFamilySetup: "Flexible",
        spouseCareerExpectation: "Flexible",
      },
      privacy: {
        photoVisibility: "blurred",
        contactVisibility: "hidden",
        biodataShareMode: "pdf",
      },
      verification: {
        nicStatus: "not-submitted",
        selfieStatus: "not-submitted",
        familyContactAllowed: true,
      },
      media: {
        profilePhotoUrl: "/images/couple-6.jpg",
        profilePhotoPath: "",
        nicFrontUrl: "",
        nicFrontPath: "",
        nicBackUrl: "",
        nicBackPath: "",
        selfieUrl: "",
        selfiePath: "",
      },
    }),
  },
]

export function getBrowseProfileFixture(profileId: string) {
  return browseProfileFixtures.find((profile) => profile.id === profileId) ?? null
}
