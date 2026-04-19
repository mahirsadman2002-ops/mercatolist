import { redirect } from "next/navigation";

export default function PublicProfileRedirect() {
  redirect("/settings");
}
