import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CoffeeService } from "../../service/CoffeeService";
import { CategoryService } from "../../service/CategoryService";
import { TiArrowBackOutline } from "react-icons/ti";
import { MdOutlineSaveAlt } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import DiscoundService from "../../service/DiscoundService";

const ImageUrl = "http://127.0.0.1:8000/storage/";

const initialFormState = {
    category_id: "",
    name: "",
    discound_item: "",
    tax_item: "",
    discription: "",
    status: "1",
    image: null
};

const CoffeeForm = () => {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [discoound,setDiscound] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const IsEditMode = Boolean(id);

    const [form, setForm] = useState(initialFormState);

    const handleInput = (e) => {
        const { name, value, type, files } = e.target;
        if (type === "file") {
            const file = files?.[0] || null;
            setForm((prev) => ({ ...prev, [name]: file }));
            if (file) {
                setPreviewImage(URL.createObjectURL(file));
            }
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleRemoveImage = () => {
        setForm((prev) => ({ ...prev, image: null }));
        setPreviewImage(null);
        const fileInput = document.getElementById("image");
        if (fileInput) fileInput.value = "";
    };

    const handleClear = () => {
        setForm(initialFormState);
        handleRemoveImage();
    };

    const fetchCategories = async () => {
        try {
            const res = await CategoryService.getAll({ per_page: -1 });
            const data = Array.isArray(res) ? res : (res?.data || []);
            setCategories(data);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchDiscound = async () => {
        try {
            const res = await DiscoundService.getAll(1, 1000);
            
            const data = res?.data || [];
            setDiscound(data);
        } catch (err) {
            console.log(err);
        }
    }

    const fetchById = async () => {
        try {
            setLoading(true);
            const data = await CoffeeService.getById(id);
            if (data) {
                setForm({
                    category_id: data.category_id !== undefined && data.category_id !== null ? String(data.category_id) : "",
                    name: data.name || "",
                    discound_item: data.discound_item || "",
                    tax_item: data.tax_item || "",
                    discription: data.discription || data.description || "",
                    status: data.status !== undefined && data.status !== null ? String(data.status) : "1",
                    image: null
                });
                if (data.image) {
                    setPreviewImage(
                        data.image.startsWith("http")
                            ? data.image
                            : `${ImageUrl}${data.image}`
                    );
                }
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchDiscound();
    }, []);

    useEffect(() => {
        if (IsEditMode) {
            fetchById();
        }
    }, [id, IsEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            if (IsEditMode) {
                if (form.image instanceof File) {
                    const data = new FormData();
                    data.append("name", form.name);
                    data.append("discound_item", form.discound_item);
                    data.append("tax_item", form.tax_item);
                    data.append("category_id", form.category_id);
                    data.append("discription", form.discription || "");
                    data.append("status", form.status);
                    data.append("image", form.image);
                    data.append("_method", "PUT");
                    await CoffeeService.update(id, data);
                } else {
                    const payload = {
                        name: form.name,
                        discound_item: form.discound_item,
                        tax_item: form.tax_item,
                        category_id: Number(form.category_id) || form.category_id,
                        discription: form.discription || "",
                        status: Number(form.status)
                    };
                    await CoffeeService.update(id, payload);
                }
            } else {
                const data = new FormData();
                data.append("name", form.name);
                data.append("discound_item", form.discound_item);
                data.append("tax_item", form.tax_item);
                data.append("category_id", form.category_id);
                data.append("discription", form.discription || "");
                data.append("status", form.status);
                if (form.image) {
                    data.append("image", form.image);
                }
                await CoffeeService.create(data);
                handleClear();
            }
            navigate("/coffee");
        } catch (error) {
            console.error("Save error:", error.response?.data || error);
            const msg = error.response?.data?.message || "Something went wrong!";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm px-5 py-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-black/70 font-medium text-xl">
                    {IsEditMode ? "Edit Coffee" : "Create Coffee"}
                </div>
                <div
                    onClick={() => navigate("/coffee")}
                    className="cursor-pointer bg-green-700 px-4 py-1 flex gap-2 items-center rounded-sm text-white font-medium hover:scale-110 duration-400"
                >
                    <span className="text-lg"><TiArrowBackOutline /></span>
                    <span>Back</span>
                </div>
            </div>

            <div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label htmlFor="name" className="text-sm font-semibold text-gray-700 block mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={form.name}
                            onChange={handleInput}
                            placeholder="Enter coffee name..."
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <label htmlFor="category_id" className="text-sm font-semibold text-gray-700 block mb-1">
                            Category
                        </label>
                        <select
                            name="category_id"
                            id="category_id"
                            value={form.category_id}
                            onChange={handleInput}
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                        >
                            <option value="" disabled>Select Category...</option>
                            {categories.map((cat, index) => (
                                <option key={cat.id} value={cat.id}>
                                    {index + 1} - {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="discound_item" className="text-sm font-semibold text-gray-700 block mb-1">
                            Discound
                        </label>
                        <select
                            name="discound_item"
                            id="discound_item"
                            value={form.discound_item}
                            onChange={handleInput}
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                        >
                            <option value="" disabled>Select discound</option>
                            {discoound.map((cat, index) => (
                                <option key={cat.id} value={cat.id}>
                                    Discound {cat.qty_percent}%  ({cat.start_date} to {cat.end_date})
                                </option>
                            ))}
                        </select>
                    </div>

                    

                    <div>
                        <label htmlFor="tax_item" className="text-sm font-semibold text-gray-700 block mb-1">
                            Tax
                        </label>
                        <input
                            type="text"
                            name="tax_item"
                            id="tax_item"
                            value={form.tax_item}
                            onChange={handleInput}
                            placeholder="Enter tax"
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <label htmlFor="image" className="text-sm font-semibold text-gray-700 block mb-1">
                            Image
                        </label>
                        <input
                            type="file"
                            name="image"
                            id="image"
                            accept="image/*"
                            onChange={handleInput}
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                        />

                        {previewImage && (
                            <div className="mt-3 relative w-32 h-32 border border-gray-200 rounded-md overflow-hidden bg-gray-50 shadow-sm flex items-center justify-center">
                                <img
                                    src={previewImage}
                                    alt="Coffee Preview"
                                    className="object-cover w-full h-full"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow transition-all cursor-pointer"
                                    title="Remove image"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

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
                            <option value="" disabled>Select status...</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="discription" className="text-sm font-semibold text-gray-700 block mb-1">
                            Description
                        </label>
                        <textarea
                            name="discription"
                            id="discription"
                            rows="4"
                            value={form.discription}
                            onChange={handleInput}
                            placeholder="Enter coffee description..."
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
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

export default CoffeeForm;