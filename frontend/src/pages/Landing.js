import { useNavigate } from "react-router-dom";
import { Droplets, CheckCircle, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="glass-header fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-8 h-8 text-sky-500" />
            <span className="text-2xl font-bold text-slate-900 font-outfit">ACQUA</span>
          </div>
          <div className="flex gap-3">
            <Button
              data-testid="login-button"
              onClick={() => navigate("/login")}
              variant="ghost"
              className="text-slate-600 hover:text-sky-600 hover:bg-sky-50 font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </Button>
            <Button
              data-testid="register-button"
              onClick={() => navigate("/register")}
              className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-8 py-3 rounded-full transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight text-slate-900 mb-6">
                Agua Purificada a tu Puerta
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Recibe tus garrafones de agua purificada ACQUA cuando los necesites.
                Servicio confiable, agua de calidad premium.
              </p>
              <div className="flex gap-4">
                <Button
                  data-testid="hero-start-button"
                  onClick={() => navigate("/register")}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-8 py-3 rounded-full transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5"
                >
                  Empezar Ahora
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-6 py-3 rounded-full transition-all duration-300 hover:border-slate-300 shadow-sm"
                >
                  Ya Tengo Cuenta
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1346155/pexels-photo-1346155.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Agua fresca"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-4">
              ¿Por qué elegir ACQUA?
            </h2>
            <p className="text-lg text-slate-600">Calidad y servicio que puedes confiar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 group">
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-sky-500" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Agua Purificada</h3>
              <p className="text-slate-600 leading-relaxed">
                Proceso de purificación de múltiples etapas para garantizar la máxima calidad.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 group">
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-sky-500" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Entrega Rápida</h3>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Entrega Rápida</h3>
              <p className="text-slate-600 leading-relaxed">
                Recibe tus garrafones en la fecha y hora que mejor te convenga.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 group">
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-sky-500" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">24/7 Disponible</h3>
              <p className="text-slate-600 leading-relaxed">
                Haz tus pedidos en cualquier momento, estamos siempre disponibles para ti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-sky-500 to-sky-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-sky-50 mb-8">
            Regístrate ahora y recibe tu primer pedido
          </p>
          <Button
            data-testid="cta-register-button"
            onClick={() => navigate("/register")}
            className="bg-white hover:bg-slate-50 text-sky-600 font-medium px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg"
          >
            Crear Cuenta Gratis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Droplets className="w-6 h-6 text-sky-500" />
            <span className="text-xl font-bold text-white font-outfit">ACQUA</span>
          </div>
          <p>© 2024 ACQUA. Agua purificada de calidad premium.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
