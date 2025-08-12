import { redirect } from "next/navigation"

export default function CreateCampaignPage() {
  // This standalone route has been deprecated in favor of the in-page modal.
  // Redirect to open the modal on the campaigns list page.
  redirect("/clients/campaigns?create=1")
}
