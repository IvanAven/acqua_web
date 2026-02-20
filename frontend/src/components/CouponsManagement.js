import { useState, useEffect } from "react";
import axios from "axios";
import { Tag, Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const CouponsManagement = ({ token }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_percentage: 10,
    expiry_date: "",
    max_uses: "",
  });

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API_URL}/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupons(response.data);
    } catch (error) {
      toast.error("Error al cargar cupones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      };
      await axios.post(`${API_URL}/coupons`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Cupón creado exitosamente");
      setShowForm(false);
      setFormData({ code: "", discount_percentage: 10, expiry_date: "", max_uses: "" });
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear cupón");
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`¿Eliminar el cupón ${code}?`)) return;
    
    try {
      await axios.delete(`${API_URL}/coupons/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Cupón eliminado");
      fetchCoupons();
    } catch (error) {
      toast.error("Error al eliminar cupón");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Gestión de Cupones</h2>
        <Button
          data-testid="create-coupon-button"
          onClick={() => setShowForm(!showForm)}
          className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-2 rounded-full transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? "Cancelar" : "Nuevo Cupón"}
        </Button>
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Crear Nuevo Cupón</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code" className="text-slate-700 font-medium mb-2 block">
                  Código del Cupón
                </Label>
                <Input
                  id="code"
                  data-testid="coupon-code-input"
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  placeholder="VERANO2024"
                />
              </div>

              <div>
                <Label htmlFor="discount" className="text-slate-700 font-medium mb-2 block">
                  Descuento (%)
                </Label>
                <Input
                  id="discount"
                  data-testid="coupon-discount-input"
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) })}
                  className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>

              <div>
                <Label htmlFor="expiry" className="text-slate-700 font-medium mb-2 block">
                  Fecha de Expiración
                </Label>
                <Input
                  id="expiry"
                  data-testid="coupon-expiry-input"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                />
              </div>

              <div>
                <Label htmlFor="max_uses" className="text-slate-700 font-medium mb-2 block">
                  Usos Máximos (vacío = ilimitado)
                </Label>
                <Input
                  id="max_uses"
                  data-testid="coupon-maxuses-input"
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
                  placeholder="Dejar vacío para ilimitado"
                />
              </div>
            </div>

            <Button
              data-testid="submit-coupon-button"
              type="submit"
              className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-8 py-3 rounded-full transition-all"
            >
              Crear Cupón
            </Button>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Tag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No hay cupones registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon) => {
            const isExpired = new Date(coupon.expiry_date) <= new Date();
            const isFullyUsed = coupon.max_uses && coupon.current_uses >= coupon.max_uses;
            
            return (
              <div
                key={coupon.code}
                data-testid={`coupon-item-${coupon.code}`}
                className={`glass-card rounded-xl p-6 shadow-sm ${
                  !coupon.is_active || isExpired || isFullyUsed ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 bg-sky-100 px-4 py-2 rounded-lg">
                        <Tag className="w-5 h-5 text-sky-600" />
                        <span className="font-bold text-sky-900 text-lg">{coupon.code}</span>
                      </div>
                      <span className="bg-sky-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                        {coupon.discount_percentage}% OFF
                      </span>
                      {!coupon.is_active && (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                          Inactivo
                        </span>
                      )}
                      {isExpired && (
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                          Expirado
                        </span>
                      )}
                      {isFullyUsed && (
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                          Agotado
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">Usos</p>
                        <p className="text-slate-900 font-medium">
                          {coupon.current_uses} / {coupon.max_uses || "∞"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Expira</p>
                        <p className="text-slate-900 font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(coupon.expiry_date).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Creado</p>
                        <p className="text-slate-900 font-medium">
                          {new Date(coupon.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    data-testid={`delete-coupon-${coupon.code}`}
                    onClick={() => handleDelete(coupon.code)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-sky-50 border border-sky-200 rounded-xl p-4">
        <p className="text-sm text-slate-700">
          <strong>💡 Cupones Automáticos:</strong> El sistema genera automáticamente cupones de 20% de descuento
          para clientes leales cada 5 pedidos entregados (5, 10, 15, 20...).
        </p>
      </div>
    </div>
  );
};

export default CouponsManagement;
