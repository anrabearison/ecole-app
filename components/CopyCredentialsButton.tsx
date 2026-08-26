"use client"

import { Button } from "@/components/ui/button"

type CopyCredentialsButtonProps = {
  email: string
  password: string
  identifier?: string
}

export function CopyCredentialsButton({ email, password, identifier }: CopyCredentialsButtonProps) {
  const handleCopy = async () => {
    let text = `Email: ${email}\nPassword: ${password}`
    if (identifier) {
      text += `\nIdentifier: ${identifier}`
    }
    await navigator.clipboard.writeText(text)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="mt-4"
    >
      Copier les identifiants
    </Button>
  )
}
