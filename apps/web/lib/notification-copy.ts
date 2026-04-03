import "server-only"

import { type AuspiciousEvent } from "@/lib/auspicious-events"
import { type ProfileDraft, type ReminderLanguage } from "@acme/core"

type MatchActivityType = "request-received" | "request-approved" | "message-received"

function truncateMessage(text: string) {
  return text.length > 88 ? `${text.slice(0, 85).trimEnd()}...` : text
}

function getLocalizedName(draft: ProfileDraft) {
  return draft.basics.firstName?.trim() || "there"
}

const eventTitles: Record<string, Record<ReminderLanguage, string>> = {
  "poya-2026-04-01": {
    en: "Bak Full Moon Poya Day",
    si: "බක් පුර පසළොස්වක පොහොය දිනය",
    ta: "பக் பௌர்ணமி போயா தினம்",
  },
  "poya-2026-05-01": {
    en: "Vesak Full Moon Poya Day",
    si: "වෙසක් පුර පසළොස්වක පොහොය දිනය",
    ta: "வேசாக் பௌர்ணமி போயா தினம்",
  },
  "poya-2026-05-30": {
    en: "Adhi Poson Full Moon Poya Day",
    si: "අධි පොසොන් පුර පසළොස්වක පොහොය දිනය",
    ta: "அதி பொசோன் பௌர்ணமி போயா தினம்",
  },
  "poya-2026-06-29": {
    en: "Poson Full Moon Poya Day",
    si: "පොසොන් පුර පසළොස්වක පොහොය දිනය",
    ta: "பொசோன் பௌர்ணமி போயா தினம்",
  },
  "poya-2026-07-29": {
    en: "Esala Full Moon Poya Day",
    si: "ඇසළ පුර පසළොස්වක පොහොය දිනය",
    ta: "ஏசல பௌர்ணமி போயா தினம்",
  },
  "poya-2026-08-27": {
    en: "Nikini Full Moon Poya Day",
    si: "නිකිනි පුර පසළොස්වක පොහොය දිනය",
    ta: "நிகினி பௌர்ணமி போயா தினம்",
  },
  "poya-2026-09-26": {
    en: "Binara Full Moon Poya Day",
    si: "බිනර පුර පසළොස්වක පොහොය දිනය",
    ta: "பினர பௌர்ணமி போயா தினம்",
  },
  "poya-2026-10-25": {
    en: "Vap Full Moon Poya Day",
    si: "වප් පුර පසළොස්වක පොහොය දිනය",
    ta: "வப் பௌர்ணமி போயா தினம்",
  },
  "poya-2026-11-24": {
    en: "Il Full Moon Poya Day",
    si: "ඉල් පුර පසළොස්වක පොහොය දිනය",
    ta: "இல் பௌர்ணமி போயா தினம்",
  },
  "poya-2026-12-23": {
    en: "Unduvap Full Moon Poya Day",
    si: "උඳුවප් පුර පසළොස්වක පොහොය දිනය",
    ta: "உண்டுவப் பௌர்ணமி போயா தினம்",
  },
  "avurudu-2026-parana-awurudu": {
    en: "Parana Avurudu",
    si: "පරණ අවුරුද්ද",
    ta: "பழைய புத்தாண்டு நேரம்",
  },
  "avurudu-2026-udawa": {
    en: "Aluth Avurudu Udawa",
    si: "අලුත් අවුරුදු උදාව",
    ta: "புதிய ஆண்டு உதயம்",
  },
  "avurudu-2026-lipa-gini": {
    en: "Lipa gini melaweema",
    si: "ලිප ගිනි මෙලවීම",
    ta: "அடுப்பு தீ மூட்டும் நேரம்",
  },
  "avurudu-2026-ganu-denu": {
    en: "Ganu denu / Weda allima",
    si: "ගනුදෙනු / වැඩ ඇල්ලීම",
    ta: "கனு தெனு / வேலை ஆரம்பம்",
  },
  "avurudu-2026-hisa-thel": {
    en: "Hisa thel gema",
    si: "හිස තෙල් ගෑම",
    ta: "எண்ணெய் அணியும் நேரம்",
  },
}

export function getReminderLanguage(draft: ProfileDraft): ReminderLanguage {
  return draft.alerts.language ?? "en"
}

export function getLocalizedEventTitle(event: AuspiciousEvent, language: ReminderLanguage) {
  return eventTitles[event.id]?.[language] ?? event.title
}

