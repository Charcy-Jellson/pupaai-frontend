import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "bg-card/80 backdrop-blur-xl border border-border shadow-2xl shadow-violet-500/10",
          headerTitle: "text-white",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton: "bg-white/10 border-white/20 text-white hover:bg-white/20",
          socialButtonsBlockButtonText: "text-white",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          formFieldLabel: "text-muted-foreground",
          formFieldInput: "bg-background border-input text-white placeholder:text-muted-foreground focus:ring-violet-500",
          formButtonPrimary: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25",
          footerActionLink: "text-violet-400 hover:text-violet-300",
          identityPreviewEditButton: "text-violet-400 hover:text-violet-300",
          formFieldAction: "text-violet-400 hover:text-violet-300",
          alertText: "text-muted-foreground",
          formFieldInputShowPasswordButton: "text-muted-foreground hover:text-white",
        },
        layout: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "iconButton",
        },
      }}
    />
  );
}

