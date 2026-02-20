import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(formData);
      toast.success("¡Cuenta creada exitosamente!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Droplets className="w-10 h-10 text-sky-500" />
            <span className="text-3xl font-bold text-slate-900 font-outfit">ACQUA</span>
          </div>
          <p className="text-slate-600">Crea tu cuenta</p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-700 font-medium mb-2 block">
                Nombre Completo
              </Label>
              <Input
                id="name"
                data-testid="register-name-input"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all bg-white/50 backdrop-blur-sm"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                data-testid="register-email-input"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all bg-white/50 backdrop-blur-sm"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-slate-700 font-medium mb-2 block">
                Teléfono
              </Label>
              <Input
                id="phone"
                data-testid="register-phone-input"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all bg-white/50 backdrop-blur-sm"
                placeholder="5551234567"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-slate-700 font-medium mb-2 block">
                Dirección de Entrega
              </Label>
              <Input
                id="address"
                data-testid="register-address-input"
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all bg-white/50 backdrop-blur-sm"
                placeholder="Calle Principal #123"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 font-medium mb-2 block">
                Contraseña
              </Label>
              <Input
                id="password"
                data-testid="register-password-input"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all bg-white/50 backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>

            <Button
              data-testid="register-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 rounded-full transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                data-testid="login-link"
                className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-slate-600 hover:text-sky-600 font-medium transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
