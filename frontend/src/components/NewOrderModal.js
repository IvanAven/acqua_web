import { useState } from "react";
import axios from "axios";
import { X, Tag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";
const PRICE_PER_BOTTLE = 50;

const NewOrderModal = ({ onClose, onSuccess }) => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponValid, setCouponValid] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [formData, setFormData] = useState({
    quantity: 1,
    delivery_address: user?.address || "",
    delivery_date: "",
    delivery_time: "09:00-12:00",
    notes: "",
    coupon_code: "",
  });

  const validateCoupon = async () => {
    if (!formData.coupon_code.trim()) {
      setCouponValid(null);
      setDiscount(0);
      return;
    }

    setValidatingCoupon(true);
    try {
      const response = await axios.post(
        `${API_URL}/coupons/validate`,
        { code: formData.coupon_code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.valid) {
        setCouponValid(true);
        setDiscount(response.data.discount_percentage);
        toast.success(response.data.message);
      } else {
        setCouponValid(false);
        setDiscount(0);
        toast.error(response.data.message);
      }
    } catch (error) {
      setCouponValid(false);
      setDiscount(0);
      toast.error("Error al validar cupón");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const calculateTotal = () => {
    const original = formData.quantity * PRICE_PER_BOTTLE;
    const final = original * (1 - discount / 100);
    return { original, final };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/orders`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("¡Pedido creado exitosamente!");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Nuevo Pedido</h2>
          <button
            data-testid="close-modal-button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="quantity" className="text-slate-700 font-medium mb-2 block">
              Cantidad de Garrafones
            </Label>
            <Input
              id="quantity"
              data-testid="order-quantity-input"
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>

          <div>
            <Label htmlFor="delivery_address" className="text-slate-700 font-medium mb-2 block">
              Dirección de Entrega
            </Label>
            <Input
              id="delivery_address"
              data-testid="order-address-input"
              type="text"
              required
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_date" className="text-slate-700 font-medium mb-2 block">
                Fecha de Entrega
              </Label>
              <Input
                id="delivery_date"
                data-testid="order-date-input"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
              />
            </div>

            <div>
              <Label htmlFor="delivery_time" className="text-slate-700 font-medium mb-2 block">
                Hora de Entrega
              </Label>
              <select
                id="delivery_time"
                data-testid="order-time-select"
                required
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                className="h-12 px-4 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all w-full bg-white"
              >
                <option value="09:00-12:00">09:00 - 12:00</option>
                <option value="12:00-15:00">12:00 - 15:00</option>
                <option value="15:00-18:00">15:00 - 18:00</option>
                <option value="18:00-21:00">18:00 - 21:00</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-slate-700 font-medium mb-2 block">
              Notas (Opcional)
            </Label>
            <Textarea
              id="notes"
              data-testid="order-notes-input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="px-4 py-3 rounded-lg border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all min-h-[100px]"
              placeholder="Instrucciones especiales para la entrega..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-200 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              data-testid="submit-order-button"
              type="submit"
              disabled={loading}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-full transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Pedido"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOrderModal;