export function buildCalendarNotificationCopy(event: AuspiciousEvent, draft: ProfileDraft, now: Date) {
  const language = getReminderLanguage(draft)
  const title = getLocalizedEventTitle(event, language)
  const name = getLocalizedName(draft)
  const minutes = Math.max(0, Math.round((event.startsAt.getTime() - now.getTime()) / 60000))
  const startsAt = event.startsAt.toLocaleTimeString("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  if (language === "si") {
    if (event.category === "rahu") {
      return {
        title: "අද රාහු කාලය",
        body: `${name}, අද රාහු කාලය තවත් මිනිත්තු ${minutes}කින් ${startsAt}ට ආරම්භ වේ.`,
      }
    }

    if (event.category === "poya") {
      return {
        title,
        body: `${name}, අද ${title}. කැලැන්ඩරය සහ ඔබගේ ගැළපීම් යාවත්කාලීන සඳහා Nakath.lk බලන්න.`,
      }
    }

    return {
      title,
      body: `${name}, ${title} තවත් මිනිත්තු ${minutes}කින් පැමිණේ.`,
    }
  }

  if (language === "ta") {
    if (event.category === "rahu") {
      return {
        title: "இன்றைய ராகு காலம்",
        body: `${name}, இன்றைய ராகு காலம் இன்னும் ${minutes} நிமிடங்களில் ${startsAt} மணிக்கு தொடங்குகிறது.`,
      }
    }

    if (event.category === "poya") {
      return {
        title,
        body: `${name}, இன்று ${title}. காலண்டர் மற்றும் பொருத்தங்களைக் காண Nakath.lk ஐ திறக்கவும்.`,
      }
    }

    return {
      title,
      body: `${name}, ${title} இன்னும் ${minutes} நிமிடங்களில் தொடங்கும்.`,
    }
  }

  if (event.category === "rahu") {
    return {
      title: "Today's Rahu kalaya",
      body: `Hi ${name}, today's Rahu kalaya begins in ${minutes} minutes at ${startsAt}.`,
    }
  }

  if (event.category === "poya") {
    return {
      title,
      body: `Hi ${name}, today is ${title}. Open Nakath.lk for your calendar view and match updates.`,
    }
  }

  return {
    title,
    body: `Hi ${name}, ${title} is coming up in ${minutes} minutes.`,
  }
}

export function buildMatchNotificationCopy({
  language,
  actorName,
  type,
  messageText,
}: {
  language: ReminderLanguage
  actorName: string
  type: MatchActivityType
  messageText?: string
}) {
  if (language === "si") {
    switch (type) {
      case "request-received":
        return {
          title: "නව හැඳින්වීමක් ලැබී ඇත",
          body: `${actorName} ඔබ සමඟ හැඳින්වීමක් ආරම්භ කිරීමට කැමතියි.`,
        }
      case "request-approved":
        return {
          title: "හැඳින්වීම අනුමත විය",
          body: `${actorName} ඔබගේ හැඳින්වීම අනුමත කළා. දැන් කතාබස් විවෘත කළ හැක.`,
        }
      case "message-received":
        return {
          title: `${actorName}ගෙන් නව පණිවිඩයක්`,
          body: messageText ? truncateMessage(messageText) : "Nakath.lk තුළ ඔබ සඳහා නව පණිවිඩයක් ඇත.",
        }
    }
  }

  if (language === "ta") {
    switch (type) {
      case "request-received":
        return {
          title: "புதிய அறிமுக கோரிக்கை",
          body: `${actorName} உங்களுடன் ஒரு அறிமுகத்தை தொடங்க விரும்புகிறார்.`,
        }
      case "request-approved":
        return {
          title: "அறிமுகம் அங்கீகரிக்கப்பட்டது",
          body: `${actorName} உங்கள் அறிமுகத்தை அங்கீகரித்துள்ளார். இப்போது உரையாடலைத் திறக்கலாம்.`,
        }
      case "message-received":
        return {
          title: `${actorName} இடமிருந்து புதிய செய்தி`,
          body: messageText ? truncateMessage(messageText) : "Nakath.lk இல் உங்களுக்காக ஒரு புதிய செய்தி உள்ளது.",
        }
    }
  }

  switch (type) {
    case "request-received":
      return {
        title: "New introduction request",
        body: `${actorName} would like to start an introduction with you.`,
      }
    case "request-approved":
      return {
        title: "Introduction approved",
        body: `${actorName} approved your introduction. You can open chat now.`,
      }
    case "message-received":
      return {
        title: `New message from ${actorName}`,
        body: messageText ? truncateMessage(messageText) : "You have a new message waiting in Nakath.lk.",
      }
  }
}

export function buildTestNotificationCopy(draft: ProfileDraft) {
  const language = getReminderLanguage(draft)
  const name = getLocalizedName(draft)

  if (language === "si") {
    return {
      title: "Nakath පරීක්ෂණ මතක් කිරීම",
      body: `${name}, මෙය ඔබගේ reminder pipeline එකෙන් යැවූ reviewer පරීක්ෂණ push එකකි.`,
    }
  }

  if (language === "ta") {
    return {
      title: "Nakath சோதனை நினைவூட்டல்",
      body: `${name}, இது உங்கள் reminder pipeline இலிருந்து அனுப்பப்பட்ட reviewer சோதனை push ஆகும்.`,
    }
  }

  return {
    title: "Nakath test reminder",
    body: `Hi ${name}, this is a reviewer test push from your local reminder pipeline.`,
  }
}
