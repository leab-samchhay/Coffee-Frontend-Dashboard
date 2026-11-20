import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import api from "../service/api";
import {
    FiGrid, FiTag, FiShoppingBag, FiRepeat, FiTruck, FiPackage,
    FiShoppingCart, FiFileText, FiCoffee, FiLayers, FiDollarSign,
    FiSliders, FiChevronDown, FiLogOut, FiBell, FiUser, FiUsers,
    FiMenu, FiX, FiSettings, FiPlusCircle
} from "react-icons/fi";
import logo from '../../public/logo.png';
import ButtonNavbar from "../components/ButtonNavbar";
import { logout } from "../stores/authSlice";
import { logout as logoutApi } from "../service/AuthService";

/* ---------- Animation variants ---------- */
const submenuVariants = {
    hidden: { height: 0, opacity: 0 },
    show: {
        height: "auto",
        opacity: 1,
        transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1], when: "beforeChildren", staggerChildren: 0.05 }
    },
    exit: {
        height: 0,
        opacity: 0,
        transition: { duration: 0.2, ease: "easeInOut", when: "afterChildren" }
    }
};

const childVariants = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: -8, transition: { duration: 0.1 } }
};

/* ---------- Nav link ជាមួយ active bar រំកិលរលូន + hover/tap ---------- */
const AnimatedNavItem = ({ to, end, icon, label, isChild }) => {
    const location = useLocation();
    return (
        <NavLink to={to} end={end} className="block no-underline">
            {({ isActive }) => {
                const active = isActive || (isChild && location.pathname.startsWith(to + "/"));
                return (
                    <motion.div
                        className="relative"
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    >
                        {active && (
                            <motion.span
                                layoutId="active-bar"
                                className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            />
                        )}
                        <ButtonNavbar icon={icon} label={label} isActive={active} isChild={isChild} />
                    </motion.div>
                );
            }}
        </NavLink>
    );
};

