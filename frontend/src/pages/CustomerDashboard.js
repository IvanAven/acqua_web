import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Droplets, LogOut, Package, Clock, CheckCircle, XCircle, Truck, Plus, Tag, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import NewOrderModal from "@/components/NewOrderModal";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const CustomerDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total_orders: 0, pending_orders: 0 });
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);

  const fetchData = async () => {
    try {
      const [ordersRes, statsRes, couponsRes] = await Promise.all([
        axios.get(`${API_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/coupons/my-coupons`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
      setCoupons(couponsRes.data);
    } catch (error) {
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      in_transit: { label: "En Camino", color: "bg-blue-100 text-blue-700", icon: Truck },
      delivered: { label: "Entregado", color: "bg-green-100 text-green-700", icon: CheckCircle },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: XCircle },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-8 h-8 text-sky-500" />
            <span className="text-2xl font-bold text-slate-900 font-outfit">ACQUA</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">Hola, {user?.name}</span>
            <Button
              data-testid="logout-button"
              onClick={handleLogout}
              variant="ghost"
              className="text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Total de Pedidos</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total_orders}</p>
            </div>
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-sky-500" />
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Pedidos Pendientes</p>
              <p className="text-3xl font-bold text-slate-900">{stats.pending_orders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* New Order Button */}
        <div className="mb-6">
          <Button
            data-testid="new-order-button"
            onClick={() => setShowNewOrder(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-8 py-3 rounded-full transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Pedido
          </Button>
        </div>

        {/* Available Coupons */}
        {coupons.length > 0 && (
          <div className="glass-card rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-6 h-6 text-sky-500" />
              <h2 className="text-2xl font-semibold text-slate-900">Tus Cupones Disponibles</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.code}
                  data-testid={`coupon-${coupon.code}`}
                  className="bg-gradient-to-br from-sky-50 to-sky-100 border-2 border-sky-300 border-dashed rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-sky-600" />
                      <span className="font-bold text-sky-900 text-lg">{coupon.code}</span>
                    </div>
                    <span className="bg-sky-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {coupon.discount_percentage}% OFF
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {coupon.max_uses === 1 ? "Uso único" : `${coupon.max_uses || "Ilimitado"} usos`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Válido hasta: {new Date(coupon.expiry_date).toLocaleDateString('es-MX')}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Aplica tus cupones al crear un nuevo pedido
            </p>
          </div>
        )}

        {/* Orders List */}
        <div className="glass-card rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Mis Pedidos</h2>
          
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No tienes pedidos aún</p>
              <Button
                onClick={() => setShowNewOrder(true)}
                className="mt-4 bg-sky-500 hover:bg-sky-600 text-white"
              >
                Crear tu primer pedido
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div
                    key={order.id}
                    data-testid={`order-${order.id}`}
                    className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {order.quantity} {order.quantity === 1 ? 'Garrafón' : 'Garrafones'}
                          </h3>
                          <span
                            data-testid={`order-status-${order.id}`}
                            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          Pedido: {new Date(order.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 min-w-[120px]">Dirección:</span>
                        <span className="text-slate-900">{order.delivery_address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 min-w-[120px]">Entrega:</span>
                        <span className="text-slate-900">
                          {new Date(order.delivery_date).toLocaleDateString('es-MX')} - {order.delivery_time}
                        </span>
                      </div>
                      {order.notes && (
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 min-w-[120px]">Notas:</span>
                          <span className="text-slate-900">{order.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* New Order Modal */}
      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onSuccess={() => {
            setShowNewOrder(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
