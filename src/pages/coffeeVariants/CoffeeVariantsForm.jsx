import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CoffeeVariantService } from "../../service/CoffeeVariantService";
import { CoffeeService } from "../../service/CoffeeService";
import { TiArrowBackOutline } from "react-icons/ti";
import { MdOutlineSaveAlt } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";

const initialFormState = {
    coffee_id: "",
    size: "",
    price: "",
    status_variants: "1"
};

const CoffeeVariantsForm = () => {
    const [loading, setLoading] = useState(false);
    const [coffees, setCoffees] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();
    const IsEditMode = Boolean(id);

    const [form, setForm] = useState(initialFormState);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setForm(initialFormState);
    };

    const fetchCoffees = async () => {
        try {
            const res = await CoffeeService.getAll({ per_page: -1 });
            const data = Array.isArray(res) ? res : (res?.data || []);
            setCoffees(data);
        } catch (error) {
            console.error("Error fetching coffees:", error);
        }
    };

    const fetchById = async () => {
        try {
            setLoading(true);
            const data = await CoffeeVariantService.getById(id);
            if (data) {
                setForm({
                    coffee_id: data.coffee_id !== undefined && data.coffee_id !== null ? String(data.coffee_id) : "",
                    size: data.size || "",
                    price: data.price !== undefined && data.price !== null ? String(data.price) : "",
                    status_variants: data.status_variants !== undefined && data.status_variants !== null ? String(data.status_variants) : "1"
                });
            }
        } catch (error) {
            console.error("Error fetching coffee variant by ID:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoffees();
    }, []);

    useEffect(() => {
        if (IsEditMode) {
            fetchById();
        }
    }, [id, IsEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.coffee_id) {
            alert("Please select a Coffee");
            return;
        }

        if (!form.size.trim()) {
            alert("Please enter a size");
            return;
        }

        if (form.price === "" || Number(form.price) < 0) {
            alert("Please enter a valid price");
            return;
        }

        const payload = {
            coffee_id: Number(form.coffee_id),
            size: form.size.trim(),
            price: Number(form.price),
            status_variants: Number(form.status_variants)
        };

        try {
            setLoading(true);
            if (IsEditMode) {
                await CoffeeVariantService.update(id, payload);
            } else {
                await CoffeeVariantService.create(payload);
                handleClear();
            }
            navigate('/coffeeVariants');
        } catch (error) {
            console.error("Error saving coffee variant:", error);
            const errorMsg = error.response?.data?.message || "Failed to save Coffee Variant.";
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm px-5 py-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-black/70 font-medium text-xl">
                    {IsEditMode ? "Edit Coffee Variant" : "Create Coffee Variant"}
                </div>
                <div 
                    onClick={() => navigate("/coffeeVariants")}
                    className="cursor-pointer bg-green-700 px-4 py-1 flex gap-2 items-center rounded-sm text-white font-medium hover:scale-110 duration-400"
                >
                    <span className="text-lg"><TiArrowBackOutline /></span>
                    <span>Back</span>
                </div>
            </div>

            <div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Coffee Select */}
                    <div>
                        <label htmlFor="coffee_id" className="text-sm font-semibold text-gray-700 block mb-1">
                            Coffee <span className="text-rose-500">*</span>
                        </label>
                        <select
                            name="coffee_id"
                            id="coffee_id"
                            value={form.coffee_id}
                            onChange={handleInput}
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                        >
                            <option value="" disabled>Select Coffee...</option>
                            {coffees.map((coffee, index) => (
                                <option key={coffee.id} value={coffee.id}>
                                    {index + 1} - {coffee.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Size Input */}
                    <div>
                        <label htmlFor="size" className="text-sm font-semibold text-gray-700 block mb-1">
                            Size <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            type="text"
                            name="size"
                            id="size"
                            value={form.size}
                            onChange={handleInput}
                            placeholder="Enter size (e.g. Small, Medium, Large, Hot, Iced)..."
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400" 
                        />
                    </div>

                    {/* Price Input */}
                    <div>
                        <label htmlFor="price" className="text-sm font-semibold text-gray-700 block mb-1">
                            Price ($) <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            type="number"
                            step="0.01"
                            min="0"
                            name="price"
                            id="price"
                            value={form.price}
                            onChange={handleInput}
                            placeholder="Enter price (e.g. 2.50)..."
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400" 
                        />
                    </div>

                    {/* Status Select */}
                    <div>
                        <label htmlFor="status_variants" className="text-sm font-semibold text-gray-700 block mb-1">
                            Status
                        </label>
                        <select 
                            name="status_variants"
                            id="status_variants"
                            value={form.status_variants}
                            onChange={handleInput}
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                        >
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex items-center justify-center min-w-[120px] px-5 py-2.5 bg-green-700 hover:bg-green-800 active:bg-blue-800 text-white font-medium text-sm rounded-sm shadow-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Loading...</span>
                                </div>
                            ) : IsEditMode ? (
                                <div className="flex items-center gap-2">
                                    <span>Update</span>
                                    <FaRegEdit className="text-base" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>Save</span>
                                    <MdOutlineSaveAlt className="text-base" />
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CoffeeVariantsForm;