export const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.auth?.user);

    const mainRef = useRef(null);
    const navRef = useRef(null);

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const notifRef = useRef(null); // សម្រាប់ចុចបិទពេលចុចក្រៅ

        // Fetch notifications
    const fetchNotifications = async () => {
        try {
            await api.get('/check-stock-notifications');
            const res = await api.get('/my-notifications');
            if (res.data?.notifications) {
                setNotifications(res.data.notifications);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
            // Polling every 60 seconds to check stock
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState({
        "Coffee Management": true,
        "Sales Management": true
    });

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch (error) {
            console.error("Logout API failed:", error);
        } finally {
            dispatch(logout());
            navigate('/', { replace: true });
        }
    };

    const items = [
        { name: "Dashboard", path: "/dashboard", icon: <FiGrid className="text-lg" /> },
        {
            name: "Sales Management",
            icon: <FiShoppingCart className="text-lg" />,
            children: [
                { name: "POS Sale", path: "/sale", icon: <FiShoppingCart className="text-sm" /> },
                { name: "Customers", path: "/customers", icon: <FiUsers className="text-sm" /> },
                { name: "Discound", path: "/discound", icon: <FiUsers className="text-sm" /> },
            ]
        },
        {
            name: "Coffee Management",
            icon: <FiCoffee className="text-lg" />,
            children: [
                { name: "Category", path: "/categories", icon: <FiTag className="text-sm" /> },
                { name: "Coffee Menu", path: "/coffee", icon: <FiCoffee className="text-sm" /> },
                { name: "Coffee Variants", path: "/coffeeVariants", icon: <FiSliders className="text-sm" /> },
                { name: "Create Menu Coffee", path: "/coffeeTransaction", icon: <FiPlusCircle className="text-sm" /> },
            ]
        },
        {
            name: "Ingredients Management",
            icon: <FiPackage className="text-lg" />,
            children: [
                { name: "Ingredients", path: "/ingredients", icon: <FiPackage className="text-sm" /> },
                { name: "Coffee Ingredients", path: "/coffeeIngredients", icon: <FiLayers className="text-sm" /> },
            ]
        },
        {
            name: "Purchase Management",
            icon: <FiTruck className="text-lg" />,
            children: [
                { name: "Suppliers", path: "/suppliers", icon: <FiTruck className="text-sm" /> },
                { name: "Purchase Transactions", path: "/purchaseTransaction", icon: <FiFileText className="text-sm" /> },
            ]
        },
        {
            name: "System Settings",
            icon: <FiSettings className="text-lg" />,
            children: [
                { name: "Order Modes", path: "/orderModes", icon: <FiShoppingBag className="text-sm" /> },
                { name: "Exchange Rates", path: "/exchanges", icon: <FiRepeat className="text-sm" /> },
            ]
        }
    ];

    const isChildActive = (children) =>
        children?.some(child =>
            location.pathname === child.path || location.pathname.startsWith(child.path + "/")
        );

    const toggleMenu = (name) =>
        setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));

    /* ពេលប្តូរ route៖ បិទ drawer, ស្រូលខ្លឹមសារឡើងលើ, បើក menu ម្តាយ, ស្រូល sidebar ទៅរក item active */
    useEffect(() => {
        setIsMobileOpen(false);

        mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });

        // បើកក្រុម menu ដែលមានទំព័រ active ដោយស្វ័យប្រវត្តិ
        items.forEach(item => {
            if (item.children && isChildActive(item.children)) {
                setOpenMenus(prev => (prev[item.name] ? prev : { ...prev, [item.name]: true }));
            }
        });

        // រង់ចាំ submenu បើករួច ទើបស្រូល sidebar
        const t = setTimeout(() => {
            navRef.current
                ?.querySelector('[aria-current="page"]')
                ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }, 300);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-gray-900 overflow-hidden relative">

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw]
                    bg-gradient-to-b from-[#0f2e20] via-[#0c2419] to-[#081810] text-white
                    flex flex-col justify-between border-r border-emerald-950/60 shadow-2xl lg:shadow-xl
                    transform transition-transform duration-300 ease-in-out
                    lg:static lg:translate-x-0 lg:z-20 shrink-0
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <div className="flex flex-col h-full min-h-0">

                    {/* Brand */}
                    <div className="h-16 flex items-center justify-between px-5 border-b border-emerald-900/50 bg-emerald-950/50 shrink-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <motion.div
                                whileHover={{ rotate: -8, scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                className="h-10 w-10 rounded-xl bg-white/10 p-1.5 flex items-center justify-center shrink-0 border border-white/15 shadow-inner"
                            >
                                <img src={logo} alt="Coffee Logo" className="h-full w-full object-contain" />
                            </motion.div>
                            <div className="overflow-hidden">
                                <h2 className="text-sm font-bold text-white tracking-wide truncate">COFFEE CAFE</h2>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] tracking-wider uppercase font-medium text-emerald-300/80">
                                        Management
                                    </span>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.85, rotate: 90 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="lg:hidden p-2 text-emerald-300/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            aria-label="Close menu"
                        >
                            <FiX className="w-5 h-5" />
                        </motion.button>
                    </div>

                    {/* Navigation */}
                    <nav
                        ref={navRef}
                        className="flex-1 overflow-y-auto scroll-smooth overscroll-contain px-3.5 py-4 space-y-1.5 select-none scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent"
                    >
                        {items.map((item) => {
                            const hasChildren = item.children && item.children.length > 0;
                            const isOpen = !!openMenus[item.name];
                            const childIsActive = hasChildren && isChildActive(item.children);

                            return (
                                <div key={item.name}>
                                    {hasChildren ? (
                                        <div className="space-y-1">
                                            {/* Dropdown header */}
                                            <motion.button
                                                type="button"
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => toggleMenu(item.name)}
                                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors duration-200 cursor-pointer text-left ${
                                                    childIsActive
                                                        ? 'bg-emerald-900/60 text-white border border-emerald-500/30'
                                                        : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`shrink-0 ${childIsActive ? 'text-emerald-400' : 'text-emerald-300/80'}`}>
                                                        {item.icon}
                                                    </span>
                                                    <span className="truncate">{item.name}</span>
                                                </div>
                                                <motion.span
                                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="flex"
                                                >
                                                    <FiChevronDown className={`w-4 h-4 ${isOpen ? 'text-white' : 'text-emerald-300/70'}`} />
                                                </motion.span>
                                            </motion.button>

                                            {/* Submenu (មាន exit animation ហើយ) */}
                                            <AnimatePresence initial={false}>
                                                {isOpen && (
                                                    <motion.div
                                                        variants={submenuVariants}
                                                        initial="hidden"
                                                        animate="show"
                                                        exit="exit"
                                                        className="overflow-hidden pl-3 border-l-2 border-emerald-700/40 ml-5 space-y-1 my-1"
                                                    >
                                                        {item.children.map((child) => (
                                                            <motion.div key={child.path} variants={childVariants}>
                                                                <AnimatedNavItem
                                                                    to={child.path}
                                                                    icon={child.icon}
                                                                    label={child.name}
                                                                    isChild
                                                                />
                                                            </motion.div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <AnimatedNavItem
                                            to={item.path}
                                            end={item.path === "/"}
                                            icon={item.icon}
                                            label={item.name}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-3.5 border-t border-emerald-900/50 bg-emerald-950/60 shrink-0 space-y-2.5">

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs font-medium text-red-200 hover:text-white bg-red-500/12 hover:bg-red-500/40 border border-red-500/50 transition-colors duration-150"
                        >
                            <FiLogOut className="text-sm" />
                            <span>Sign Out</span>
                        </motion.button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">

                <header className="h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 flex justify-between items-center px-4 sm:px-6 lg:px-8 shadow-xs z-10 shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setIsMobileOpen(true)}
                            className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer shrink-0"
                            aria-label="Open sidebar"
                        >
                            <FiMenu className="w-5 h-5" />
                        </motion.button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
                        <motion.button
                            type="button"
                            whileHover={{ rotate: [0, -12, 12, -8, 8, 0] }}
                            transition={{ duration: 0.5 }}
                            whileTap={{ scale: 0.88 }}
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className="relative p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                            title="Notifications"
                        >
                            <FiBell className="w-5 h-5" />
                            {notifications.filter(n => !n.is_read).length > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                            )}
                        </motion.button>

                        {/* Notification Dropdown Box */}
                        <AnimatePresence>
                            {isNotificationOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                                >
                                    {/* Header */}
                                    <div className="px-4 py-3 bg-emerald-900 text-white flex items-center justify-between">
                                        <h3 className="font-semibold text-sm">សារជូនដំណឹង (Notifications)</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-emerald-800 px-2 py-0.5 rounded-full text-emerald-200">
                                                {notifications.filter(n => !n.is_read).length} ថ្មី
                                            </span>
                                            {notifications.some(n => !n.is_read) && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-[11px] underline text-emerald-300 hover:text-white cursor-pointer"
                                                >
                                                    អានទាំងអស់
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                                        {notifications.length > 0 ? (
                                            notifications.map((notif, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`p-3.5 transition-colors hover:bg-gray-50 flex gap-3 items-start ${!notif.is_read ? 'bg-emerald-50/50' : ''}`}
                                                >
                                                    <span className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${String(notif.type).toLowerCase().includes('out') ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-gray-800 leading-snug">
                                                            {notif.type}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                                                            {notif.message}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 mt-1 block">
                                                            {new Date(notif.created_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-gray-400 text-xs">
                                                មិនមានសារជូនដំណឹងទេ
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                                        <button 
                                            onClick={() => setIsNotificationOpen(false)}
                                            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
                                        >
                                            បិទផ្ទាំងនេះ
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="h-5 w-px bg-gray-200" />

                        <div className="flex items-center gap-2 pl-0.5 sm:pl-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-emerald-100 shrink-0">
                                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-xs font-semibold text-gray-700 leading-tight">{currentUser?.name || 'Admin'}</p>
                                <p className="text-[10px] text-emerald-600 font-medium">{currentUser?.email || 'Store Manager'}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content: ស្រូលរលូន + page transition រហ័ស */}
                <main
                    ref={mainRef}
                    className="flex-1 overflow-y-auto scroll-smooth overscroll-contain p-3.5 sm:p-5 lg:p-8 bg-slate-50"
                >
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="max-w-7xl mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;