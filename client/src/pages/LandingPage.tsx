import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, TrendingUp, Shield, Calendar, Loader2, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function LandingPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { login, register, isLoggingIn, isRegistering } = useAuth();

  const isSubmitting = isLoggingIn || isRegistering;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login({ email, password });
        toast.success("¡Bienvenido!");
      } else {
        await register({ email, password, firstName, lastName });
        toast.success("¡Cuenta creada exitosamente!");
      }
    } catch (error: any) {
      toast.error(error.message || "Error inesperado");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col">
      <header className="p-6">
        <div className="flex items-center gap-2">
          <Car className="h-8 w-8 text-white" />
          <h1 className="text-2xl font-bold text-white">Gestión Remís</h1>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="text-center max-w-md w-full">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Gestiona tu negocio de remís
            </h2>
            <p className="text-blue-100 text-lg">
              Controla tus viajes, gastos y ganancias de forma simple y organizada.
            </p>
          </div>

          {/* Auth Form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            {/* Tabs */}
            <div className="flex mb-6 bg-white/10 rounded-lg p-1">
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === "login"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
                onClick={() => setMode("login")}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === "register"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
                onClick={() => setMode("register")}
              >
                Registrarse
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-white/80 text-sm">
                      Nombre
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Juan"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10 bg-white/90 border-0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-white/80 text-sm">
                      Apellido
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Pérez"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10 bg-white/90 border-0"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/80 text-sm">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-white/90 border-0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/80 text-sm">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === "register" ? 6 : undefined}
                    className="pl-10 bg-white/90 border-0"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold text-lg py-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {mode === "login" ? "Ingresando..." : "Registrando..."}
                  </>
                ) : mode === "login" ? (
                  "Iniciar Sesión"
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <TrendingUp className="h-5 w-5 text-green-300 flex-shrink-0" />
              <span className="text-white text-sm text-left">Seguí tus ingresos y gastos diarios</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <Calendar className="h-5 w-5 text-yellow-300 flex-shrink-0" />
              <span className="text-white text-sm text-left">Cerrá turnos y calculá liquidaciones</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <Shield className="h-5 w-5 text-blue-300 flex-shrink-0" />
              <span className="text-white text-sm text-left">Tus datos seguros y privados</span>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="p-6 text-center text-blue-200 text-sm">
        <p>Gestión Remís - Tu compañero de viaje</p>
      </footer>
    </div>
  );
}
