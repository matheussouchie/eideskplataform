import { signOutAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton className="ghost-button" pendingLabel="Saindo...">
        Sair
      </SubmitButton>
    </form>
  );
}
