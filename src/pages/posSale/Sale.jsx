import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MdClear } from "react-icons/md";
import { IoSearchOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { FiGrid, FiCoffee } from "react-icons/fi";
import { CategoryService } from '../../service/CategoryService';
import { CoffeeService } from '../../service/CoffeeService';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../stores/cartSlice';
import Cart from './Cart';
import { motion, AnimatePresence } from "framer-motion";
import { TiArrowBackOutline } from "react-icons/ti";
import {  FiX, FiMinus, FiPlus, FiShoppingCart, FiCheck } from "react-icons/fi";
import { useNavigate } from 'react-router-dom';

const SUGAR_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const IMAGE_BASE_URL = "http://127.0.0.1:8000/storage/";

const Sale = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // --- State Management ---
    const [coffeeData, setCoffeeData] = useState([]);
    const [category, setCategory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Modal State
    const [modal, setModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedSugar, setSelectedSugar] = useState(100);

    // Refs
    const observer = useRef(null);
    const categoryContainerRef = useRef(null);
    const isFetchingRef = useRef(false);

    // --- Price Helper ---
    const getCoffeeDisplayPrice = (coffee) => {
        if (coffee.variants && coffee.variants.length > 0) {
            const prices = coffee.variants
                .map((v) => Number(v.price) || 0)
                .filter((p) => p > 0);
            if (prices.length === 1) return `$${prices[0].toFixed(2)}`;
            if (prices.length > 1) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
            }
        }
        return coffee.price ? `$${Number(coffee.price).toFixed(2)}` : '$0.00';
    };

    // --- មុខងារពិនិត្យមើលថាតើ Variant មួយអស់គ្រឿងផ្សំ (qty_stock <= min_stock) ឬទេ ---
    const isVariantOutOfStock = (variant) => {
        const ingredients = variant?.coffee_ingredients || variant?.coffeeIngredients || [];
        if (!ingredients || ingredients.length === 0) return false;

        // បើមានគ្រឿងផ្សំណាមួយដែល qty_stock <= min_stock ឬ qty_stock <= 0
        return ingredients.some((ci) => {
            const ing = ci.ingredient;
            if (!ing) return false;
            const currentStock = Number(ing.qty_stock) || 0;
            const minStock = (ing.min_stock !== null && ing.min_stock !== undefined) ? Number(ing.min_stock) : 0;

            return currentStock <= 0 || currentStock <= minStock;
        });
    };

    // --- មុខងារពិនិត្យមើលថាតើ Product កាហ្វេទាំងមូលអស់ស្តុកឬទេ ---
    const isProductOutOfStock = (coffee) => {
        const variants = coffee?.variants || [];
        if (variants.length === 0) return false;

        // ប្រសិនបើគ្រប់ Variants ទាំងអស់សុទ្ធតែអស់គ្រឿងផ្សំ នោះផលិតផលទាំងមូលគឺ Out of Stock
        return variants.every((v) => isVariantOutOfStock(v));
    };

    // --- Modal Handlers ---
    const openModal = (item) => {
        setSelectedProduct(item);
        if (Array.isArray(item.variants) && item.variants.length > 0) {
            setSelectedVariant(item.variants[0]);
        } else {
            setSelectedVariant(null);
        }
        setQuantity(1);
        setSelectedSugar(100);
        setModal(true);
    };

    const closeModal = () => {
        setModal(false);
        setSelectedProduct(null);
        setSelectedVariant(null);
        setQuantity(1);
        setSelectedSugar(100);
    };

    const handleConfirmAddToCart = () => {
        if (!selectedProduct) return;

        const hasVariants = Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0;
        const variant = selectedVariant || (hasVariants ? selectedProduct.variants[0] : null);
        const unitPrice = variant ? Number(variant.price || 0) : Number(selectedProduct.price || 0);
        const currentQty = Math.max(1, Number(quantity) || 1);

        const discountPercentage = Number(selectedProduct.discound_item || 0);
        const taxPercentage = Number(selectedProduct.tax_item || 0);

        const itemTotal = unitPrice * currentQty;
        // គណនាទឹកប្រាក់បញ្ចុះតម្លៃ (Discount Amount)
        const discountAmount = (itemTotal * discountPercentage) / 100;
        const afterDiscount = itemTotal - discountAmount;

        // គណនាពន្ធ (Tax Amount) ផ្អែកលើតម្លៃក្រោយបញ្ចុះតម្លៃ
        const taxAmount = (afterDiscount * taxPercentage) / 100;

        // ទឹកប្រាក់សរុបចុងក្រោយ
        const finalSubTotal = Number((afterDiscount + taxAmount).toFixed(2));

        const cartItem = {
            id: selectedProduct.id,
            name: selectedProduct.name,
            discound_item: discountPercentage,
            tax_item: taxPercentage,
            discount_amount: Number(discountAmount.toFixed(2)),
            tax_amount: Number(taxAmount.toFixed(2)),
            rawTotal: Number(itemTotal.toFixed(2)),
            image: selectedProduct.image,
            CoffeeVariantId: variant ? variant.id : null,
            coffee_variant_id: variant ? variant.id : null,
            variantName: variant ? (variant.name || variant.size || 'Default') : 'Regular',
            sugar_percent: selectedSugar,
            UnitPrice: unitPrice,
            price: unitPrice,
            qty: currentQty,
            Quantity: currentQty,
            SubTotal: finalSubTotal,
        };

        console.log("Variant ID ដែលបានរើស:", cartItem.CoffeeVariantId);
        console.log("ទិន្នន័យ Cart Item ទាំងមូល:", cartItem);

        dispatch(addToCart(cartItem));
        closeModal();
    };

    // --- Category Scroll ---
    const scrollCategoryLeft = () => {
        if (categoryContainerRef.current) {
            categoryContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollCategoryRight = () => {
        if (categoryContainerRef.current) {
            categoryContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    // --- API Calls ---
    const fetchCoffee = async (page = 1, searchVal = searchTerm, isReset = false, catId = selectedCategoryId) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const res = await CoffeeService.getAll(page, 10, searchVal, catId);
            let newItems = [];
            let lastPage = 1;

            if (res && res.data) {
                newItems = Array.isArray(res.data) ? res.data : (res.data.data || []);
                lastPage = Number(res.last_page || (res.data.last_page || 1));
            } else if (Array.isArray(res)) {
                newItems = res;
            }

            setCoffeeData((prev) => (isReset || page === 1 ? newItems : [...prev, ...newItems]));
            setHasMore(page < lastPage && newItems.length > 0);
            setCurrentPage(page);
        } catch (error) {
            console.error("Error fetching coffee data:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isFetchingRef.current = false;
        }
    };

    // Infinite Scroll Intersection Callback
    const lastElementRef = useCallback(
        (node) => {
            if (loading || loadingMore) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
                    const nextPage = currentPage + 1;
                    fetchCoffee(nextPage, searchTerm, false, selectedCategoryId);
                }
            });

            if (node) observer.current.observe(node);
        },
        [loading, loadingMore, hasMore, currentPage, searchTerm, selectedCategoryId]
    );

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    // Lock body scroll when modal is open
    useEffect(() => {
        if (modal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [modal]);

    // --- Effects ---
    useEffect(() => {
        let isMounted = true;
        const loadCategories = async () => {
            try {
                const res = await CategoryService.getAll(1, 999999);
                const list = Array.isArray(res) ? res : (res?.data || []);
                if (isMounted) {
                    setCategory(list);
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };

        loadCategories();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const delayTimer = setTimeout(() => {
            setCurrentPage(1);
            fetchCoffee(1, searchTerm, true, selectedCategoryId);
        }, 350);

        return () => clearTimeout(delayTimer);
    }, [searchTerm, selectedCategoryId]);

    // Current price calculation for modal (including item discount and tax)
    const modalUnitPrice = selectedVariant
        ? Number(selectedVariant.price || 0)
        : Number(selectedProduct?.price || 0);
        
    const isDiscountValid = selectedProduct?.discound?.end_date 
        ? new Date(selectedProduct.discound.end_date) >= new Date()
        : true; // បើគ្មានដាក់ថ្ងៃផុតកំណត់ទេ ចាត់ទុកថាប្រើបានជានិច្ច

    const modalDiscountPct = isDiscountValid ? Number(selectedProduct?.discound_item || 0) : 0;
    const modalTaxPct = Number(selectedProduct?.tax_item || 0);
    const modalRawTotal = modalUnitPrice * quantity;
    const modalDiscAmt = (modalRawTotal * modalDiscountPct) / 100;
    const modalAfterDisc = modalRawTotal - modalDiscAmt;
    const modalTaxAmt = (modalAfterDisc * modalTaxPct) / 100;
    const modalFinalTotal = Number((modalAfterDisc + modalTaxAmt).toFixed(2));

    // ===================For Responsive 
    const [cartOpen, setCartOpen] = useState(false);

    // Lock background scroll while the drawer is open on mobile
    useEffect(() => {
        document.body.style.overflow = cartOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [cartOpen]);

    // Optional: close the drawer with Escape
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setCartOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className="min-h-dvh bg-slate-50 font-sans">
            <div className="flex items-start">
                {/* Main Content Area */}
                <div className="flex-1 min-w-0 bg-white lg:border-r lg:border-slate-200">
                    {/* Sticky Header: Search Bar & Categories */}
                    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-xs">

                        {/* 1. Search Bar Row */}
                        <div className="w-full p-3 sm:p-4">
                            <div className="group relative flex items-center gap-2">
                                <div className='z-90'>
                                    <div
                                        onClick={() => navigate("/")}
                                        className="cursor-pointer bg-green-700 px-4 py-2 flex gap-2 items-center rounded-sm text-white font-medium hover:scale-110 duration-400"
                                    >
                                        <span className="text-lg"><TiArrowBackOutline /></span>
                                        <span>Back</span>
                                    </div>
                                </div>
                                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 opacity-0 blur-sm transition-opacity duration-300 group-focus-within:opacity-40" />

                                <div className="relative flex w-full items-center rounded-xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-md group-focus-within:border-emerald-500 group-focus-within:shadow-lg group-focus-within:shadow-emerald-500/10">
                                    <IoSearchOutline
                                        size={19}
                                        className="pointer-events-none absolute left-3.5 text-slate-400 transition-all duration-300 group-focus-within:text-emerald-600 group-focus-within:scale-110"
                                    />

                                    {/* text-base on mobile prevents iOS zoom on focus */}
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search coffee or variant..."
                                        className="w-full h-11 bg-transparent text-base sm:text-sm text-slate-800 placeholder:text-slate-400 pl-11 pr-11 rounded-xl focus:outline-none"
                                    />

                                    <AnimatePresence>
                                        {searchTerm && (
                                            <motion.button
                                                type="button"
                                                onClick={handleClearSearch}
                                                title="Clear search"
                                                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.85 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 cursor-pointer transition-colors"
                                            >
                                                <MdClear size={16} />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* 2. Categories Row */}
                        <div className="px-3 sm:px-4 pb-3 flex items-center gap-2 sm:gap-2.5 w-full">
                            {/* Scroll Left (hidden on mobile, swipe instead) */}
                            <motion.button
                                type="button"
                                onClick={scrollCategoryLeft}
                                title="Scroll Left"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.88 }}
                                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm hover:text-emerald-700 hover:border-emerald-300 hover:shadow-md cursor-pointer shrink-0 transition-colors"
                            >
                                <IoChevronBack size={18} />
                            </motion.button>

                            <div className="relative flex-1 min-w-0">
                                <div
                                    ref={categoryContainerRef}
                                    className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scroll-smooth snap-x py-2 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                >
                                    {/* All */}
                                    <motion.button
                                        type="button"
                                        onClick={() => setSelectedCategoryId(null)}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.94 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                        className={`group snap-start shrink-0 whitespace-nowrap flex items-center gap-2 sm:gap-2.5 h-11 sm:h-12 pl-1.5 pr-3.5 sm:pr-4 rounded-full cursor-pointer transition-all duration-300 ${
                                            selectedCategoryId === null
                                                ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30"
                                                : "bg-white border border-slate-200 text-slate-600 shadow-sm hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                                                selectedCategoryId === null
                                                    ? "bg-white/20 text-white"
                                                    : "bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                                            }`}
                                        >
                                            <FiGrid size={16} />
                                        </span>
                                        <span className="text-sm font-semibold">All</span>
                                    </motion.button>

                                    {/* Category List */}
                                    {category.map((item) => {
                                        const isSelected = selectedCategoryId === item.id;
                                        return (
                                            <motion.button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setSelectedCategoryId((prev) => (prev === item.id ? null : item.id))}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.94 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                className={`group snap-start shrink-0 whitespace-nowrap flex items-center gap-2 sm:gap-2.5 h-11 sm:h-12 pl-1.5 pr-3.5 sm:pr-4 rounded-full cursor-pointer transition-all duration-300 ${
                                                    isSelected
                                                        ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30"
                                                        : "bg-white border border-slate-200 text-slate-600 shadow-sm hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md"
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full overflow-hidden transition-colors duration-300 ${
                                                        isSelected ? "bg-white/20" : "bg-slate-100 group-hover:bg-emerald-50"
                                                    }`}
                                                >
                                                    {item.image ? (
                                                        <img
                                                            src={item.image.startsWith("http") ? item.image : `${IMAGE_BASE_URL}${item.image}`}
                                                            alt={item.name}
                                                            className="w-5 h-5 object-contain transition-transform duration-300 group-hover:scale-110"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = "none";
                                                            }}
                                                        />
                                                    ) : (
                                                        <FiCoffee
                                                            size={16}
                                                            className={isSelected ? "text-white" : "text-slate-400 group-hover:text-emerald-600"}
                                                        />
                                                    )}
                                                </span>
                                                <span className="text-sm font-semibold truncate max-w-[96px] sm:max-w-[110px]">{item.name}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                <div className="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-6 bg-gradient-to-r from-white to-transparent" />
                                <div className="pointer-events-none absolute inset-y-0 right-0 w-4 sm:w-6 bg-gradient-to-l from-white to-transparent" />
                            </div>

                            {/* Scroll Right */}
                            <motion.button
                                type="button"
                                onClick={scrollCategoryRight}
                                title="Scroll Right"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.88 }}
                                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm hover:text-emerald-700 hover:border-emerald-300 hover:shadow-md cursor-pointer shrink-0 transition-colors"
                            >
                                <IoChevronForward size={18} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Products Grid (pb-28 on mobile leaves room for the floating cart button) */}
                    <div className="relative min-h-[400px] p-3 sm:p-4 pb-28 lg:pb-4">
                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="rounded-2xl border border-slate-100 bg-white p-2.5 sm:p-3 animate-pulse">
                                        <div className="aspect-square w-full rounded-xl bg-slate-100 mb-3" />
                                        <div className="h-3.5 w-3/4 rounded bg-slate-100 mb-2" />
                                        <div className="flex items-center justify-between">
                                            <div className="h-3.5 w-1/3 rounded bg-slate-100" />
                                            <div className="h-9 w-9 rounded-full bg-slate-100" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : coffeeData.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                                {coffeeData.map((item, index) => {
                                    const isLastItem = index === coffeeData.length - 1;
                                    const displayPrice = getCoffeeDisplayPrice(item);
                                    
                                    // 👉 ពិនិត្យថាតើផលិតផលនេះអស់ស្តុកឬទេ
                                    const isOutOfStock = isProductOutOfStock(item);

                                    return (
                                        <motion.div
                                            key={`${item.id}-${index}`}
                                            ref={isLastItem ? lastElementRef : null}
                                            // 👉 បើអស់ស្តុក មិនឱ្យបើក Modal ទិញឡើយ
                                            onClick={() => {
                                                if (!isOutOfStock) {
                                                    openModal(item);
                                                }
                                            }}
                                            initial={{ opacity: 0, y: 24 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, ease: "easeOut", delay: (index % 10) * 0.04 }}
                                            whileHover={!isOutOfStock ? { y: -6 } : {}}
                                            whileTap={!isOutOfStock ? { scale: 0.97 } : {}}
                                            // 👉 ប្ដូរ Style ទៅជាពណ៌ក្រហម និង cursor-not-allowed
                                            className={`group relative flex flex-col overflow-hidden rounded-2xl border p-2.5 sm:p-3 shadow-sm transition-all duration-300 ${
                                                isOutOfStock
                                                    ? "border-red-400 bg-red-50/50 cursor-not-allowed opacity-80"
                                                    : "border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/10 cursor-pointer"
                                            }`}
                                        >
                                            {/* Image */}
                                            <div className={`relative aspect-square w-full overflow-hidden rounded-xl mb-2.5 sm:mb-3 ${
                                                isOutOfStock ? "bg-red-100/40" : "bg-gradient-to-br from-emerald-50 via-white to-teal-50"
                                            }`}>
                                                {item.image ? (
                                                    <img
                                                        src={item.image.startsWith("http") ? item.image : `${IMAGE_BASE_URL}${item.image}`}
                                                        alt={item.name}
                                                        loading="lazy"
                                                        className={`relative h-full w-full object-contain p-2 sm:p-3 drop-shadow-md transition-transform duration-500 ease-out ${
                                                            isOutOfStock ? "grayscale-[60%]" : "group-hover:scale-110 group-hover:-rotate-3"
                                                        }`}
                                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                    />
                                                ) : (
                                                    <div className="relative flex h-full w-full flex-col items-center justify-center gap-1 text-slate-300">
                                                        <FiCoffee size={28} />
                                                        <span className="text-[11px] font-semibold">No Image</span>
                                                    </div>
                                                )}

                                                {/* 👉 ស្លាកពណ៌ក្រហម (Out of Stock Badge) */}
                                                {isOutOfStock ? (
                                                    <span className="absolute top-2 right-2 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md animate-pulse">
                                                        អស់ស្តុក
                                                    </span>
                                                ) : item.discound && 
                                                    item.discound_item > 0 && 
                                                    (!item.discound.end_date || new Date(item.discound.end_date) >= new Date()) ? (
                                                    <span className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md shadow-rose-500/30">
                                                        -{item.discound.qty_percent || item.discound_item}%
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* Details */}
                                            <div className="flex flex-1 flex-col gap-2">
                                                <h3
                                                    className={`truncate text-sm font-semibold transition-colors ${
                                                        isOutOfStock ? "text-red-700" : "text-slate-800 group-hover:text-emerald-700"
                                                    }`}
                                                    title={item.name}
                                                >
                                                    {item.name}
                                                </h3>

                                                <div className="mt-auto flex items-center justify-between gap-1.5 sm:gap-2">
                                                    <p className={`min-w-0 truncate rounded-full px-2 sm:px-2.5 py-1 text-xs font-bold ${
                                                        isOutOfStock ? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-700"
                                                    }`}>
                                                        {displayPrice}
                                                    </p>

                                                    {/* 👉 ប៊ូតុង (+) បើអស់ស្តុកនឹងប្រែជាពណ៌ប្រផេះ/ក្រហម និងមិនដំណើរការ */}
                                                    <motion.button
                                                        type="button"
                                                        aria-label={`Add ${item.name} to cart`}
                                                        disabled={isOutOfStock}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!isOutOfStock) openModal(item);
                                                        }}
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-all ${
                                                            isOutOfStock
                                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                                                                : "bg-gradient-to-br from-emerald-600 to-teal-500 shadow-emerald-600/30 cursor-pointer hover:scale-110"
                                                        }`}
                                                    >
                                                        <FiPlus size={18} />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center px-4 py-20 sm:py-24 text-center">
                                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-300 ring-8 ring-emerald-50/50">
                                    <FiCoffee size={36} />
                                </div>
                                <p className="text-sm font-semibold text-slate-500">រកមិនឃើញទិន្នន័យកាហ្វេទេ (No coffees found)</p>
                                <p className="mt-1 text-xs text-slate-400">Try a different search or category</p>
                            </div>
                        )}

                        {loadingMore && (
                            <div className="flex justify-center items-center py-6 gap-2.5">
                                <div className="h-5 w-5 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
                                <span className="text-xs font-medium text-slate-500 animate-pulse">កំពុងទាញទិន្នន័យបន្ថែម...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile/Tablet: cart drawer backdrop */}
                <AnimatePresence>
                    {cartOpen && (
                        <motion.div
                            key="cart-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setCartOpen(false)}
                            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Cart: drawer below lg | fixed sidebar on lg+ */}
                <aside
                    className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-[400px] flex-col bg-white shadow-2xl
                                transition-transform duration-300 ease-out
                                ${cartOpen ? "translate-x-0" : "translate-x-full"}
                                lg:sticky lg:top-0 lg:z-auto lg:w-[360px] xl:w-[400px] lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none`}
                >
                    {/* Close bar (only below lg) */}
                    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 lg:hidden">
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                            <FiShoppingCart size={16} className="text-emerald-600" />
                            Cart
                        </span>
                        <button
                            type="button"
                            onClick={() => setCartOpen(false)}
                            aria-label="Close cart"
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                        >
                            <FiX size={18} />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1">
                        <Cart />
                    </div>
                </aside>

                {/* Floating cart button (only below lg) */}
                <AnimatePresence>
                    {!cartOpen && (
                        <motion.button
                            key="cart-fab"
                            type="button"
                            onClick={() => setCartOpen(true)}
                            aria-label="Open cart"
                            initial={{ opacity: 0, scale: 0.6, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.6, y: 20 }}
                            whileTap={{ scale: 0.9 }}
                            className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/40 lg:hidden"
                        >
                            <FiShoppingCart size={22} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Customization Modal */}
            {createPortal(
                <AnimatePresence>
                    {modal && selectedProduct && (
                        <motion.div
                            key="coffee-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) closeModal();
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 60, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 40, scale: 0.97 }}
                                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                className="flex max-h-[92dvh] w-full sm:max-w-md flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl"
                            >
                                {/* Hero header */}
                                <div className="relative shrink-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 px-4 sm:px-5 pb-4 sm:pb-5 pt-4 sm:pt-5 text-white">
                                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                                    <div className="pointer-events-none absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-white/10" />

                                    <motion.button
                                        type="button"
                                        onClick={closeModal}
                                        aria-label="Close"
                                        whileHover={{ rotate: 90, scale: 1.1 }}
                                        whileTap={{ scale: 0.85 }}
                                        className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
                                    >
                                        <FiX size={16} />
                                    </motion.button>

                                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-emerald-100">
                                        ជ្រើសរើសជម្រើស
                                    </p>

                                    <div className="relative flex items-center gap-3 sm:gap-4 pr-8">
                                        <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-4 ring-white/30">
                                            {selectedProduct.image ? (
                                                <img
                                                    src={selectedProduct.image.startsWith("http") ? selectedProduct.image : `${IMAGE_BASE_URL}${selectedProduct.image}`}
                                                    alt={selectedProduct.name}
                                                    className="h-full w-full object-contain p-1.5"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <FiCoffee size={28} className="text-slate-300" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="truncate text-base sm:text-lg font-bold leading-tight">{selectedProduct.name}</h3>
                                            <p className="mt-0.5 text-xl sm:text-2xl font-extrabold">${modalUnitPrice.toFixed(2)}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                {modalDiscountPct > 0 && (
                                                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold shadow">
                                                        -{modalDiscountPct}% Off
                                                    </span>
                                                )}
                                                {modalTaxPct > 0 && (
                                                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                                                        +Tax {modalTaxPct}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable body */}
                                <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 sm:py-5">
                                    {/* Quantity */}
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            ចំនួន / Quantity
                                        </label>
                                        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-200">
                                            <div className="flex items-center gap-1">
                                                <motion.button
                                                    type="button"
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
                                                >
                                                    <FiMinus size={16} />
                                                </motion.button>

                                                <div className="relative h-10 w-12 overflow-hidden">
                                                    <AnimatePresence mode="popLayout" initial={false}>
                                                        <motion.span
                                                            key={quantity}
                                                            initial={{ y: 16, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            exit={{ y: -16, opacity: 0 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute inset-0 flex items-center justify-center text-base font-bold text-slate-800"
                                                        >
                                                            {quantity}
                                                        </motion.span>
                                                    </AnimatePresence>
                                                </div>

                                                <motion.button
                                                    type="button"
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={() => setQuantity((prev) => prev + 1)}
                                                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/30"
                                                >
                                                    <FiPlus size={16} />
                                                </motion.button>
                                            </div>

                                            <div className="pr-2 text-right">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-400">តម្លៃដើម</p>
                                                <p className="text-sm font-bold text-slate-600">${modalRawTotal.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variants: 2 columns on very small screens */}
                                    {Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 && (
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                ទំហំ / Variants
                                            </label>
                                            <div className="grid grid-cols-2 min-[400px]:grid-cols-3 gap-2.5">
                                                {selectedProduct.variants.map((v) => {
                                                    const isSelected = selectedVariant?.id === v.id;
                                                    const isVariantDisabled = isVariantOutOfStock(v); // 👉 ឆែកស្តុក variant នីមួយៗ

                                                    return (
                                                        <motion.button
                                                            key={v.id}
                                                            type="button"
                                                            disabled={isVariantDisabled}
                                                            onClick={() => !isVariantDisabled && setSelectedVariant(v)}
                                                            className={`relative rounded-2xl border-2 px-2 py-2.5 text-center transition-colors duration-200 ${
                                                                isVariantDisabled
                                                                    ? "border-red-200 bg-red-50/60 text-red-400 cursor-not-allowed opacity-60"
                                                                    : isSelected
                                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md shadow-emerald-600/10 cursor-pointer"
                                                                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 cursor-pointer"
                                                            }`}
                                                        >
                                                            {isVariantDisabled && (
                                                                <span className="text-[9px] font-bold text-red-600 block">
                                                                    (អស់ស្តុក)
                                                                </span>
                                                            )}
                                                            <div className="truncate text-xs font-semibold">{v.name || v.size}</div>
                                                            <div className="mt-0.5 text-[11px] font-bold">
                                                                ${Number(v.price || 0).toFixed(2)}
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sugar: 3 columns on small screens, 6 on larger */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                កម្រិតជាតិស្ករ / Sugar Level
                                            </label>
                                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                                {selectedSugar}%
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 min-[400px]:grid-cols-6 gap-1.5 rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200">
                                            {SUGAR_OPTIONS.map((sugar) => {
                                                const isSelected = selectedSugar === sugar;
                                                return (
                                                    <button
                                                        key={sugar}
                                                        type="button"
                                                        onClick={() => setSelectedSugar(sugar)}
                                                        className={`relative cursor-pointer rounded-xl py-2.5 text-xs font-semibold transition-colors duration-200 ${
                                                            isSelected ? "text-white" : "text-slate-500 hover:text-emerald-700"
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <motion.span
                                                                layoutId="sugar-pill"
                                                                className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-md shadow-emerald-600/30"
                                                                transition={{ type: "spring", stiffness: 450, damping: 34 }}
                                                            />
                                                        )}
                                                        <span className="relative">{sugar}%</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer (respects iPhone safe-area) */}
                                <div className="flex shrink-0 items-center gap-2 sm:gap-3 border-t border-slate-100 bg-white px-4 sm:px-5 pt-3 sm:pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="cursor-pointer rounded-xl px-3 sm:px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                    >
                                        Cancel
                                    </button>

                                    <motion.button
                                        type="button"
                                        disabled={modalFinalTotal == 0}
                                        onClick={handleConfirmAddToCart}
                                        whileHover={modalFinalTotal == 0 ? {} : { y: -2 }}
                                        whileTap={modalFinalTotal == 0 ? {} : { scale: 0.96 }}
                                        className="flex flex-1 cursor-pointer items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                                    >
                                        <span className="flex items-center gap-2">
                                            <FiShoppingCart size={16} />
                                            Confirm
                                        </span>
                                        <span className="rounded-lg bg-white/20 px-2.5 py-0.5">
                                            ${modalFinalTotal.toFixed(2)}
                                        </span>
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default Sale;
