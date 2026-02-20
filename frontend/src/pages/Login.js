import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success("¡Bienvenido de vuelta!");
      
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al iniciar sesión");
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
          <p className="text-slate-600">Inicia sesión en tu cuenta</p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all bg-white/50 backdrop-blur-sm"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 font-medium mb-2 block">
                Contraseña
              </Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all bg-white/50 backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 rounded-full transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Iniciando..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                data-testid="register-link"
                className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Admin Credentials Hint */}
          <div className="mt-6 p-4 bg-sky-50 rounded-lg border border-sky-100">
            <p className="text-sm text-slate-600 mb-1 font-medium">Credenciales de prueba:</p>
            <p className="text-xs text-slate-500">Admin: admin@acqua.com / admin123</p>
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

export default Login;
