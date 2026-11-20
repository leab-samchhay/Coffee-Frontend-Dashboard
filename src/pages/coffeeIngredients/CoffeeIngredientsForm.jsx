import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CoffeeVariantService } from '../../service/CoffeeVariantService';
import { IngredientService } from '../../service/IngredientService';
import { CoffeeIngredientsService } from '../../service/CoffeeIngredientsService';
import { TiArrowBackOutline } from "react-icons/ti";
import { MdOutlineSaveAlt } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { IoMdAddCircleOutline } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";

const initialRow = {
    ingredients_id: "",
    unite: "",
    quantity: ""
};

const CoffeeIngredientsForm = () => {
    const [CoffeeVariant, setCoffeeVariant] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const IsEditMode = Boolean(id);

    const [coffeeVariantId, setCoffeeVariantId] = useState("");
    const [items, setItems] = useState([initialRow]);

    useEffect(() => {
        fetchCoffeeVariant();
        fetchIngredients();
    }, []);

    const fetchCoffeeVariant = async () => {
        try {
            const res = await CoffeeVariantService.getAll({ per_page: -1 });
            const data = Array.isArray(res) ? res : (res?.data || []);
            setCoffeeVariant(data);
        } catch (error) {
            console.error("Error fetching coffee variants:", error);
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
            const data = await CoffeeIngredientsService.getById(id);
            if (data) {
                setCoffeeVariantId(
                    data.coffee_variant_id ? String(data.coffee_variant_id) : ""
                );
                setItems([
                    {
                        ingredients_id: data.ingredients_id ? String(data.ingredients_id) : "",
                        unite: data.unite || "",
                        quantity: data.quantity !== undefined && data.quantity !== null ? String(data.quantity) : ""
                    }
                ]);
            }
        } catch (error) {
            console.error("Error fetching record by id:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (IsEditMode) {
            fetchById();
        }
    }, [id, IsEditMode]);

    // Add new ingredient row
    const handleAddRow = () => {
        setItems((prev) => [...prev, { ...initialRow }]);
    };

    // Remove an ingredient row (minimum 1 row)
    const handleRemoveRow = (index) => {
        if (items.length <= 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    // Update row fields
    const handleRowChange = (index, field, value) => {
        setItems((prev) => {
            const updated = [...prev];
            const currentRow = { ...updated[index], [field]: value };

            // When an ingredient is selected, auto-fill unit if available
            if (field === "ingredients_id") {
                const selectedIng = ingredients.find(
                    (ing) => String(ing.id) === String(value)
                );
                if (selectedIng && selectedIng.unite) {
                    currentRow.unite = selectedIng.unite;
                }
            }

            updated[index] = currentRow;
            return updated;
        });
    };

    const handleClear = () => {
        setCoffeeVariantId("");
        setItems([{ ...initialRow }]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!coffeeVariantId) {
            alert("Please select a Coffee Variant");
            return;
        }

        // Validate that all rows have an ingredient, quantity, and unite
        for (let i = 0; i < items.length; i++) {
            const row = items[i];
            if (!row.ingredients_id) {
                alert(`Please select an Ingredient for Row #${i + 1}`);
                return;
            }
            if (!row.quantity || Number(row.quantity) <= 0) {
                alert(`Please enter a valid Quantity for Row #${i + 1}`);
                return;
            }
            if (!row.unite) {
                alert(`Please enter a Unit for Row #${i + 1}`);
                return;
            }
        }

        try {
            setLoading(true);

            if (IsEditMode) {
                const payload = {
                    coffee_variant_id: Number(coffeeVariantId),
                    ingredients_id: Number(items[0].ingredients_id),
                    quantity: Number(items[0].quantity),
                    unite: items[0].unite
                };
                await CoffeeIngredientsService.update(id, payload);
            } else {
                const payload = {
                    coffee_variant_id: Number(coffeeVariantId),
                    items: items.map((item) => ({
                        ingredients_id: Number(item.ingredients_id),
                        quantity: Number(item.quantity),
                        unite: item.unite
                    }))
                };
                await CoffeeIngredientsService.create(payload);
                handleClear();
            }

            navigate("/coffeeIngredients");
            
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Failed to save data. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm px-5 py-5">
            {/* Header */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                <div>
                    <h2 className="text-gray-800 font-semibold text-xl">
                        {IsEditMode ? "Edit Coffee Ingredient" : "Create Coffee Ingredients"}
                    </h2>
                     
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/coffeeIngredients")}
                    className="cursor-pointer bg-green-700 hover:bg-green-800 px-4 py-1.5 flex gap-2 items-center rounded-sm text-white text-sm font-medium hover:scale-105 active:scale-95 duration-200"
                >
                    <span className="text-lg">
                        <TiArrowBackOutline />
                    </span>
                    <span>Back</span>
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Coffee Variant Selection */}
                <div className="bg-gray-50/70 p-4 rounded-lg border border-gray-200">
                    <label
                        htmlFor="coffee_variant_id"
                        className="text-sm font-semibold text-gray-700 block mb-1.5"
                    >
                        Coffee Variant <span className="text-rose-500">*</span>
                    </label>
                    <select
                        name="coffee_variant_id"
                        id="coffee_variant_id"
                        value={coffeeVariantId}
                        onChange={(e) => setCoffeeVariantId(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-600 focus:ring-2 focus:ring-green-100 hover:border-gray-400 cursor-pointer"
                    >
                        <option value="" disabled>
                            Select Coffee Variant...
                        </option>
                        {CoffeeVariant.map((coffeev, index) => (
                            <option key={coffeev.id} value={coffeev.id}>
                                {index + 1} - {coffeev.coffee?.name || "Coffee"} ({coffeev.size || "Standard"})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Ingredients List / Column Section */}
                <div className="border border-gray-200 bg-gray-50/40 p-4 rounded-lg space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-gray-200">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">
                                Ingredients List ({items.length})
                            </h3>
                        </div>

                        {!IsEditMode && (
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-sm shadow-xs transition-all duration-200 cursor-pointer self-start sm:self-auto"
                            >
                                <span className="text-base leading-none">
                                    <IoMdAddCircleOutline />
                                </span>
                                <span>Add Ingredient</span>
                            </button>
                        )}
                    </div>

                    {/* Dynamic Rows */}
                    <div className="space-y-3 pt-1">
                        {items.map((row, index) => (
                            <div
                                key={index}
                                className="relative flex flex-col md:flex-row items-start md:items-center gap-3 bg-white p-3.5 border border-gray-200 rounded-lg shadow-xs hover:border-emerald-300 transition-all duration-200"
                            >
                                {/* Row Number Badge */}
                                <span className="absolute -top-2.5 left-3 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                    #{index + 1}
                                </span>

                                {/* Ingredient Select */}
                                <div className="w-full md:flex-[2] pt-1 md:pt-0">
                                    <label className="text-xs font-medium text-gray-600 block mb-1">
                                        Ingredient <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={row.ingredients_id}
                                        onChange={(e) =>
                                            handleRowChange(index, "ingredients_id", e.target.value)
                                        }
                                        required
                                        className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50/50 border border-gray-300 rounded-md outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>
                                            Select Ingredient...
                                        </option>
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
                                        value={row.unite}
                                        onChange={(e) =>
                                            handleRowChange(index, "unite", e.target.value)
                                        }
                                        placeholder="e.g. ml, g, pump"
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
                                        value={row.quantity}
                                        onChange={(e) =>
                                            handleRowChange(index, "quantity", e.target.value)
                                        }
                                        placeholder="e.g. 30"
                                        required
                                        className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50/50 border border-gray-300 rounded-md outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                                    />
                                </div>

                                {/* Delete Row Button */}
                                {!IsEditMode && items.length > 1 && (
                                    <div className="w-full md:w-auto flex justify-end md:pt-5">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRow(index)}
                                            className="flex items-center justify-center w-9 h-9 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-200 rounded-md transition-all duration-200 cursor-pointer shadow-2xs"
                                            title="Delete Ingredient Row"
                                        >
                                            <RiDeleteBinLine className="text-base" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center min-w-[130px] px-5 py-2.5 bg-green-700 hover:bg-green-800 active:scale-95 text-white font-medium text-sm rounded-sm shadow-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Saving...</span>
                            </div>
                        ) : IsEditMode ? (
                            <div className="flex items-center gap-2">
                                <span>Update</span>
                                <FaRegEdit className="text-base" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Save All ({items.length})</span>
                                <MdOutlineSaveAlt className="text-base" />
                            </div>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CoffeeIngredientsForm;