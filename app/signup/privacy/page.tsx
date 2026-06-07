export default function SignupPrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-zinc-200">
      <h1 className="text-3xl font-bold text-white">Discord Signup Privacy Statement</h1>

      <div className="mt-6 space-y-4 text-sm leading-6 text-zinc-300">
        <p>
          When you sign up / sign in with Discord, Cheesegrate only receives basic account
          information needed to identify you on the site, such as your Discord
          user ID, username, profile picture, and most sensitive, your email address linked to the account.
        </p>

        <p>
          I cannot see your Discord password, login details, private messages,
          servers, friends list, or any other private Discord account data.
        </p>

        <p>
          Discord handles the login and linking process directly; Cheesegrate only uses the
          information Discord safely sends back after you approve the link.
        </p>

        <p>
          This information is only used for site features like accounts,
          profiles, submissions, and admin/moderation tools.
        </p>
      </div>
    </main>
  )
}