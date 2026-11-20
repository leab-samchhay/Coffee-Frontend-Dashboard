import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { OrderModeService } from "../../service/OrderModeService";
import { TiArrowBackOutline } from "react-icons/ti";
import { MdOutlineSaveAlt } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";

const initialFormState = {
    name: "",
    description: "",
    status: "1"
};

const OrderModeForm = () => {
    const [loading, setLoading] = useState(false);
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

    const fetchById = async () => {
        try {
            setLoading(true);
            const data = await OrderModeService.getById(id);
            if (data) {
                setForm({
                    name: data.name || "",
                    description: data.description || "",
                    status: data.status !== undefined && data.status !== null ? String(data.status) : "1"
                });
            }
        } catch (error) {
            console.error("Error fetching order mode by ID:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (IsEditMode) {
            fetchById();
        }
    }, [id, IsEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert("Please enter order mode name");
            return;
        }

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            status: Number(form.status)
        };

        try {
            setLoading(true);
            if (IsEditMode) {
                await OrderModeService.update(id, payload);
            } else {
                await OrderModeService.create(payload);
                handleClear();
            }
            navigate('/orderModes');
        } catch (error) {
            console.error("Error saving order mode:", error);
            const err = error.response?.data?.message || "Failed to save order mode.";
            alert(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm px-5 py-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-black/70 font-medium text-xl">
                    {IsEditMode ? "Edit Order Mode" : "Create Order Mode"}
                </div>
                <div 
                    onClick={() => navigate("/orderModes")}
                    className="cursor-pointer bg-green-700 px-4 py-1 flex gap-2 items-center rounded-sm text-white font-medium hover:scale-110 duration-400"
                >
                    <span className="text-lg"><TiArrowBackOutline /></span>
                    <span>Back</span>
                </div>
            </div>

            <div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="text-sm font-semibold text-gray-700 block mb-1">
                            Name <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            type="text"
                            name="name"
                            id="name"
                            value={form.name}
                            onChange={handleInput}
                            placeholder="e.g. Dine In, Take Away, Delivery..."
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
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="text-sm font-semibold text-gray-700 block mb-1">
                            Description
                        </label>
                        <textarea 
                            name="description"
                            id="description"
                            rows="4"
                            value={form.description}
                            onChange={handleInput}
                            placeholder="Enter description..."
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400 resize-none"
                        />
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

export default OrderModeForm;
