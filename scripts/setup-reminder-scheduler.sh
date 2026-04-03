#!/usr/bin/env bash

set -euo pipefail

JOB_NAME="${REMINDER_JOB_NAME:-nakath-reminder-dispatch}"
PROJECT_ID="${REMINDER_PROJECT_ID:-}"
LOCATION="${REMINDER_SCHEDULER_LOCATION:-}"
BASE_URL="${REMINDER_DISPATCH_URL:-}"
SECRET="${REMINDER_DISPATCH_SECRET:-}"
SCHEDULE="${REMINDER_SCHEDULE:-*/5 * * * *}"
TIME_ZONE="${REMINDER_TIME_ZONE:-Asia/Colombo}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Missing REMINDER_PROJECT_ID"
  exit 1
fi

if [[ -z "${LOCATION}" ]]; then
  echo "Missing REMINDER_SCHEDULER_LOCATION"
  exit 1
fi

if [[ -z "${BASE_URL}" ]]; then
  echo "Missing REMINDER_DISPATCH_URL"
  exit 1
fi

if [[ -z "${SECRET}" ]]; then
  echo "Missing REMINDER_DISPATCH_SECRET"
  exit 1
fi

URI="${BASE_URL%/}/api/notifications/reminders/dispatch"
HEADERS="x-reminder-secret=${SECRET}"

if gcloud scheduler jobs describe "${JOB_NAME}" --project="${PROJECT_ID}" --location="${LOCATION}" >/dev/null 2>&1; then
  echo "Updating existing scheduler job ${JOB_NAME}..."
  gcloud scheduler jobs update http "${JOB_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${LOCATION}" \
    --schedule="${SCHEDULE}" \
    --time-zone="${TIME_ZONE}" \
    --uri="${URI}" \
    --http-method=POST \
    --update-headers="${HEADERS}"
else
  echo "Creating scheduler job ${JOB_NAME}..."
  gcloud scheduler jobs create http "${JOB_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${LOCATION}" \
    --schedule="${SCHEDULE}" \
    --time-zone="${TIME_ZONE}" \
    --uri="${URI}" \
    --http-method=POST \
    --headers="${HEADERS}"
fi

echo "Reminder scheduler ready."
