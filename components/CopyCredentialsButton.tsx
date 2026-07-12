"use client"

import { Button } from "@/components/ui/button"

type CopyCredentialsButtonProps = {
  email: string
  password: string
}

export function CopyCredentialsButton({ email, password }: CopyCredentialsButtonProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`)
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
