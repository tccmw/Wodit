import { auth } from "../auth";
import { SignInScreen } from "../components/sign-in-screen";
import { WoditDashboard } from "../components/wodit-dashboard";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.email) {
    return <SignInScreen />;
  }

  return (
    <WoditDashboard
      user={{
        email: session.user.email,
        name: session.user.name ?? "Wodit User",
        image: session.user.image ?? null
      }}
    />
  );
}
