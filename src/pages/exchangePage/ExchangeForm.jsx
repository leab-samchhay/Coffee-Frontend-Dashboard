import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ExchangeService } from "../../service/ExchangeService";
import { TiArrowBackOutline } from "react-icons/ti";
import { MdOutlineSaveAlt } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";

const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

const initialFormState = {
    date: getTodayDateString(),
    rate: ""
};

const ExchangeForm = () => {
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
        setForm({
            date: getTodayDateString(),
            rate: ""
        });
    };

    const fetchById = async () => {
        try {
            setLoading(true);
            const data = await ExchangeService.getById(id);
            if (data) {
                setForm({
                    date: data.date || getTodayDateString(),
                    rate: data.rate !== undefined && data.rate !== null ? String(data.rate) : ""
                });
            }
        } catch (error) {
            console.error("Error fetching exchange rate by ID:", error);
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

        if (!form.date) {
            alert("Please select a date");
            return;
        }

        if (form.rate === "" || Number(form.rate) <= 0) {
            alert("Please enter a valid exchange rate");
            return;
        }

        const payload = {
            date: form.date,
            rate: Number(form.rate)
        };

        try {
            setLoading(true);
            if (IsEditMode) {
                await ExchangeService.update(id, payload);
            } else {
                await ExchangeService.create(payload);
                handleClear();
            }
            navigate('/exchanges');
        } catch (error) {
            console.error("Error saving exchange rate:", error);
            const err = error.response?.data?.message || "Failed to save exchange rate.";
            alert(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm px-5 py-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-black/70 font-medium text-xl">
                    {IsEditMode ? "Edit Exchange Rate" : "Create Exchange Rate"}
                </div>
                <div 
                    onClick={() => navigate("/exchanges")}
                    className="cursor-pointer bg-green-700 px-4 py-1 flex gap-2 items-center rounded-sm text-white font-medium hover:scale-110 duration-400"
                >
                    <span className="text-lg"><TiArrowBackOutline /></span>
                    <span>Back</span>
                </div>
            </div>

            <div>
                <form onSubmit={handleSubmit} className="space-y-4 w-full">
                    {/* Date Input */}
                    <div>
                        <label htmlFor="date" className="text-sm font-semibold text-gray-700 block mb-1">
                            Date <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            type="date"
                            name="date"
                            id="date"
                            value={form.date}
                            onChange={handleInput}
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400" 
                        />
                    </div>

                    {/* Rate Input */}
                    <div>
                        <label htmlFor="rate" className="text-sm font-semibold text-gray-700 block mb-1">
                            Exchange Rate (៛ / USD) <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            type="number"
                            step="any"
                            min="0"
                            name="rate"
                            id="rate"
                            value={form.rate}
                            onChange={handleInput}
                            placeholder="e.g. 4100"
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400" 
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

export default ExchangeForm;
