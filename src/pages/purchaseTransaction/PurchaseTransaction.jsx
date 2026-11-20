import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PurchaseService } from '../../service/PurchaseService';
import { SupplierService } from '../../service/SupplierService';
import { IngredientService } from '../../service/IngredientService';
import { MdOutlineSaveAlt } from "react-icons/md";
import { IoMdAddCircleOutline } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";
import { TiArrowBackOutline } from "react-icons/ti";
import { FaRegEdit } from "react-icons/fa";

const initialDetailRow = {
    ingredients_id: "",
    unite: "",
    quantity: "",
    unit_price: "",
    total_price: 0
};

const generateInvoiceNumber = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `INV-${yyyy}${mm}${dd}-${random}`;
};

const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const initialFormState = {
    create_by: 1,
    sup_id: "",
    purchase_date: getTodayDateString(),
    invoice_number: generateInvoiceNumber(),
    discount: "0",
    status: "1",
    details: [
        { ...initialDetailRow }
    ]
};

const PurchaseTransaction = () => {
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [form, setForm] = useState(initialFormState);

    const { id } = useParams();
    const navigate = useNavigate();
    const IsEditMode = Boolean(id);

    useEffect(() => {
        fetchSuppliers();
        fetchIngredients();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await SupplierService.getAll({ per_page: -1 });
            const data = Array.isArray(res) ? res : (res?.data || []);
            setSuppliers(data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const fetchIngredients = async () => {
        try {
            const res = await IngredientService.getAll({ per_page: -1 });
            const data = Array.isArray(res) ? res : (res?.data || []);
            setIngredients(data);
        } catch (error) {
            console.error("Error fetching ingredients:", error);
        }
    };

    const fetchById = async () => {
        try {
            setLoading(true);
            const data = await PurchaseService.getById(id);
            if (data) {
                setForm({
                    create_by: data.create_by || 1,
                    sup_id: data.sup_id !== undefined && data.sup_id !== null ? String(data.sup_id) : "",
                    purchase_date: data.purchase_date || getTodayDateString(),
                    invoice_number: data.invoice_number || "",
                    discount: data.discount !== undefined && data.discount !== null ? String(data.discount) : "0",
                    status: data.status !== undefined && data.status !== null ? String(data.status) : "1",
                    details: data.details && data.details.length > 0
                        ? data.details.map((d) => ({
                            ingredients_id: d.ingredients_id ? String(d.ingredients_id) : "",
                            unite: d.unite || "",
                            quantity: d.quantity !== undefined && d.quantity !== null ? String(d.quantity) : "",
                            unit_price: d.unit_price !== undefined && d.unit_price !== null ? String(d.unit_price) : "",
                            total_price: Number(d.total_price) || (Number(d.quantity) * Number(d.unit_price)) || 0
                        }))
                        : [{ ...initialDetailRow }]
                });
            }
        } catch (error) {
            console.error("Error fetching purchase by ID:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (IsEditMode) {
            fetchById();
        }
    }, [id, IsEditMode]);

    const clear = () => {
        setForm({
            ...initialFormState,
            purchase_date: getTodayDateString(),
            invoice_number: generateInvoiceNumber(),
            details: [{ ...initialDetailRow }]
        });
    };

    // Calculate totals dynamically
    const totalAmount = form.details.reduce((sum, item) => {
        const lineTotal = Number(item.total_price) || 0;
        return sum + lineTotal;
    }, 0);

    const discountAmount = Number(form.discount) || 0;
    const grandTotal = Math.max(0, totalAmount - discountAmount);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDetailChange = (index, e) => {
        const { name, value } = e.target;
        const updatedDetails = [...form.details];
        const currentRow = { ...updatedDetails[index], [name]: value };

        // When ingredient is selected, auto-populate unit
        if (name === "ingredients_id") {
            const selectedIng = ingredients.find(
                (ing) => String(ing.id) === String(value)
            );
            if (selectedIng && selectedIng.unite) {
                currentRow.unite = selectedIng.unite;
            }
        }

        // Recalculate row total_price if quantity or unit_price changes
        const qty = name === "quantity" ? Number(value) : Number(currentRow.quantity);
        const price = name === "unit_price" ? Number(value) : Number(currentRow.unit_price);

        if (!isNaN(qty) && !isNaN(price)) {
            currentRow.total_price = Number((qty * price).toFixed(2));
        } else {
            currentRow.total_price = 0;
        }

        updatedDetails[index] = currentRow;
        setForm((prev) => ({ ...prev, details: updatedDetails }));
    };

    // Add new Detail row
    const addDetail = () => {
        setForm((prev) => ({
            ...prev,
            details: [
                ...prev.details,
                { ...initialDetailRow }
            ]
        }));
    };

    // Remove Detail row (at least 1 row must remain)
    const removeDetail = (index) => {
        if (form.details.length === 1) return;
        const updatedDetails = form.details.filter((_, i) => i !== index);
        setForm((prev) => ({ ...prev, details: updatedDetails }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.sup_id) {
            alert("Please select a Supplier");
            return;
        }

        if (!form.invoice_number.trim()) {
            alert("Please enter an Invoice Number");
            return;
        }

        // Validate each detail row
        for (let i = 0; i < form.details.length; i++) {
            const row = form.details[i];
            if (!row.ingredients_id) {
                alert(`Please select an Ingredient for Row #${i + 1}`);
                return;
            }
            if (!row.quantity || Number(row.quantity) <= 0) {
                alert(`Please enter a valid Quantity for Row #${i + 1}`);
                return;
            }
            if (!row.unite.trim()) {
                alert(`Please enter a Unit for Row #${i + 1}`);
                return;
            }
            if (row.unit_price === "" || Number(row.unit_price) < 0) {
                alert(`Please enter a valid Unit Price for Row #${i + 1}`);
                return;
            }
        }

        const payload = {
            create_by: Number(form.create_by) || 1,
            sup_id: Number(form.sup_id),
            purchase_date: form.purchase_date,
            invoice_number: form.invoice_number.trim(),
            total_amount: Number(totalAmount.toFixed(2)),
            discount: Number(discountAmount.toFixed(2)),
            grand_total: Number(grandTotal.toFixed(2)),
            status: Number(form.status),
            details: form.details.map((item) => ({
                ingredients_id: Number(item.ingredients_id),
                quantity: Number(item.quantity),
                unite: item.unite.trim(),
                unit_price: Number(item.unit_price),
                total_price: Number((Number(item.quantity) * Number(item.unit_price)).toFixed(2))
            }))
        };

        try {
            setLoading(true);
            if (IsEditMode) {
                await PurchaseService.update(id, payload);
                alert(`Purchase transaction updated successfully! (Invoice: ${payload.invoice_number})`);
            } else {
                await PurchaseService.create(payload);
                alert(`Purchase transaction created successfully! (Invoice: ${payload.invoice_number})`);
            }
            navigate('/purchaseTransaction');
        } catch (error) {
            console.error("Error saving purchase transaction:", error.response?.data || error);
            const err = error.response?.data?.error || error.response?.data?.message || "Failed to save purchase transaction.";
            alert(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm px-5 py-5">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-5 pb-3  border-gray-100">
                    <div>
                        <h1 className="text-gray-800 font-semibold text-xl">
                            {IsEditMode ? "Edit Purchase Transaction" : "Create Purchase Transaction"}
                        </h1>
                         
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/purchaseTransaction')}
                            className="cursor-pointer bg-green-700 hover:bg-green-800 px-4 py-1.5 flex gap-2 items-center rounded-sm text-white text-sm font-medium hover:scale-105 active:scale-95 duration-200"
                        >
                            <span className="text-lg">
                                <TiArrowBackOutline />
                            </span>
                            <span>Back to List</span>
                        </button>
                    </div>
                </div>

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* 1. Transaction Master Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/60 p-4 rounded-xl border border-gray-200">
                        {/* Supplier */}
                        <div>
                            <label htmlFor="sup_id" className="text-sm font-semibold text-gray-700 block mb-1">
                                Supplier <span className="text-rose-500">*</span>
                            </label>
                            <select
                                name="sup_id"
                                id="sup_id"
                                value={form.sup_id}
                                onChange={handleInput}
                                required
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                            >
                                <option value="" disabled>Select Supplier...</option>
                                {suppliers.map((sup, index) => (
                                    <option key={sup.id} value={sup.id}>
                                        {index + 1} - {sup.name} {sup.phone ? `(${sup.phone})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Purchase Date */}
                        <div>
                            <label htmlFor="purchase_date" className="text-sm font-semibold text-gray-700 block mb-1">
                                Purchase Date <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="purchase_date"
                                id="purchase_date"
                                value={form.purchase_date}
                                onChange={handleInput}
                                required
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400"
                            />
                        </div>

                        {/* Invoice Number */}
                        <div>
                            <label htmlFor="invoice_number" className="text-sm font-semibold text-gray-700 block mb-1">
                                Invoice Number <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="invoice_number"
                                id="invoice_number"
                                value={form.invoice_number}
                                onChange={handleInput}
                                placeholder="e.g. INV-2026-001"
                                required
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="text-sm font-semibold text-gray-700 block mb-1">
                                Status
                            </label>
                            <select
                                name="status"
                                id="status"
                                value={form.status}
                                onChange={handleInput}
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                            >
                                <option value="1">Completed (Active)</option>
                                <option value="0">Pending (Draft)</option>
                            </select>
                        </div>
                    </div>

                    {/* 2. Details (Ingredient items) Section */}
                    <div className="border border-gray-200 bg-gray-50/50 p-4 rounded-xl space-y-4 shadow-xs">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">
                                    Purchase Details ({form.details.length} {form.details.length === 1 ? 'item' : 'items'})
                                </h3>
                                
                            </div>

                            <button
                                type="button"
                                onClick={addDetail}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-sm shadow-sm transition-all duration-200 cursor-pointer"
                            >
                                <span className="text-base leading-none">
                                    <IoMdAddCircleOutline />
                                </span>
                                <span>Add Ingredient</span>
                            </button>
                        </div>

                        {/* Dynamic Item Rows */}
                        <div className="space-y-3">
                            {form.details.map((detail, index) => (
                                <div
                                    key={index}
                                    className="relative flex flex-col md:flex-row items-start md:items-center gap-3 bg-white p-4 border border-gray-200 rounded-lg shadow-xs hover:border-emerald-300 transition-all duration-200"
                                >
                                    {/* Row Index Badge */}
                                    <span className="absolute -top-2.5 left-3 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                        Item #{index + 1}
                                    </span>

                                    {/* Ingredient Select */}
                                    <div className="w-full md:flex-[2.5] pt-1 md:pt-0">
                                        <label className="text-xs font-medium text-gray-600 block mb-1">
                                            Ingredient <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            name="ingredients_id"
                                            value={detail.ingredients_id}
                                            onChange={(e) => handleDetailChange(index, e)}
                                            required
                                            className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50/50 border border-gray-300 rounded-md outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                                        >
                                            <option value="" disabled>Select Ingredient...</option>
                                            {ingredients.map((ing, ingIdx) => (
                                                <option key={ing.id} value={ing.id}>
                                                    {ingIdx + 1} - {ing.name} {ing.unite ? `(${ing.unite})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Unit Input */}
                                    <div className="w-full md:flex-1">
                                        <label className="text-xs font-medium text-gray-600 block mb-1">
                                            Unit <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="unite"
                                            value={detail.unite}
                                            onChange={(e) => handleDetailChange(index, e)}
                                            placeholder="e.g. g, ml, kg"
                                            required
                                            className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50/50 border border-gray-300 rounded-md outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                                        />
                                    </div>

                                    {/* Quantity Input */}
                                    <div className="w-full md:flex-1">
                                        <label className="text-xs font-medium text-gray-600 block mb-1">
                                            Quantity <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            name="quantity"
                                            value={detail.quantity}
                                            onChange={(e) => handleDetailChange(index, e)}
                                            placeholder="e.g. 10"
                                            required
                                            className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50/50 border border-gray-300 rounded-md outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                                        />
                                    </div>

                                    {/* Unit Price Input */}
                                    <div className="w-full md:flex-1">
                                        <label className="text-xs font-medium text-gray-600 block mb-1">
                                            Unit Price ($) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="unit_price"
                                            value={detail.unit_price}
                                            onChange={(e) => handleDetailChange(index, e)}
                                            placeholder="e.g. 3.00"
                                            required
                                            className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50/50 border border-gray-300 rounded-md outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                                        />
                                    </div>

                                    {/* Total Price (Computed) */}
                                    <div className="w-full md:flex-1">
                                        <label className="text-xs font-medium text-gray-600 block mb-1">
                                            Total Price ($)
                                        </label>
                                        <div className="px-3 py-2 text-sm text-gray-900 bg-gray-100 border border-gray-200 rounded-md font-semibold">
                                            ${Number(detail.total_price || 0).toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    {form.details.length > 1 && (
                                        <div className="w-full md:w-auto flex justify-end md:pt-5">
                                            <button
                                                type="button"
                                                onClick={() => removeDetail(index)}
                                                className="flex items-center justify-center w-9 h-9 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-200 rounded-md transition-all duration-200 cursor-pointer shadow-2xs"
                                                title="Delete Row"
                                            >
                                                <RiDeleteBinLine className="text-base" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Summary & Financial Calculation Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                        {/* Discount Input */}
                        <div className="w-full sm:w-64">
                            <label htmlFor="discount" className="text-sm font-semibold text-gray-700 block mb-1">
                                Discount ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="discount"
                                id="discount"
                                value={form.discount}
                                onChange={handleInput}
                                placeholder="0.00"
                                className="w-full px-3.5 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400"
                            />
                        </div>

                        {/* Totals Badge */}
                        <div className="flex flex-wrap items-center gap-6 self-end sm:self-auto">
                            <div className="text-right">
                                <span className="text-xs text-gray-500 block">Total Amount</span>
                                <span className="text-lg font-bold text-gray-800">
                                    ${totalAmount.toFixed(2)}
                                </span>
                            </div>

                            <div className="text-right">
                                <span className="text-xs text-gray-500 block">Discount</span>
                                <span className="text-lg font-bold text-rose-600">
                                    -${discountAmount.toFixed(2)}
                                </span>
                            </div>

                            <div className="text-right pl-3 border-l border-gray-300">
                                <span className="text-xs text-gray-500 block uppercase font-semibold">Grand Total</span>
                                <span className="text-2xl font-extrabold text-emerald-700">
                                    ${grandTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Action Buttons */}
                    <div className="pt-2 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center min-w-[150px] px-6 py-2.5 bg-green-700 hover:bg-green-800 active:bg-blue-800 text-white font-medium text-sm rounded-sm shadow-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>{IsEditMode ? "Updating..." : "Saving..."}</span>
                                </div>
                            ) : IsEditMode ? (
                                <div className="flex items-center gap-2">
                                    <span>Update Purchase</span>
                                    <FaRegEdit className="text-base" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>Save Purchase</span>
                                    <MdOutlineSaveAlt className="text-base" />
                                </div>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/purchaseTransaction')}
                            disabled={loading}
                            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium text-sm rounded-sm hover:bg-gray-50 transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
};

export default PurchaseTransaction;
