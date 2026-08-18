export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  if (toast) {
    toast({
      title: "Sesión expirada",
      description: "Tu sesión ha expirado. Redirigiendo al inicio...",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    window.location.href = "/";
  }, 500);
}
