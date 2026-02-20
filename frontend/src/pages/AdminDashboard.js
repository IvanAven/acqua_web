import { useState, useEffect } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Droplets,
  LogOut,
  Package,
  Users,
  LayoutDashboard,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CouponsManagement from "@/components/CouponsManagement";

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

const AdminDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const NavLink = ({ to, icon: Icon, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
          isActive
            ? "bg-sky-50 text-sky-600"
            : "text-slate-600 hover:text-sky-600 hover:bg-sky-50"
        }`}
      >
        <Icon className="w-5 h-5" />
        {children}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white/50 backdrop-blur-sm hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Droplets className="w-8 h-8 text-sky-500" />
            <span className="text-2xl font-bold text-slate-900 font-outfit">ACQUA</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">Panel de Administrador</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink to="/admin" icon={LayoutDashboard}>
            Resumen
          </NavLink>
          <NavLink to="/admin/orders" icon={Package}>
            Pedidos
          </NavLink>
          <NavLink to="/admin/customers" icon={Users}>
            Clientes
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="mb-4">
            <p className="text-sm text-slate-600">Administrador</p>
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
          </div>
          <Button
            data-testid="admin-logout-button"
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-sky-600 hover:bg-sky-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<OverviewTab token={token} />} />
          <Route path="/orders" element={<OrdersTab token={token} />} />
          <Route path="/customers" element={<CustomersTab token={token} />} />
        </Routes>
      </main>
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ token }) => {
  const [stats, setStats] = useState({
    total_customers: 0,
    total_orders: 0,
    pending_orders: 0,
    delivered_orders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (error) {
        toast.error("Error al cargar estadísticas");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Resumen General</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-6 shadow-sm" data-testid="stat-customers">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-sky-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.total_customers}</p>
          <p className="text-sm text-slate-600">Total Clientes</p>
        </div>

        <div className="glass-card rounded-xl p-6 shadow-sm" data-testid="stat-orders">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.total_orders}</p>
          <p className="text-sm text-slate-600">Total Pedidos</p>
        </div>

        <div className="glass-card rounded-xl p-6 shadow-sm" data-testid="stat-pending">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.pending_orders}</p>
          <p className="text-sm text-slate-600">Pedidos Pendientes</p>
        </div>

        <div className="glass-card rounded-xl p-6 shadow-sm" data-testid="stat-delivered">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">{stats.delivered_orders}</p>
          <p className="text-sm text-slate-600">Pedidos Entregados</p>
        </div>
      </div>
    </div>
  );
};

// Orders Tab
const OrdersTab = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Estado actualizado");
      fetchOrders();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Gestión de Pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No hay pedidos registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={order.id}
                data-testid={`admin-order-${order.id}`}
                className="glass-card rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {order.quantity} {order.quantity === 1 ? 'Garrafón' : 'Garrafones'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Pedido: {new Date(order.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>

                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusChange(order.id, value)}
                  >
                    <SelectTrigger
                      data-testid={`status-select-${order.id}`}
                      className="w-[180px]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_transit">En Camino</SelectItem>
                      <SelectItem value="delivered">Entregado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Cliente</p>
                    <p className="text-slate-900 font-medium">{order.customer_name}</p>
                    <p className="text-slate-600">{order.customer_email}</p>
                    <p className="text-slate-600">{order.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Entrega</p>
                    <p className="text-slate-900">{order.delivery_address}</p>
                    <p className="text-slate-600">
                      {new Date(order.delivery_date).toLocaleDateString('es-MX')} - {order.delivery_time}
                    </p>
                    {order.notes && (
                      <p className="text-slate-600 mt-2">
                        <span className="font-medium">Notas:</span> {order.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Customers Tab
const CustomersTab = ({ token }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${API_URL}/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomers(response.data);
      } catch (error) {
        toast.error("Error al cargar clientes");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Gestión de Clientes</h1>

      {customers.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div
              key={customer.email}
              data-testid={`customer-${customer.email}`}
              className="glass-card rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky-500" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{customer.total_orders}</p>
                  <p className="text-xs text-slate-600">Pedidos</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">{customer.name}</h3>
              <div className="space-y-1 text-sm text-slate-600">
                <p>{customer.email}</p>
                <p>{customer.phone}</p>
                <p>{customer.address}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Registrado: {new Date(customer.created_at).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
