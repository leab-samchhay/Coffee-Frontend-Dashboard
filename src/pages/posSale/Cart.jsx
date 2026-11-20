import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
    selectCartItems,
    selectTotalQty,
    selectTotalPrice
} from '../../stores/cartSlice';
import { FiTrash2, FiShoppingBag, FiCheckCircle } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';
import CustomerService from '../../service/CustomerService';
import OrderModeService from '../../service/OrderModeService';
import ExchangeService from '../../service/ExchangeService';
import { OrderTransaction } from '../../service/OrderTransaction';

import {  FiPlus, FiMinus, FiArrowRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

import { FiCheck, FiArrowLeft, FiDollarSign, FiCreditCard } from "react-icons/fi";

const IMAGE_BASE_URL = "http://127.0.0.1:8000/storage/";

export default function CartSidebar({ onCheckout }) {
    const dispatch = useDispatch();
    const cartItems = useSelector(selectCartItems);
    const totalQty = useSelector(selectTotalQty);
    const totalPrice = useSelector(selectTotalPrice);
    const [loading,setLoading] = useState(false);

    // Modal & step states
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [InfoPayment, setInfoPayment] = useState(false);
    const [payment, setPayment] = useState(false);
    const [PaymentSuccess, setPaymentSuccess] = useState(false);

    // API Data states
    const [customer, setCustomer] = useState([]);
    const [orderMode, setOrderMode] = useState([]);
    const [exchange, setExchange] = useState([]);
    const [errMessage,setErrMessage] = useState("");

    // Form input states
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("1");
    const [selectedOrderModeId, setSelectedOrderModeId] = useState("");
    const [selectedExchangeId, setSelectedExchangeId] = useState("");
    const [orderNumber, setOrderNumber] = useState("");
    const [cashReceived, setCashReceived] = useState("");
    

    const [form,setForm] = useState({
        customer_id: "",
        user_id: "",
        order_mode: "",
        exchange: "",
        order_number: "",
        discound: "",
        tax: "",
        order_at: "",
        status: "",
        payment_methord: "",
        paid_amount: "",
        change_amount: "",
        payment_status: "",
        paid_at: "",
        items: [
            {
                coffee_variant_id: "",
                sugar_percent: "",
                quantity: "",
                status: ""
            }
        ]
    });

    

    //===========>>>> Function បង្កើតលេខ Order មិនជាន់គ្នា <<<<==============
    const generateUniqueOrderNumber = () => {
        const now = new Date();
        const timePart = now.toTimeString().split(' ')[0].replace(/:/g, '');
        const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `ORD-${timePart}-${randomPart}`;
    };

    const generateNewOrderNumber = () => {
        setOrderNumber(generateUniqueOrderNumber());
    };

    useEffect(() => {
        generateNewOrderNumber();
    }, []);

    //===========>>>> គណនាទឹកប្រាក់សរុប (Subtotal, Discount, Tax, KHR) <<<<==============
   const {
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal,
        exchangeRate,
        grandTotalKHR,
        changeAmount
    } = useMemo(() => {
        const sub = Number(totalPrice || 0);

        // 👉 ឆែកមើល end_date ថាតើហួសថ្ងៃហើយឬยัง
        const isDiscountValid = form.end_date 
            ? new Date(form.end_date) >= new Date() 
            : true; // បើគ្មានដាក់ថ្ងៃផុតកំណត់ទេ ចាត់ទុកថាប្រើបាន

        // បើហួសថ្ងៃ (isDiscountValid ជា false) កំណត់ឱ្យ discPct ស្មើនឹង 0 ភ្លាម
        const discPct = isDiscountValid 
            ? Math.min(Math.max(Number(form.discound) || 0, 0), 100) 
            : 0;

        const taxPct = Math.max(Number(form.tax) || 0, 0);

        const discAmt = (sub * discPct) / 100;
        const afterDiscount = Math.max(sub - discAmt, 0);
        const txAmt = (afterDiscount * taxPct) / 100;
        const finalTotal = Number((afterDiscount + txAmt).toFixed(2));

        const matchedExchange = exchange.find(
            (item) => String(item.id) === String(form.exchange)
        );
        const rate = Number(matchedExchange?.rate || 4100);
        const totalKHR = Math.round(finalTotal * rate);

        const received = Number(form.paid_amount || 0);
        const change = Math.max(Number((received - finalTotal).toFixed(2)), 0);

        return {
            subtotal: sub,
            discountAmount: discAmt,
            taxAmount: txAmt,
            grandTotal: finalTotal,
            exchangeRate: rate,
            grandTotalKHR: totalKHR,
            changeAmount: change
        };
    }, [totalPrice, form.discound, form.end_date, form.tax, exchange, form.exchange, form.paid_amount]);

    // Lock body scroll & reset modal steps when closed
    useEffect(() => {
        if (isCheckoutOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            setInfoPayment(false);
            setPayment(false);
            setPaymentSuccess(false);
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isCheckoutOpen]);

    // Fetch initial dropdown data
    const fetchCustomer = async () => {
        try {
            const res = await CustomerService.getAll(1, 10000);
            const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
            setCustomer(data);
            if (data.length > 0) {
                setSelectedCustomerId(String(data[0].id));
            }
        } catch (err) {
            console.error("Error fetching customers:", err);
        }
    };

    const fetchOrderMode = async () => {
        try {
            const res = await OrderModeService.getAll(1, 10000);
            const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
            setOrderMode(data);
            if (data.length > 0) {
                setSelectedOrderModeId(String(data[0].id));
            }
        } catch (err) {
            console.error("Error fetching order modes:", err);
        }
    };

    const fetchExchange = async () => {
        try {
            const res = await ExchangeService.getAll(1, 10000);
            const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
            setExchange(data);
            if (data.length > 0) {
                setSelectedExchangeId(String(data[0].id));
            }
        } catch (err) {
            console.error("Error fetching exchanges:", err);
        }
    };

    useEffect(() => {
        fetchCustomer();
        fetchOrderMode();
        fetchExchange();
    }, []);

    // Handlers
    const handleClearCart = () => {
        if (cartItems.length === 0) return;
        dispatch(clearCart());
    };

    const handleOpenCheckout = () => {
        if (cartItems.length === 0) return;
        generateNewOrderNumber();
        setForm(prev => ({
            ...prev,
            paid_amount: grandTotal.toFixed(2)
        }));
        setCashReceived(grandTotal.toFixed(2));
        setIsCheckoutOpen(true);
        setInfoPayment(true);
        setPayment(false);
        setPaymentSuccess(false);
    };

    const InfoPaymentComplete = () => {
        setCashReceived(grandTotal.toFixed(2));
        setInfoPayment(false);
        setPayment(true);
    };

    const handleSubmit = async(e) => {
        e.preventDefault();
        
        const payLoad = {
            customer_id: Number(selectedCustomerId) || 1,
            user_id: Number(selectedUserId) || 1,
            order_mode: Number(selectedOrderModeId) || 1,
            exchange: Number(selectedExchangeId) || 1,
            order_number: orderNumber, // យកពី state orderNumber ផ្ទាល់
            discound: Number(form.discound) || 0,
            tax: Number(form.tax) || 0,
            order_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            status: 1,
            payment_methord: form.payment_methord || "Cash",
            paid_amount: Number(form.paid_amount),
            change_amount: Number(changeAmount) || 0,
            payment_status: "Paid",
            paid_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            items: cartItems.map(item => ({
                coffee_variant_id: Number(item.CoffeeVariantId || item.coffee_variant_id || 1),
                sugar_percent: Number(item.sugar_percent || 0),
                quantity: Number(item.qty || item.Quantity || 1),
                status: 1
            }))
        }; 

        try {
            setLoading(true);
            const res = await OrderTransaction.createOrderTransaction(payLoad);
            console.log("Success:", res);
            setPayment(false);
            dispatch(clearCart());
            setPaymentSuccess(true)
            setTimeout(() =>{
                setPaymentSuccess(false);
                setIsCheckoutOpen(false)
            },1000)
        } catch(err) {
            setErrMessage(err.response?.data || err);
            console.log("Error details:", err.response?.data || err);
            console.log(errMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleOnchange = (e) => {
        const {name,value} = e.target;
        setForm((pre) => ({...pre,[name] : value}));
    }

    const fieldCls =
    "w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-800 shadow-sm transition-all hover:border-emerald-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10";
    const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-slate-500";

    const currentStep = PaymentSuccess ? 3 : payment ? 2 : 1;
    const stepLabels = ["Order", "Payment", "Done"];

    // --- State បន្ថែមសម្រាប់ ABA PayWay ---
    const [qrData, setQrData] = useState(null);
    const [isGeneratingQr, setIsGeneratingQr] = useState(false);
    const [isCheckingPayment, setIsCheckingPayment] = useState(false);

    // មុខងារសម្រាប់ហៅ API បង្កើត QR ពី Laravel Backend
    const generateAbaQr = async () => {
        try {
            setIsGeneratingQr(true);
            // ជំនួສ URL តាម API Route របស់អ្នក (ឧទាហរណ៍ /api/aba/create-qr)
            const response = await axios.post('/api/aba/create-qr', {
                amount: grandTotal,
                fine_id: 1 
            });

            if (response.data.status === 'success') {
                setQrData(response.data.data);
                // ចាប់ផ្តើមឆែកស្ថានភាពបង់ប្រាក់ស្វ័យប្រវត្តិរៀងរាល់ 3 វិនាទី
                startCheckingTransaction(response.data.data.tran_id);
            }
        } catch (error) {
            console.error('Error generating ABA QR:', error);
            setErrMessage({ message: 'មិនអាចបង្កើត QR Code បានទេ សូមព្យាយាមម្ដងទៀត។' });
        } finally {
            setIsGeneratingQr(false);
        }
    };

    // មុខងារសម្រាប់ឆែកស្ថានភាពបង់ប្រាក់ជាមួយ Backend ជារៀងរាល់ 3 វិនាទី
    const startCheckingTransaction = (tranId) => {
        setIsCheckingPayment(true);
        const interval = setInterval(async () => {
            try {
                const response = await axios.post('/api/aba/check-transaction', {
                    tran_id: tranId
                });

                // ផ្អែកលើ Controller របស់អ្នក: status 0 គឺជោគជ័យ (Approved)
                if (response.data.status === 0 || response.data.status === 'success') {
                    clearInterval(interval);
                    setIsCheckingPayment(false);
                    setPayment(false);
                    dispatch(clearCart());
                    setPaymentSuccess(true);
                    setTimeout(() => {
                        setPaymentSuccess(false);
                        setIsCheckoutOpen(false);
                    }, 1500);
                }
            } catch (error) {
                console.error('Checking transaction error:', error);
            }
        }, 3000);

        return () => clearInterval(interval);
    };

    // ហៅបង្កើត QR ស្វ័យប្រវត្តិ នៅពេលចូលដល់ Step 2 ហើយជ្រើសរើស Bank-Payment
    useEffect(() => {
        if (payment && form.payment_methord === "Bank-Payment") {
            generateAbaQr();
        }
    }, [payment, form.payment_methord]);

    return (
        <aside className="flex h-full w-full flex-col border-l border-slate-200 bg-white font-sans select-none">
            {/* Header */}
            <header className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30">
                        <FiShoppingBag size={17} />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">Order List</h2>

                    {/* Count badge pops when the number changes */}
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={totalQty}
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.4, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-bold text-emerald-700"
                        >
                            {totalQty}
                        </motion.span>
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {cartItems.length > 0 && (
                        <motion.button
                            type="button"
                            onClick={handleClearCart}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            whileTap={{ scale: 0.92 }}
                            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-100 hover:text-rose-600"
                        >
                            <FiTrash2 size={12} />
                            Clear All
                        </motion.button>
                    )}
                </AnimatePresence>
            </header>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 [scrollbar-width:thin]">
                {cartItems.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-300 ring-8 ring-emerald-50/50">
                            <FiShoppingBag size={36} />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">មិនទាន់មានទំនិញក្នុងកន្ត្រកទេ</p>
                        <p className="text-xs text-slate-400">Pick a coffee to get started</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {cartItems.map((item) => {
                                const itemKey = item.cartItemId || `${item.id}-${item.CoffeeVariantId}-${item.sugar_percent}`;
                                const displayPrice = Number(item.UnitPrice || item.price || 0);
                                const itemQty = Number(item.qty || item.Quantity || 1);
                                const itemSubTotal = Number(item.SubTotal ?? (displayPrice * itemQty));
                                const discountPct = Number(item.discound_item || 0);
                                const taxPct = Number(item.tax_item || 0);

                                return (
                                    <motion.div
                                        key={itemKey}
                                        layout
                                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 60, scale: 0.9 }}
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                        className="group relative rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Image */}
                                            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 ring-1 ring-slate-100">
                                                {item.image ? (
                                                    <img
                                                        src={item.image.startsWith("http") ? item.image : `${IMAGE_BASE_URL}${item.image}`}
                                                        alt={item.name}
                                                        className="h-full w-full object-contain p-1.5 drop-shadow transition-transform duration-300 group-hover:scale-110"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-[10px] font-semibold text-slate-300">No Pic</span>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="truncate text-sm font-bold text-slate-800" title={item.name}>
                                                        {item.name}
                                                    </p>

                                                    {/* Remove */}
                                                    <motion.button
                                                        type="button"
                                                        onClick={() => dispatch(removeFromCart(item))}
                                                        whileHover={{ scale: 1.15 }}
                                                        whileTap={{ scale: 0.8 }}
                                                        className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                                                        title="Remove item"
                                                        aria-label="Remove item"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </motion.button>
                                                </div>

                                                {/* Variant & sugar badges */}
                                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                                    {item.variantName && item.variantName !== "Default" && (
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                            {item.variantName}
                                                        </span>
                                                    )}
                                                    {item.sugar_percent !== undefined && (
                                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                                            Sugar {item.sugar_percent}%
                                                        </span>
                                                    )}
                                                    {discountPct > 0 && (
                                                        <span className="rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                                            -{discountPct}%
                                                        </span>
                                                    )}
                                                    {taxPct > 0 && (
                                                        <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-100">
                                                            +{taxPct}% tax
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom row: quantity + prices */}
                                        <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-100 pt-2.5">
                                            <div className="flex items-center gap-1 rounded-full bg-slate-50 p-1 ring-1 ring-slate-200">
                                                <motion.button
                                                    type="button"
                                                    onClick={() => dispatch(decreaseQty(item))}
                                                    whileTap={{ scale: 0.8 }}
                                                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
                                                    title="Decrease quantity"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <FiMinus size={12} />
                                                </motion.button>

                                                <div className="relative h-6 w-7 overflow-hidden">
                                                    <AnimatePresence mode="popLayout" initial={false}>
                                                        <motion.span
                                                            key={itemQty}
                                                            initial={{ y: 12, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            exit={{ y: -12, opacity: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700"
                                                        >
                                                            {itemQty}
                                                        </motion.span>
                                                    </AnimatePresence>
                                                </div>

                                                <motion.button
                                                    type="button"
                                                    onClick={() => dispatch(increaseQty(item))}
                                                    whileTap={{ scale: 0.8 }}
                                                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30"
                                                    title="Increase quantity"
                                                    aria-label="Increase quantity"
                                                >
                                                    <FiPlus size={12} />
                                                </motion.button>
                                            </div>

                                            <div className="text-right leading-tight">
                                                <p className="text-[11px] text-slate-400">
                                                    ${displayPrice.toFixed(2)} × {itemQty}
                                                </p>
                                                <p className="text-sm font-extrabold text-emerald-700">
                                                    ${itemSubTotal.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Footer / Summary Checkout */}
            <footer className="mt-auto shrink-0 border-t border-slate-100 bg-white p-4 shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.12)]">
                <div className="mb-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 ring-1 ring-emerald-100">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>ចំនួនមុខទំនិញ (Items)</span>
                        <span className="font-semibold text-slate-700">{totalQty} កែវ / items</span>
                    </div>
                    <div className="my-2.5 border-t border-dashed border-emerald-200" />
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold text-slate-700">សរុប (Total)</span>
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                                key={totalPrice}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-2xl font-extrabold tracking-tight text-emerald-700"
                            >
                                ${totalPrice.toFixed(2)}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>

                <motion.button
                    type="button"
                    onClick={handleOpenCheckout}
                    disabled={cartItems.length === 0}
                    whileHover={cartItems.length === 0 ? {} : { y: -2 }}
                    whileTap={cartItems.length === 0 ? {} : { scale: 0.97 }}
                    className="group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                    {/* Shimmer on hover */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full group-disabled:hidden" />

                    <span className="relative">Check Out</span>
                    <span className="relative flex items-center gap-2">
                        <span className="rounded-lg bg-white/20 px-2.5 py-0.5">${totalPrice.toFixed(2)}</span>
                        <FiArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-disabled:hidden" />
                    </span>
                </motion.button>
            </footer>

            {/* Built-in Checkout Confirmation Modal */}
            {createPortal(
                <AnimatePresence>
                    {isCheckoutOpen && (
                        <motion.div
                            key="checkout-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setIsCheckoutOpen(false);
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 60, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 40, scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl"
                            >
                                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                                    {/* Header with stepper */}
                                    <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 px-5 pb-5 pt-5 text-white">
                                        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
                                        <div className="pointer-events-none absolute -bottom-10 left-20 h-24 w-24 rounded-full bg-white/10" />

                                        {currentStep !== 3 && (
                                            <motion.button
                                                type="button"
                                                onClick={() => setIsCheckoutOpen(false)}
                                                aria-label="Close"
                                                whileHover={{ rotate: 90, scale: 1.1 }}
                                                whileTap={{ scale: 0.85 }}
                                                className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                                            >
                                                <IoClose size={18} />
                                            </motion.button>
                                        )}

                                        <h3 className="relative pr-10 text-base font-bold">
                                            {currentStep === 1 && "សេចក្តីសង្ខេបការបញ្ជាទិញ (Order Summary)"}
                                            {currentStep === 2 && `ការទូទាត់ប្រាក់ (${form.payment_methord})`}
                                            {currentStep === 3 && "ការទូទាត់ជោគជ័យ"}
                                        </h3>

                                        {/* Stepper */}
                                        <div className="relative mt-4 flex items-center">
                                            {stepLabels.map((label, i) => {
                                                const n = i + 1;
                                                const done = currentStep > n;
                                                const active = currentStep === n;
                                                return (
                                                    <div key={label} className="flex flex-1 items-center last:flex-none">
                                                        <div className="flex items-center gap-2">
                                                            <motion.span
                                                                animate={{ scale: active ? 1.1 : 1 }}
                                                                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-300 ${
                                                                    done || active ? "bg-white text-emerald-700" : "bg-white/25 text-white"
                                                                }`}
                                                            >
                                                                {done ? <FiCheck size={13} /> : n}
                                                            </motion.span>
                                                            <span className={`text-xs font-semibold transition-opacity ${active || done ? "opacity-100" : "opacity-60"}`}>
                                                                {label}
                                                            </span>
                                                        </div>
                                                        {n < 3 && (
                                                            <div className="mx-3 h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
                                                                <motion.div
                                                                    className="h-full bg-white"
                                                                    initial={false}
                                                                    animate={{ width: done ? "100%" : "0%" }}
                                                                    transition={{ duration: 0.4 }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Steps */}
                                    <AnimatePresence mode="wait" initial={false}>
                                        {/* STEP 1: Order Info & Summary */}
                                        {InfoPayment && (
                                            <motion.div
                                                key="step-1"
                                                initial={{ opacity: 0, x: -30 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -30 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex min-h-0 flex-1 flex-col"
                                            >
                                                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                                                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                                                        <div className="space-y-1.5">
                                                            <label className={labelCls}>Customer</label>
                                                            <select value={form.customer_id} name="customer_id" onChange={handleOnchange} className={`${fieldCls} cursor-pointer`}>
                                                                <option value="0">general</option>
                                                                {customer.map((item) => (
                                                                    <option key={item.id} value={item.id}>
                                                                        {item.name} {item.phone ? `(${item.phone})` : ""}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className={labelCls}>UserId</label>
                                                            <select value={form.user_id} name="user_id" onChange={handleOnchange} className={`${fieldCls} cursor-pointer`}>
                                                                <option value="1">Admin</option>
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className={labelCls}>Order Mode</label>
                                                            <select value={form.order_mode} name="order_mode" onChange={handleOnchange} className={`${fieldCls} cursor-pointer`}>
                                                                <option value="" disabled>Select order mode...</option>
                                                                {orderMode.length > 0 ? (
                                                                    orderMode.map((item) => (
                                                                        <option key={item.id} value={item.id}>{item.name}</option>
                                                                    ))
                                                                ) : (
                                                                    <>
                                                                        <option value="dine-in">Dine In</option>
                                                                        <option value="take-away">Take Away</option>
                                                                        <option value="delivery">Delivery</option>
                                                                    </>
                                                                )}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className={labelCls}>Exchange Rate</label>
                                                            <select name="exchange" value={form.exchange} onChange={handleOnchange} className={`${fieldCls} cursor-pointer`}>
                                                                {exchange.length > 0 ? (
                                                                    exchange.map((item) => (
                                                                        <option key={item.id} value={item.id}>
                                                                            USD → KHR ({Number(item.rate).toLocaleString()}៛)
                                                                        </option>
                                                                    ))
                                                                ) : (
                                                                    <option value="kh">USD → KHR (4,100៛)</option>
                                                                )}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className={labelCls}>Order Number</label>
                                                            <input
                                                                type="text"
                                                                disabled
                                                                value={orderNumber}
                                                                className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 py-2.5 px-3.5 font-mono text-sm text-slate-500"
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className={labelCls}>Payment Method</label>
                                                            <select value={form.payment_methord} name="payment_methord" onChange={handleOnchange} className={`${fieldCls} cursor-pointer`}>
                                                                <option value="">Select Payment</option>
                                                                <option value="Cash">Cash</option>
                                                                <option value="Bank-Payment">Bank Payment (ABA / KHQR)</option>
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className={labelCls}>Discount (%)</label>
                                                            <div className="relative">
                                                                <input type="number" name="discound" value={form.discound} onChange={handleOnchange} placeholder="0" className={`${fieldCls} pr-8`} />
                                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-slate-400">%</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className={labelCls}>Tax (%)</label>
                                                            <div className="relative">
                                                                <input type="number" name="tax" value={form.tax} onChange={handleOnchange} placeholder="0" className={`${fieldCls} pr-8`} />
                                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-slate-400">%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Receipt-style summary */}
                                                    <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-100">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs text-slate-500">
                                                                <span>ចំនួនសរុប (Total Items)</span>
                                                                <span className="font-semibold text-slate-700">{totalQty} items</span>
                                                            </div>
                                                            <div className="flex justify-between text-xs text-slate-500">
                                                                <span>តម្លៃដើម (Subtotal)</span>
                                                                <span className="font-semibold text-slate-700">${subtotal.toFixed(2)}</span>
                                                            </div>
                                                            {discountAmount > 0 && (
                                                                <div className="flex justify-between text-xs font-medium text-rose-500">
                                                                    <span>បញ្ចុះតម្លៃ (Discount {form.discound}%)</span>
                                                                    <span>-${discountAmount.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {taxAmount > 0 && (
                                                                <div className="flex justify-between text-xs text-slate-500">
                                                                    <span>ពន្ធ (Tax {form.tax}%)</span>
                                                                    <span className="font-semibold text-slate-700">+${taxAmount.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="my-3 border-t border-dashed border-emerald-200" />

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-semibold text-slate-700">ទឹកប្រាក់ត្រូវបង់ (Grand Total)</span>
                                                            <div className="text-right leading-tight">
                                                                <AnimatePresence mode="popLayout" initial={false}>
                                                                    <motion.p
                                                                        key={grandTotal}
                                                                        initial={{ y: 10, opacity: 0 }}
                                                                        animate={{ y: 0, opacity: 1 }}
                                                                        exit={{ y: -10, opacity: 0 }}
                                                                        transition={{ duration: 0.2 }}
                                                                        className="text-2xl font-extrabold tracking-tight text-emerald-700"
                                                                    >
                                                                        ${grandTotal.toFixed(2)}
                                                                    </motion.p>
                                                                </AnimatePresence>
                                                                <p className="text-xs font-semibold text-slate-500">{grandTotalKHR.toLocaleString()} ៛</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-3 border-t border-slate-100 bg-white px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCheckoutOpen(false)}
                                                        className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <motion.button
                                                        type="button"
                                                        disabled={!form.payment_methord}
                                                        onClick={InfoPaymentComplete}
                                                        whileHover={!form.payment_methord ? {} : { y: -2 }}
                                                        whileTap={!form.payment_methord ? {} : { scale: 0.97 }}
                                                        className="group relative flex flex-1 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                                                    >
                                                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full group-disabled:hidden" />
                                                        <span className="relative">
                                                            {!form.payment_methord ? "Select Payment Method" : "Continue to Payment"}
                                                        </span>
                                                        {form.payment_methord && (
                                                            <FiArrowRight size={16} className="relative transition-transform duration-300 group-hover:translate-x-1" />
                                                        )}
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}























                                        {/* STEP 2: Payment Confirmation */}
                                        {payment && (
                                            <motion.div
                                                key="step-2"
                                                initial={{ opacity: 0, x: 30 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 30 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex min-h-0 flex-1 flex-col"
                                            >
                                                <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
                                                    {/* Total due card */}
                                                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-600 p-5 text-white shadow-lg shadow-emerald-700/20">
                                                        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                                                        <div className="relative flex items-center justify-between">
                                                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                                                                ទឹកប្រាក់សរុបត្រូវបង់
                                                            </span>
                                                            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold">
                                                                {form.payment_methord === "Cash" ? <FiDollarSign size={12} /> : <FiCreditCard size={12} />}
                                                                {form.payment_methord === "Cash" ? "Cash" : "Bank"}
                                                            </span>
                                                        </div>
                                                        <p className="relative mt-2 text-4xl font-extrabold tracking-tight">${grandTotal.toFixed(2)}</p>
                                                        <div className="relative mt-3 flex items-center justify-between border-t border-dashed border-white/30 pt-3">
                                                            <span className="text-xs text-emerald-100">KHR (៛)</span>
                                                            <span className="text-lg font-bold">៛ {grandTotalKHR.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    {form.payment_methord === "Cash" ? (
                                    <div className="space-y-3.5">
                                        {/* កូដចាស់សម្រាប់ Cash របស់អ្នក */}
                                        <div className="space-y-1.5">
                                            <label className={labelCls}>ប្រាក់ទទួល (Cash Received USD)</label>
                                            {errMessage?.message && (
                                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 ring-1 ring-red-100">
                                                    {errMessage.message}
                                                </motion.div>
                                            )}
                                            <div className="relative">
                                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-lg font-bold text-slate-400">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name="paid_amount"
                                                    min={grandTotal}
                                                    value={form.paid_amount}
                                                    onChange={handleOnchange}
                                                    placeholder={grandTotal.toFixed(2)}
                                                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3.5 text-lg font-bold text-slate-800 shadow-sm transition-all hover:border-emerald-300 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                                                />
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {[grandTotal, 5, 10, 20, 50].map((amt, i) => (
                                                    <motion.button
                                                        key={i}
                                                        type="button"
                                                        whileTap={{ scale: 0.92 }}
                                                        onClick={() => handleOnchange({ target: { name: "paid_amount", value: Number(amt).toFixed(2) } })}
                                                        className="cursor-pointer rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-100"
                                                    >
                                                        {i === 0 ? "Exact" : `$${amt}`}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                                            <span className="text-sm font-semibold text-slate-600">ប្រាក់អាប់ (Change)</span>
                                            <div className="text-right leading-tight">
                                                <p className="text-2xl font-extrabold text-emerald-700">${changeAmount.toFixed(2)}</p>
                                                <p className="text-sm font-semibold text-slate-500">
                                                    {Math.round(changeAmount * exchangeRate).toLocaleString()} ៛
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* 👉 កន្លែងបង្ហាញ QR Code សម្រាប់ Bank-Payment (ABA KHQR) */
                                    <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl bg-amber-50 p-5 text-center ring-1 ring-amber-100">
                                        <FiCreditCard size={24} className="text-amber-500" />
                                        <p className="text-xs leading-relaxed text-amber-900">
                                            សូមស្កេន KHQR ខាងក្រោមដើម្បីបង់ប្រាក់ចំនួន{" "}
                                            <strong className="text-sm text-amber-950">${grandTotal.toFixed(2)}</strong>
                                        </p>

                                        {isGeneratingQr ? (
                                            <div className="py-10 text-sm font-medium text-slate-500 animate-pulse">កំពុងបង្កើត KHQR...</div>
                                        ) : qrData ? (
                                            <div className="flex flex-col items-center bg-white p-4 rounded-2xl shadow-sm space-y-2">
                                                {/* បញ្ជាក់៖ អ្នកត្រូវដំឡើង npm install qrcode.react និង import QRCodeCanvas មកប្រើប្រាស់ */}
                                                {/* <QRCodeCanvas value={qrData.qr_string} size={180} /> */}
                                                
                                                {/* បើមិនទាន់តំឡើងไลบรារี QR Code អាចបង្ហាញ String បណ្តោះអាសន្នសិន */}
                                                <div className="bg-slate-100 p-3 rounded-lg text-[10px] font-mono text-slate-600 break-all max-w-[220px] max-h-[80px] overflow-y-auto">
                                                    {qrData.qr_string}
                                                </div>

                                                <p className="text-xs font-bold text-emerald-600 animate-pulse pt-2">
                                                    ⏳ កំពុងរង់ចាំការស្កេនទូទាត់...
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                                                </div>

                                                <div className="flex shrink-0 items-center gap-3 border-t border-slate-100 bg-white px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPayment(false);
                                                            setInfoPayment(true);
                                                        }}
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                                    >
                                                        <FiArrowLeft size={15} />
                                                        Back
                                                    </button>
                                                    <motion.button
                                                        type="submit"
                                                        whileHover={{ y: -2 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        className="group relative flex flex-1 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30"
                                                    >
                                                        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                                        <FiCheck size={16} className="relative" />
                                                        <span className="relative">Confirm Payment</span>
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* STEP 3: Payment Success */}
                                        {PaymentSuccess && (
                                            <motion.div
                                                key="step-3"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center px-6 py-12 text-center"
                                            >
                                                <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
                                                    <motion.span
                                                        className="absolute inset-0 rounded-full bg-emerald-200"
                                                        initial={{ scale: 0.6, opacity: 0.8 }}
                                                        animate={{ scale: 1.6, opacity: 0 }}
                                                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                                                    />
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -90 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ type: "spring", stiffness: 260, damping: 16 }}
                                                        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-600/40"
                                                    >
                                                        <FiCheckCircle size={46} />
                                                    </motion.div>
                                                </div>

                                                <motion.h4
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="text-xl font-bold text-slate-800"
                                                >
                                                    ការទូទាត់ជោគជ័យ (Payment Successful)
                                                </motion.h4>

                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-5 py-3 ring-1 ring-slate-200"
                                                >
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Order</p>
                                                        <p className="font-mono text-sm font-bold text-slate-700">{orderNumber}</p>
                                                    </div>
                                                    <div className="h-8 w-px bg-slate-200" />
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
                                                        <p className="text-sm font-extrabold text-emerald-700">${grandTotal.toFixed(2)}</p>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </aside>
    );
}