import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IngredientService } from "../../service/IngredientService";
import { TiArrowBackOutline } from "react-icons/ti";
import { MdOutlineSaveAlt } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";

const IngredientsForm = () => {
    const [loading, setLoading] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const IsEditMode = Boolean(id);

    const [form, setForm] = useState({
        name: "",
        unite: "",
        qty_stock: "",
        min_stock:"",
        status: ""
    });

    const handleInput = (e) => {
        const { name, value } = e.target;
        setForm((pre) => ({ ...pre, [name]: value }));
    };

    const handleClear = () => {
        setForm({
            name: "",
            unite: "",
            qty_stock: "",
            min_stock: "",
            status: ""
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let result;
        try {
            setLoading(true);
            if (IsEditMode) {
                result = await IngredientService.update(id, form);
            } else {
                result = await IngredientService.create(form);
                handleClear();
            }
            navigate("/ingredients");
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchById = async () => {
        try {
            setLoading(true);
            const data = await IngredientService.getById(id);
            if (data) {
                setForm({
                    name: data.name || "",
                    unite: data.unite || "",
                    min_stock: data.min_stock || "",
                    qty_stock: data.qty_stock !== undefined && data.qty_stock !== null ? String(data.qty_stock) : "",
                    status: data.status !== undefined && data.status !== null ? String(data.status) : ""
                });
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (IsEditMode) {
            fetchById();
        }
    }, [id, IsEditMode]);

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm px-5 py-4">
            <div className="flex justify-between">
                <div className="text-black/70 font-medium text-xl">
                    {IsEditMode ? "Edit Ingredient" : "Create Ingredient"}
                </div>
                <div
                    onClick={() => navigate("/ingredients")}
                    className="cursor-pointer bg-green-700 px-4 py-1 flex gap-2 items-center rounded-sm text-white font-medium hover:scale-110 duration-400"
                >
                    <span className="text-lg">
                        <TiArrowBackOutline />
                    </span>
                    <span>Back</span>
                </div>
            </div>

            <div>
                <form onSubmit={handleSubmit} className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                        Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={form.name}
                        onChange={handleInput}
                        placeholder="Enter ingredient name..."
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400"
                    />

                    <label htmlFor="unite" className="text-sm font-semibold text-gray-700">
                        Unit
                    </label>
                    <input
                        type="text"
                        name="unite"
                        id="unite"
                        value={form.unite}
                        onChange={handleInput}
                        placeholder="e.g. kg, g, ml, can, bottle..."
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400"
                    />

                    <label htmlFor="qty_stock" className="text-sm font-semibold text-gray-700">
                        Quantity Stock
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        name="qty_stock"
                        id="qty_stock"
                        value={form.qty_stock}
                        onChange={handleInput}
                        placeholder="Enter stock quantity..."
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400"
                    />

                    <label htmlFor="min_stock" className="text-sm font-semibold text-gray-700">
                        Min Stock
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        name="min_stock"
                        id="min_stock"
                        value={form.min_stock}
                        onChange={handleInput}
                        placeholder="Enter min stock quantity..."
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400"
                    />

                    <label htmlFor="status" className="text-sm font-semibold text-gray-700">
                        Status
                    </label>
                    <select
                        name="status"
                        id="status"
                        value={form.status}
                        onChange={handleInput}
                        className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                    >
                        <option value="" disabled>
                            Select status...
                        </option>
                        <option value="in stock">In Stock</option>
                        <option value="out of stock">Out of Stock</option>
                        <option value="low stock">Low Stock</option>
                    </select>

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
                </form>
            </div>
        </div>
    );
};

export default IngredientsForm;
