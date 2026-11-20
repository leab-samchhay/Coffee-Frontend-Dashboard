import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CustomerService } from "../../service/CustomerService";
import { TiArrowBackOutline } from "react-icons/ti";
import { MdOutlineSaveAlt } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";

const CustomerForm = () => {
    const [loading, setLoading] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    const IsEditMode = Boolean(id);
    
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        status: "1"
    });

    const handleInput = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleClear = () => {
        setForm({
            name: "",
            phone: "",
            email: "",
            address: "",
            status: "1"
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                name: form.name,
                phone: form.phone || null,
                email: form.email || null,
                address: form.address || null,
                status: Number(form.status)
            };

            if (IsEditMode) {
                await CustomerService.update(id, payload);
            } else {
                await CustomerService.create(payload);
                handleClear(); 
            }
            navigate('/customers');
        } catch (error) {
            console.error("Error saving customer:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchById = async () => {
        try {
            setLoading(true);
            const data = await CustomerService.getById(id); 
            if (data) {
                setForm({
                    name: data.name || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    address: data.address || "",
                    status: data.status !== undefined && data.status !== null ? String(data.status) : "1"
                });
            }
        } catch (error) {
            console.error("Error fetching customer:", error);
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
            <div className="flex justify-between items-center mb-4">
                <div className="text-black/70 font-medium text-xl">
                    {IsEditMode ? "Edit Customer" : "Create Customer"}
                </div>
                <div 
                    onClick={() => navigate("/customers")}
                    className="cursor-pointer bg-green-700 px-4 py-1 flex gap-2 items-center rounded-sm text-white font-medium hover:scale-105 duration-200"
                >
                    <span className="text-lg"><TiArrowBackOutline /></span>
                    <span>Back</span>
                </div>
            </div>

            <div>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                            placeholder="Enter customer name..."
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 hover:border-gray-400 placeholder:text-gray-400" 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="text-sm font-semibold text-gray-700 block mb-1">
                                Phone Number
                            </label>
                            <input 
                                type="text"
                                name="phone"
                                id="phone"
                                value={form.phone}
                                onChange={handleInput}
                                placeholder="e.g. 012345678"
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 hover:border-gray-400 placeholder:text-gray-400" 
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="text-sm font-semibold text-gray-700 block mb-1">
                                Email
                            </label>
                            <input 
                                type="email"
                                name="email"
                                id="email"
                                value={form.email}
                                onChange={handleInput}
                                placeholder="e.g. customer@example.com"
                                className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 hover:border-gray-400 placeholder:text-gray-400" 
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="text-sm font-semibold text-gray-700 block mb-1">
                            Status <span className="text-rose-500">*</span>
                        </label>
                        <select 
                            name="status"
                            id="status"
                            value={form.status}
                            onChange={handleInput}
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 hover:border-gray-400 cursor-pointer"
                        >
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>

                    {/* Address */}
                    <div>
                        <label htmlFor="address" className="text-sm font-semibold text-gray-700 block mb-1">
                            Address
                        </label>
                        <textarea 
                            name="address"
                            id="address"
                            rows="3"
                            value={form.address}
                            onChange={handleInput}
                            placeholder="Enter customer address..."
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 hover:border-gray-400 placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex items-center justify-center min-w-[120px] px-5 py-2.5 bg-green-700 hover:bg-green-800 active:bg-green-900 text-white font-medium text-sm rounded-sm shadow-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
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

export default CustomerForm;
