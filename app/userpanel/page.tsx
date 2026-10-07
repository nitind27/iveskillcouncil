import { permanentRedirect } from "next/navigation";

/** Public homepage is https://iveskillcouncil.org.in/ */
export default function UserPanelHomePage() {
  permanentRedirect("/");
}
