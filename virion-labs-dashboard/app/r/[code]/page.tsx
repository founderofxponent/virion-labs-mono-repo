import { CampaignReferralLandingPage } from "@/components/campaign-referral-landing-page"

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function ReferralLandingPage({ params }: PageProps) {
  const { code } = await params
  return <CampaignReferralLandingPage referralCode={code} />
} 