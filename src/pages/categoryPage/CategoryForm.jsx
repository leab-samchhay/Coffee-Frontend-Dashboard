import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CategoryService } from "../../service/CategoryService";
import { TiArrowBackOutline } from "react-icons/ti";
import { MdOutlineSaveAlt } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";

const ImageUrl = "http://127.0.0.1:8000/storage/";

const CategoryForm = () => {
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const IsEditMode = Boolean(id);
    
    const [form, setForm] = useState({
        name: "",
        image: null,
        description: "",
        status: ""
    });

    const handleInput = (e) => {
        const { name, value, type, files } = e.target;
        if (type === "file") {
            const file = files[0];
            setForm((prev) => ({ ...prev, [name]: file }));
            if (file) {
                setPreviewImage(URL.createObjectURL(file));
            } else {
                setPreviewImage(null);
            }
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleClear = () => {
        setForm({
            name: "",
            image: null,
            description: "",
            status: ""
        });
        setPreviewImage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const data = new FormData();
            data.append("name", form.name);
            data.append("description", form.description || "");
            data.append("status", form.status);

            if (form.image instanceof File) {
                data.append("image", form.image);
            }

            if (IsEditMode) {
                data.append("_method", "PUT");
                await CategoryService.update(id, data);
            } else {
                await CategoryService.create(data);
                handleClear(); 
            }
            navigate('/categories');
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchById = async () => {
        try {
            setLoading(true);
            const data = await CategoryService.getById(id); 
            if (data) {
                setForm({
                    name: data.name || "",
                    image: null,
                    description: data.description || "",
                    status: data.status !== undefined && data.status !== null ? String(data.status) : ""
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
        if (IsEditMode) {
            fetchById();
        }
    }, [id, IsEditMode]);

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm px-5 py-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-black/70 font-medium text-xl">
                    {IsEditMode ? "Edit Category" : "Create Category"}
                </div>
                <div 
                    onClick={() => navigate("/categories")}
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
                            placeholder="Enter category name..."
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
                                    alt="Category Preview"
                                    className="object-cover w-full h-full"
                                />
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
                            required
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 cursor-pointer"
                        >
                            <option value="" disabled>Select status...</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>

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
                            placeholder="Enter category description..."
                            className="w-full px-3.5 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-sm shadow-xs outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-blue-100 hover:border-gray-400 placeholder:text-gray-400 resize-none"
                        />
                    </div>

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

export default CategoryForm;
