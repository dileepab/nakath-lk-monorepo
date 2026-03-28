import { ProfileDetailPage } from "@/components/profile-detail-page"

export default async function ProfileDetailRoute({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = await params

  return <ProfileDetailPage profileId={profileId} />
}
